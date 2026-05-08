// DualTrackScheduleView.jsx
// Edit mode additions vs original:
//   • Lab blocks are now draggable (swap with other lab blocks or theory cells)
//   • Clicking an empty theory cell opens a slot picker
//   • Clicking an occupied cell (non-BREAK) still toggles lock (removed — lock
//     concept is gone; click now opens picker to reassign or clear)
import React, { useState, useCallback, useRef } from "react";
import { FlaskConical, Clock, Zap, X } from "lucide-react";
import {
  DAYS,
  TIME_LABELS,
  LUNCH_PI,
  BEFORE_LUNCH,
  AFTER_LUNCH,
  AM_LAB_BLOCK,
  PM_LAB_BLOCK,
} from "./constants";
import { SLOT_COLORS, LAB_COLOR } from "./colors";
import { getLabBlock } from "./helpers";
import SlotPill from "./SlotPill";
import LabMergedCell from "./LabMergedCell";

// ── SlotPickerPopover ─────────────────────────────────────────────────────────
// Small popover shown when clicking a cell in edit mode.
// Shows all available slot names (from slotsData) + "clear" option.

const SlotPickerPopover = ({
  slotNames,
  labSlotNames,
  onPick,
  onClose,
  anchorRef,
}) => {
  // Position near anchor
  const style = anchorRef?.current
    ? (() => {
        const r = anchorRef.current.getBoundingClientRect();
        return {
          position: "fixed",
          top: r.bottom + 6,
          left: Math.max(8, r.left - 40),
          zIndex: 9999,
        };
      })()
    : { position: "fixed", top: 100, left: 100, zIndex: 9999 };

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        style={style}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl p-3 w-56"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Assign slot
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={12} />
          </button>
        </div>

        {slotNames.length > 0 && (
          <>
            <p className="text-[9px] text-gray-400 mb-1.5">Theory slots</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {slotNames.map((name) => {
                const color =
                  SLOT_COLORS[name] ??
                  "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300";
                return (
                  <button
                    key={name}
                    onClick={() => onPick(name, "lecture")}
                    className={`px-2 py-1 rounded-md border text-[11px] font-bold transition-colors hover:opacity-80 ${color}`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {labSlotNames.length > 0 && (
          <>
            <p className="text-[9px] text-gray-400 mb-1.5">Lab slots</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {labSlotNames.map((name) => (
                <button
                  key={name}
                  onClick={() => onPick(name, "lab")}
                  className="px-2 py-1 rounded-md border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 text-[11px] font-bold transition-colors hover:opacity-80 flex items-center gap-1"
                >
                  <FlaskConical size={9} />
                  {name}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          onClick={() => onPick(null, "free")}
          className="w-full text-[11px] px-2 py-1 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:opacity-80 transition-colors"
        >
          Clear cell
        </button>
      </div>
    </>
  );
};

// ── main component ────────────────────────────────────────────────────────────

const DualTrackScheduleView = ({
  scheduleData,
  slotsData,
  editMode,
  onCellChange, // (day, track, pi, slot_name, slot_type) → void
  onLabSwap, // (srcDay, srcTrack, dstDay, dstTrack) → void
  onSwapCells, // existing theory swap
}) => {
  const [dragSrc, setDragSrc] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [picker, setPicker] = useState(null); // { day, track, pi, anchor }
  const pickerAnchorRef = useRef(null);

  const { grid, meta, generated_at } = scheduleData;
  const cellKey = (day, track, pi) => `${day}-${track}-${pi}`;
  const labKey = (day, track) => `LAB-${day}-${track}`;

  // Derive available slot names from slotsData
  const theorySlotNames = slotsData
    ? slotsData.slots
        .filter((s) => s.slot_type !== "lab" && !s.slot_name.startsWith("LAB"))
        .map((s) => s.slot_name)
    : [];
  const labSlotNames = slotsData
    ? slotsData.slots
        .filter((s) => s.slot_type === "lab" || s.slot_name.startsWith("LAB"))
        .map((s) => s.slot_name)
    : [];

  // ── theory cell drag/drop ─────────────────────────────────────────────────

  const handleTheoryDrop = useCallback(
    (day, track, pi) => {
      if (!dragSrc || dragSrc.type !== "theory") return;
      setDragSrc(null);
      setDragOver(null);
      const { day: sd, track: st, pi: sp } = dragSrc;
      if (sd === day && st === track && sp === pi) return;
      onSwapCells(sd, st, sp, day, track, pi);
    },
    [dragSrc, onSwapCells],
  );

  // ── lab block drag/drop ───────────────────────────────────────────────────

  const handleLabDrop = useCallback(
    (dstDay, dstTrack) => {
      if (!dragSrc || dragSrc.type !== "lab") return;
      setDragSrc(null);
      setDragOver(null);
      const { day: srcDay, track: srcTrack } = dragSrc;
      if (srcDay === dstDay && srcTrack === dstTrack) return;
      if (onLabSwap) onLabSwap(srcDay, srcTrack, dstDay, dstTrack);
    },
    [dragSrc, onLabSwap],
  );

  // ── cell click → picker ───────────────────────────────────────────────────

  const handleCellClick = (e, day, track, pi) => {
    if (!editMode) return;
    pickerAnchorRef.current = e.currentTarget;
    setPicker({ day, track, pi });
  };

  const handlePick = (slot_name, slot_type) => {
    if (!picker) return;
    const { day, track, pi } = picker;
    if (onCellChange) onCellChange(day, track, pi, slot_name, slot_type);
    setPicker(null);
  };

  // ── render theory cell ────────────────────────────────────────────────────

  const renderTheoryCell = (cell, day, track) => {
    if (!cell) {
      // Empty cell — still clickable in edit mode to assign
      return (
        <td
          key="empty"
          className={`border border-gray-100 dark:border-gray-700 px-1 py-1 ${
            editMode
              ? "cursor-pointer hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 transition-colors"
              : ""
          }`}
          onClick={
            editMode ? (e) => handleCellClick(e, day, track, -1) : undefined
          }
        />
      );
    }

    const pi = cell.period_index;
    const key = cellKey(day, track, pi);
    const isOver = dragOver?.key === key;
    const name = cell.slot_name;
    const isBreak = name === "BREAK";
    const isDraggingSelf =
      dragSrc?.type === "theory" &&
      dragSrc.day === day &&
      dragSrc.track === track &&
      dragSrc.pi === pi;

    return (
      <td
        key={pi}
        className={[
          "border border-gray-100 dark:border-gray-700 px-1 py-1 transition-colors",
          editMode && !isBreak ? "cursor-pointer" : "",
          isOver && editMode ? "bg-emerald-50 dark:bg-emerald-900/20" : "",
          isDraggingSelf ? "opacity-40" : "",
        ].join(" ")}
        draggable={editMode && !!name && !isBreak}
        onDragStart={
          editMode && !isBreak
            ? () => setDragSrc({ type: "theory", day, track, pi })
            : undefined
        }
        onDragOver={
          editMode
            ? (e) => {
                e.preventDefault();
                setDragOver({ key });
              }
            : undefined
        }
        onDragLeave={editMode ? () => setDragOver(null) : undefined}
        onDrop={editMode ? () => handleTheoryDrop(day, track, pi) : undefined}
        onDragEnd={
          editMode
            ? () => {
                setDragSrc(null);
                setDragOver(null);
              }
            : undefined
        }
        onClick={
          editMode && !isBreak
            ? (e) => handleCellClick(e, day, track, pi)
            : undefined
        }
      >
        <SlotPill
          name={name}
          subLabel={name === "G" ? "Minor" : name === "H" ? "OE" : ""}
          editMode={editMode}
          isDragOver={isOver}
        />
      </td>
    );
  };

  // ── render lab merged cell (draggable in edit mode) ───────────────────────

  const renderLabCell = (
    labName,
    slotsData,
    subLabel,
    day,
    track,
    colSpan = 3,
  ) => {
    const lk = labKey(day, track);
    const isLabOver = dragOver?.key === lk && editMode;
    const isDraggingSelf =
      dragSrc?.type === "lab" && dragSrc.day === day && dragSrc.track === track;

    if (!editMode) {
      return (
        <LabMergedCell
          labName={labName}
          slotsData={slotsData}
          subLabel={subLabel}
        />
      );
    }

    // In edit mode, render a draggable td directly (bypassing LabMergedCell's td)
    return (
      <td
        colSpan={colSpan}
        className={[
          "border border-gray-100 dark:border-gray-700 px-1 py-1 cursor-grab active:cursor-grabbing transition-colors",
          isLabOver
            ? "bg-purple-50 dark:bg-purple-900/20"
            : "bg-purple-50/40 dark:bg-purple-900/10",
          isDraggingSelf ? "opacity-40" : "",
        ].join(" ")}
        draggable
        onDragStart={() => setDragSrc({ type: "lab", day, track })}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver({ key: lk });
        }}
        onDragLeave={() => setDragOver(null)}
        onDrop={() => handleLabDrop(day, track)}
        onDragEnd={() => {
          setDragSrc(null);
          setDragOver(null);
        }}
        onClick={(e) => handleCellClick(e, day, track, `LAB-${track}`)}
      >
        <div className="flex flex-col items-center justify-center h-full gap-0.5 py-0.5">
          <div className="flex items-center gap-1">
            <FlaskConical
              size={10}
              className="text-purple-500 dark:text-purple-400"
            />
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
              {labName ?? "LAB"}
            </span>
          </div>
          <span className="text-[9px] text-purple-400 dark:text-purple-500">
            {subLabel}
          </span>
          <span className="text-[8px] text-purple-300 dark:text-purple-600 italic mt-0.5">
            drag to swap
          </span>
        </div>
      </td>
    );
  };

  return (
    <div className="space-y-4">
      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
        {generated_at && (
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            Generated {new Date(generated_at).toLocaleString()}
          </span>
        )}
        {meta?.total_attempts && (
          <span className="flex items-center gap-1.5">
            <Zap size={12} />
            {meta.total_attempts} attempt{meta.total_attempts !== 1 ? "s" : ""}
          </span>
        )}
        {meta?.generation_time_ms && (
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            {meta.generation_time_ms}ms
          </span>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300">
          <span className="w-2 h-2 rounded-sm bg-indigo-200 dark:bg-indigo-700 block" />
          Track 1 — standard (theory AM, lab PM)
        </span>
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
          <span className="w-2 h-2 rounded-sm bg-purple-200 dark:bg-purple-700 block" />
          Track 2 — 3-lab batches (lab AM 9–12, theory PM)
        </span>
        {editMode && (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
            Click any cell to assign · Drag to swap
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <table
          className="border-collapse"
          style={{ minWidth: 820, width: "100%", tableLayout: "fixed" }}
        >
          <colgroup>
            <col style={{ width: 88 }} />
            <col style={{ width: 76 }} />
            <col style={{ width: 76 }} />
            <col style={{ width: 76 }} />
            <col style={{ width: 76 }} />
            <col style={{ width: 52 }} />
            <col style={{ width: 76 }} />
            <col style={{ width: 76 }} />
            <col style={{ width: 76 }} />
          </colgroup>
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/80">
              <th className="border border-gray-100 dark:border-gray-700 px-2 py-2.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                Day
              </th>
              {TIME_LABELS.map((t, i) => (
                <th
                  key={i}
                  className={`border border-gray-100 dark:border-gray-700 px-1 py-2.5 text-center text-[9px] font-semibold whitespace-nowrap ${
                    i === LUNCH_PI
                      ? "text-gray-300 dark:text-gray-600"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, di) => {
              const t1Cells = grid[day]?.track1 ?? [];
              const t2Cells = grid[day]?.track2 ?? null;
              const t1PmLab = getLabBlock(t1Cells, PM_LAB_BLOCK);
              const t2AmLab = getLabBlock(t2Cells, AM_LAB_BLOCK);
              const hasDualTrack = !!t2Cells && !!t2AmLab;
              const t1Map = Object.fromEntries(
                t1Cells.map((c) => [c.period_index, c]),
              );
              const t2Map = t2Cells
                ? Object.fromEntries(t2Cells.map((c) => [c.period_index, c]))
                : {};

              return (
                <React.Fragment key={day}>
                  {/* Track 1 */}
                  <tr
                    className={`${di > 0 ? "border-t-2 border-gray-200 dark:border-gray-700" : ""} hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors`}
                  >
                    <td
                      rowSpan={hasDualTrack ? 2 : 1}
                      className="border border-gray-100 dark:border-gray-700 px-2 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-50/50 dark:bg-gray-800/40 align-middle"
                    >
                      <div>{day.slice(0, 3)}</div>
                      {hasDualTrack && (
                        <div className="text-[9px] font-normal text-indigo-400 dark:text-indigo-500 mt-0.5">
                          T1↑ T2↓
                        </div>
                      )}
                    </td>

                    {BEFORE_LUNCH.map((pi) =>
                      renderTheoryCell(t1Map[pi], day, 1),
                    )}

                    {/* Lunch */}
                    <td
                      rowSpan={hasDualTrack ? 2 : 1}
                      className="border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-center align-middle px-0.5 py-1"
                    >
                      <span
                        className="text-[9px] text-gray-300 dark:text-gray-600 italic"
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          display: "inline-block",
                        }}
                      >
                        LUNCH
                      </span>
                    </td>

                    {t1PmLab
                      ? renderLabCell(t1PmLab, slotsData, "14:00–17:00", day, 1)
                      : AFTER_LUNCH.map((pi) =>
                          renderTheoryCell(t1Map[pi], day, 1),
                        )}
                  </tr>

                  {/* Track 2 */}
                  {hasDualTrack && (
                    <tr
                      className="bg-purple-50/30 dark:bg-purple-900/5 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors"
                      style={{ borderTop: "1.5px dashed #c4b5fd" }}
                    >
                      {renderLabCell(t2AmLab, slotsData, "9:00–12:00", day, 2)}
                      {renderTheoryCell(t2Map[3], day, 2)}
                      {AFTER_LUNCH.map((pi) =>
                        renderTheoryCell(t2Map[pi], day, 2),
                      )}
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Slot colour legend */}
      <div className="flex flex-wrap gap-2 pt-1">
        {Object.entries(SLOT_COLORS).map(([name, color]) => (
          <span
            key={name}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium ${color}`}
          >
            <span className="font-bold">{name}</span>
            {name === "G" && <span className="opacity-60">Minor</span>}
            {name === "H" && <span className="opacity-60">OE</span>}
          </span>
        ))}
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300">
          <FlaskConical size={9} />
          Lab
        </span>
      </div>

      {/* Slot picker popover */}
      {picker && editMode && (
        <SlotPickerPopover
          slotNames={theorySlotNames}
          labSlotNames={labSlotNames}
          anchorRef={pickerAnchorRef}
          onPick={handlePick}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
};

export default DualTrackScheduleView;
