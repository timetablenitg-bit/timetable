// DualTrackScheduleView.jsx
// Edit mode:
//   • Lab blocks are draggable (swap with other lab blocks or theory cells)
//   • Clicking an empty theory cell opens a slot picker
//   • Clicking an occupied cell (non-BREAK) opens the picker to reassign or clear
//
// CHANGED (scoping fix — manual-review changes stay out of the Schedule tab):
// This view previously rendered a cell's manual_entries directly (fuchsia
// "M" pills) and hidden_assignment_ids as an amber dot, so anything a
// Review-tab resolution touched leaked straight into the main Schedule tab.
// That's now removed entirely. manual_entries / hidden_assignment_ids only
// ever surface in InstituteView's per-batch rows and the Review tab itself
// — the Schedule tab shows exactly what the engine generated / what's been
// explicitly re-picked via the slot picker here, nothing else.
//
// A cell carrying manual_entries or hidden_assignment_ids is also LOCKED in
// this view now — not draggable, not clickable — so a generic Schedule-tab
// edit can never silently strand or corrupt a placement the admin made via
// Manual Review. It gets a small grey dot + tooltip pointing at Review/
// Institute instead.
//
// CHANGED (dual-track detection fix): whether a day has a second track is a
// SKELETON fact (does grid[day].track2 exist at all), never something the
// engine's actual placement should decide. Previously `hasDualTrack` also
// required a lab block to be present in the AM slot (`!!t2AmLab`), so a
// Monday with a structurally-defined track 2 but no lab placed in it would
// silently render as single-track — hiding the "2 tracks" label and the
// entire second row even though the skeleton says it exists. Track display
// must reflect the skeleton, not engine placement (see
// utils/resolveBatchTrack.js and models/timetableScheduleModel.js).
import React, { useState, useCallback, useRef } from "react";
import { FlaskConical, Clock, Zap, X, GripVertical } from "lucide-react";
import {
  DAYS,
  TIME_LABELS,
  LUNCH_PI,
  BEFORE_LUNCH,
  AFTER_LUNCH,
  AM_LAB_BLOCK,
  PM_LAB_BLOCK,
} from "./constants";
import { getLabBlock } from "./helpers";
import SlotPill from "./SlotPill";
import LabMergedCell from "./LabMergedCell";

// ── SlotPickerPopover ─────────────────────────────────────────────────────────
// Small popover shown when clicking a cell in edit mode.

const SlotPickerPopover = ({
  slotNames,
  labSlotNames,
  onPick,
  onClose,
  anchorRef,
}) => {
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
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        style={style}
        className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-3 w-56"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Assign slot
          </span>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
          >
            <X size={12} />
          </button>
        </div>

        {slotNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {slotNames.map((name) => (
              <button
                key={name}
                onClick={() => onPick(name, "lecture")}
                className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-[13px] font-medium text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {labSlotNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {labSlotNames.map((name) => (
              <button
                key={name}
                onClick={() => onPick(name, "lab")}
                className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-[13px] font-medium text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors flex items-center gap-1"
              >
                <FlaskConical size={11} className="text-gray-400" />
                {name}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => onPick(null, "free")}
          className="w-full text-[13px] px-2 py-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
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
  const [picker, setPicker] = useState(null); // { day, track, pi }
  const pickerAnchorRef = useRef(null);

  const { grid, meta, generated_at } = scheduleData;
  const cellKey = (day, track, pi) => `${day}-${track}-${pi}`;
  const labKey = (day, track) => `LAB-${day}-${track}`;

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
  // CHANGED (scoping fix): manual_entries / hidden_assignment_ids are no
  // longer rendered here — this view now shows ONLY what SlotPill resolves
  // from slot_name. Cells carrying manual-review data are locked (no drag,
  // no click) so a generic Schedule-tab edit can't touch them; they get a
  // small grey dot instead, pointing the admin at Review/Institute.

  const renderTheoryCell = (cell, day, track) => {
    if (!cell) {
      return (
        <td
          key="empty"
          className={`border border-gray-100 dark:border-gray-800 px-1 py-1 ${
            editMode
              ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
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
    const isReviewLocked =
      (cell.manual_entries?.length ?? 0) > 0 ||
      (cell.hidden_assignment_ids?.length ?? 0) > 0;
    const isDraggingSelf =
      dragSrc?.type === "theory" &&
      dragSrc.day === day &&
      dragSrc.track === track &&
      dragSrc.pi === pi;

    const canEditHere = editMode && !isBreak && !isReviewLocked;

    return (
      <td
        key={pi}
        className={[
          "border border-gray-100 dark:border-gray-800 px-1 py-1 transition-colors",
          canEditHere ? "cursor-pointer" : "",
          isReviewLocked && editMode ? "cursor-not-allowed" : "",
          isOver && editMode ? "bg-gray-100 dark:bg-gray-800/60" : "",
          isDraggingSelf ? "opacity-40" : "",
        ].join(" ")}
        title={
          isReviewLocked && editMode
            ? "Placed/edited via Manual Review — change it from the Review or Institute tab instead"
            : undefined
        }
        draggable={editMode && !!name && !isBreak && !isReviewLocked}
        onDragStart={
          editMode && !!name && !isBreak && !isReviewLocked
            ? () => setDragSrc({ type: "theory", day, track, pi })
            : undefined
        }
        onDragOver={
          canEditHere
            ? (e) => {
                e.preventDefault();
                setDragOver({ key });
              }
            : undefined
        }
        onDragLeave={canEditHere ? () => setDragOver(null) : undefined}
        onDrop={
          canEditHere ? () => handleTheoryDrop(day, track, pi) : undefined
        }
        onDragEnd={
          canEditHere
            ? () => {
                setDragSrc(null);
                setDragOver(null);
              }
            : undefined
        }
        onClick={
          canEditHere ? (e) => handleCellClick(e, day, track, pi) : undefined
        }
      >
        <div className="relative">
          {isReviewLocked && editMode && (
            <span
              title="Placed via Manual Review — locked here"
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 z-10"
            />
          )}
          <SlotPill
            name={name}
            subLabel={name === "G" ? "Minor" : name === "H" ? "OE" : ""}
            editMode={canEditHere}
            isDragOver={isOver}
          />
        </div>
      </td>
    );
  };

  // ── render lab merged cell (draggable in edit mode) ───────────────────────

  const renderLabCell = (
    labName,
    slotsDataArg,
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
          slotsData={slotsDataArg}
          subLabel={subLabel}
        />
      );
    }

    return (
      <td
        colSpan={colSpan}
        className={[
          "group border border-gray-100 dark:border-gray-800 px-1 py-1 cursor-grab active:cursor-grabbing transition-colors",
          isLabOver ? "bg-gray-100 dark:bg-gray-800/60" : "",
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
        <div className="flex items-center justify-center gap-1.5 h-full py-1.5 rounded-md bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
          <FlaskConical
            size={13}
            className="text-indigo-400 dark:text-indigo-500"
          />
          <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-200">
            LAB
          </span>
          <GripVertical
            size={12}
            className="text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </td>
    );
  };

  return (
    <div className="space-y-3">
      {/* Meta */}
      {(generated_at || meta?.total_attempts || meta?.generation_time_ms) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-gray-400 dark:text-gray-500">
          {generated_at && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {new Date(generated_at).toLocaleString()}
            </span>
          )}
          {meta?.total_attempts && (
            <span className="flex items-center gap-1">
              <Zap size={11} />
              {meta.total_attempts} attempt
              {meta.total_attempts !== 1 ? "s" : ""}
            </span>
          )}
          {meta?.generation_time_ms && <span>{meta.generation_time_ms}ms</span>}
        </div>
      )}

      {/* CHANGED — legend no longer advertises "M" pills / amber dots (those
          don't render in this view anymore). Just explains the lock dot. */}
      <div
        className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500"
        data-tour="schedule-locked-legend"
      >
        <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" />
        Locked — placed via Manual Review (see Review / Institute tab)
      </div>

      {/* Table */}
      <div
        className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800"
        data-tour="schedule-grid"
      >
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
            <tr>
              <th className="border border-gray-100 dark:border-gray-800 px-2 py-2 text-left text-[12px] font-medium text-gray-400 dark:text-gray-500">
                Day
              </th>
              {TIME_LABELS.map((t, i) => (
                <th
                  key={i}
                  className={`border border-gray-100 dark:border-gray-800 px-1 py-2 text-center text-[13px] font-medium whitespace-nowrap ${
                    i === LUNCH_PI
                      ? "text-gray-300 dark:text-gray-700"
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

              const t1Map = Object.fromEntries(
                t1Cells.map((c) => [c.period_index, c]),
              );
              const t2Map = t2Cells
                ? Object.fromEntries(t2Cells.map((c) => [c.period_index, c]))
                : {};
              const t1PmLab = getLabBlock(t1Map, PM_LAB_BLOCK);
              const t2AmLab = getLabBlock(t2Map, AM_LAB_BLOCK);

              // FIXED — this is a skeleton fact (does this day HAVE a track
              //2 row at all), not something engine placement should gate.
              // Previously `!!t2AmLab` was ANDed in here, so a day with a
              // structurally-defined track2 but no lab actually placed in
              // the AM block would render as single-track, hiding the
              // "2 tracks" label and the whole second row.
              const hasDualTrack = !!t2Cells && t2Cells.length > 0;

              return (
                <React.Fragment key={day}>
                  {/* Track 1 */}
                  <tr
                    className={
                      di > 0
                        ? "border-t-2 border-gray-100 dark:border-gray-800"
                        : ""
                    }
                  >
                    <td
                      rowSpan={hasDualTrack ? 2 : 1}
                      className="border border-gray-100 dark:border-gray-800 px-2 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 align-middle"
                    >
                      {day.slice(0, 3)}
                      {hasDualTrack && (
                        <div className="text-[13px] font-normal text-gray-300 dark:text-gray-600 mt-0.5">
                          2 tracks
                        </div>
                      )}
                    </td>

                    {BEFORE_LUNCH.map((pi) =>
                      renderTheoryCell(t1Map[pi], day, 1),
                    )}

                    {/* Lunch */}
                    <td
                      rowSpan={hasDualTrack ? 2 : 1}
                      className="border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30 text-center align-middle px-0.5"
                    >
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 tracking-widest">
                        L
                      </span>
                    </td>

                    {t1PmLab
                      ? renderLabCell(t1PmLab, slotsData, "14:00–17:00", day, 1)
                      : AFTER_LUNCH.map((pi) =>
                          renderTheoryCell(t1Map[pi], day, 1),
                        )}
                  </tr>

                  {/* Track 2 — subtle accent, no heavy wash.
                      FIXED — rendered whenever the skeleton has a track2 row
                      (hasDualTrack), regardless of whether a lab happens to
                      be placed in the AM block. If there's no lab entry,
                      the AM block just falls back to plain theory cells
                      instead of the row vanishing entirely. */}
                  {hasDualTrack && (
                    <tr className="border-t border-dashed border-gray-200 dark:border-gray-700">
                      {t2AmLab
                        ? renderLabCell(
                            t2AmLab,
                            slotsData,
                            "9:00–12:00",
                            day,
                            2,
                          )
                        : AM_LAB_BLOCK.map((pi) =>
                            renderTheoryCell(t2Map[pi], day, 2),
                          )}
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
