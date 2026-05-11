import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Loader2,
  LayoutGrid,
  Rows3,
  CalendarDays,
  FlaskConical,
  BookOpen,
  Clock,
  Star,
  Zap,
  RefreshCw,
  Pencil,
  Check,
  Lock,
  Unlock,
  RotateCcw,
} from "lucide-react";
import useAdminStore from "../../../store/useAdminStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TIME_LABELS = [
  "9:00–9:55",
  "10:00–10:55",
  "11:00–11:55",
  "12:00–12:55",
  "LUNCH",
  "14:00–14:55",
  "15:00–15:55",
  "16:00–16:55",
];

const LUNCH_PI = 4;
const BEFORE_LUNCH = [0, 1, 2, 3];
const AFTER_LUNCH = [5, 6, 7];
const AM_LAB_BLOCK = [0, 1, 2];
const PM_LAB_BLOCK = [5, 6, 7];

// ─── Colours ──────────────────────────────────────────────────────────────────

const SLOT_COLORS = {
  A: "bg-blue-50   dark:bg-blue-900/20   border-blue-200   dark:border-blue-700   text-blue-800   dark:text-blue-300",
  B: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700 text-violet-800 dark:text-violet-300",
  C: "bg-amber-50  dark:bg-amber-900/20  border-amber-200  dark:border-amber-700  text-amber-800  dark:text-amber-300",
  D: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300",
  E: "bg-rose-50   dark:bg-rose-900/20   border-rose-200   dark:border-rose-700   text-rose-800   dark:text-rose-300",
  F: "bg-cyan-50   dark:bg-cyan-900/20   border-cyan-200   dark:border-cyan-700   text-cyan-800   dark:text-cyan-300",
  G: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 text-orange-800 dark:text-orange-300",
  H: "bg-pink-50   dark:bg-pink-900/20   border-pink-200   dark:border-pink-700   text-pink-800   dark:text-pink-300",
};

const LAB_COLOR =
  "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600 text-purple-800 dark:text-purple-300";

function slotColor(name) {
  if (!name || name === "BREAK") return "";
  if (name.startsWith("LAB")) return LAB_COLOR;
  return SLOT_COLORS[name] ?? SLOT_COLORS.A;
}

// ─── Score badge ──────────────────────────────────────────────────────────────

const ScoreBadge = ({ score }) => {
  const cls =
    score >= 80
      ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400"
      : score >= 55
        ? "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400"
        : "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400";
  return (
    <span
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}
    >
      <Star size={11} />
      Score {score}
    </span>
  );
};

// ─── Edit toolbar ─────────────────────────────────────────────────────────────

const EditToolbar = ({ lockedCount, onClearLocks, onSubmit, isReworking }) => (
  <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
    <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-300 flex-1 min-w-0">
      <Pencil size={11} />
      <span>
        Drag slots to swap. Click a cell to lock it — locked cells are skipped
        by the rework engine.
      </span>
      {lockedCount > 0 && (
        <span className="shrink-0 ml-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold text-[10px]">
          {lockedCount} locked
        </span>
      )}
    </div>
    <div className="flex items-center gap-2 shrink-0">
      {lockedCount > 0 && (
        <button
          onClick={onClearLocks}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Unlock size={11} /> Clear locks
        </button>
      )}
      <button
        onClick={onSubmit}
        disabled={isReworking}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isReworking ? (
          <>
            <Loader2 size={11} className="animate-spin" />
            Running rework…
          </>
        ) : (
          <>
            <RotateCcw size={11} />
            Submit to ReworkEngine
          </>
        )}
      </button>
    </div>
  </div>
);

// ─── Slot pill ────────────────────────────────────────────────────────────────

const SlotPill = ({ name, subLabel, isLocked, editMode, isDragOver }) => {
  if (!name)
    return (
      <div className="text-center py-2">
        <span className="text-[10px] text-gray-200 dark:text-gray-700">—</span>
      </div>
    );
  if (name === "BREAK")
    return (
      <div className="text-center py-2">
        <span className="text-[9px] text-gray-300 dark:text-gray-600 italic">
          lunch
        </span>
      </div>
    );

  const color = slotColor(name);
  return (
    <div
      className={[
        "rounded-md border px-1.5 py-1.5 text-center relative select-none transition-all",
        color,
        editMode ? "cursor-grab hover:opacity-90" : "",
        isDragOver ? "ring-2 ring-indigo-400 ring-offset-1" : "",
      ].join(" ")}
    >
      <p className="text-[11px] font-bold leading-none">{name}</p>
      {subLabel && (
        <p className="text-[9px] mt-0.5 opacity-65 leading-none">{subLabel}</p>
      )}
      {isLocked && (
        <span className="absolute top-0.5 right-0.5">
          <Lock size={7} className="text-amber-500" />
        </span>
      )}
    </div>
  );
};

// ─── Lab merged cell ──────────────────────────────────────────────────────────

const LabMergedCell = ({ labName, slotsData, subLabel }) => {
  const entries = useMemo(() => {
    if (!slotsData?.slots || !labName) return [];
    const slot = slotsData.slots.find((s) => s.slot_name === labName);
    return slot?.entries ?? [];
  }, [slotsData, labName]);

  const batchList = entries
    .flatMap((e) => e.batch_names ?? e.batches ?? [])
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(" / ");

  return (
    <td
      colSpan={3}
      rowSpan={1}
      className="border border-gray-100 dark:border-gray-700 px-1 py-1 align-middle"
    >
      <div
        className={`rounded-md border px-2 py-2 text-center h-full ${LAB_COLOR}`}
      >
        <FlaskConical size={10} className="mx-auto mb-0.5 opacity-60" />
        <p className="text-[11px] font-bold leading-none">{labName}</p>
        {batchList && (
          <p className="text-[9px] mt-0.5 opacity-65 leading-tight">
            {batchList}
          </p>
        )}
        {subLabel && (
          <p className="text-[9px] mt-0.5 opacity-50 leading-none">
            {subLabel}
          </p>
        )}
      </div>
    </td>
  );
};

// ─── Helper: does this day's track have a lab block? ─────────────────────────

function getLabBlock(trackRow, block) {
  if (!trackRow) return null;
  const names = block.map((p) => trackRow[p]?.slot_name);
  if (names.every((n) => n && n.startsWith("LAB") && n === names[0])) {
    return names[0];
  }
  return null;
}

// ─── Schedule view ────────────────────────────────────────────────────────────

const DualTrackScheduleView = ({
  scheduleData,
  slotsData,
  editMode,
  lockedCells,
  onToggleLock,
  onSwapCells,
}) => {
  const [dragSrc, setDragSrc] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const { grid, meta, generated_at } = scheduleData;
  const cellKey = (day, track, pi) => `${day}-${track}-${pi}`;

  const handleDrop = useCallback(
    (day, track, pi) => {
      if (!dragSrc) return;
      setDragSrc(null);
      setDragOver(null);
      const { day: sd, track: st, pi: sp } = dragSrc;
      if (sd === day && st === track && sp === pi) return;
      const srcKey = cellKey(sd, st, sp);
      const dstKey = cellKey(day, track, pi);
      if (lockedCells.has(srcKey) || lockedCells.has(dstKey)) return;
      onSwapCells(sd, st, sp, day, track, pi);
    },
    [dragSrc, lockedCells, onSwapCells],
  );

  const renderTheoryCell = (cell, day, track) => {
    if (!cell)
      return (
        <td
          key="empty"
          className="border border-gray-100 dark:border-gray-700 px-1 py-1"
        />
      );
    const pi = cell.period_index;
    const key = cellKey(day, track, pi);
    const isLocked = lockedCells.has(key);
    const isOver = dragOver?.key === key;
    const name = cell.slot_name;

    return (
      <td
        key={pi}
        className={[
          "border border-gray-100 dark:border-gray-700 px-1 py-1",
          isLocked ? "bg-amber-50/60 dark:bg-amber-900/10" : "",
        ].join(" ")}
        draggable={editMode && !!name && name !== "BREAK"}
        onDragStart={
          editMode ? () => setDragSrc({ day, track, pi }) : undefined
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
        onDrop={editMode ? () => handleDrop(day, track, pi) : undefined}
        onDragEnd={
          editMode
            ? () => {
                setDragSrc(null);
                setDragOver(null);
              }
            : undefined
        }
        onClick={
          editMode && name && name !== "BREAK"
            ? () => onToggleLock(day, track, pi)
            : undefined
        }
      >
        <SlotPill
          name={name}
          subLabel={name === "G" ? "Minor" : name === "H" ? "OE" : ""}
          isLocked={isLocked}
          editMode={editMode}
          isDragOver={isOver}
        />
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
                  className={`border border-gray-100 dark:border-gray-700 px-1 py-2.5 text-center text-[9px] font-semibold whitespace-nowrap ${i === LUNCH_PI ? "text-gray-300 dark:text-gray-600" : "text-gray-400 dark:text-gray-500"}`}
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
                  {/* Track 1 row */}
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

                    {t1PmLab ? (
                      <LabMergedCell
                        labName={t1PmLab}
                        slotsData={slotsData}
                        subLabel="14:00–17:00"
                      />
                    ) : (
                      AFTER_LUNCH.map((pi) =>
                        renderTheoryCell(t1Map[pi], day, 1),
                      )
                    )}
                  </tr>

                  {/* Track 2 row */}
                  {hasDualTrack && (
                    <tr
                      className="bg-purple-50/30 dark:bg-purple-900/5 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors"
                      style={{ borderTop: "1.5px dashed #c4b5fd" }}
                    >
                      <LabMergedCell
                        labName={t2AmLab}
                        slotsData={slotsData}
                        subLabel="9:00–12:00"
                      />

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
        {editMode && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
            <Lock size={9} />
            Locked
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Slots matrix view (UPDATED for LAB slots) ────────────────────────────────────────────────────────

const SlotsView = ({ slotsData }) => {
  const { slots } = slotsData;

  const lectureSlots = slots.filter((s) => !s.slot_name.startsWith("LAB"));
  const labSlots = slots.filter((s) => s.slot_name.startsWith("LAB"));

  const allBatches = useMemo(() => {
    const seen = new Set();
    slots.forEach((sl) =>
      sl.entries.forEach((e) =>
        (e.batch_names ?? e.batches ?? []).forEach((b) => seen.add(b)),
      ),
    );
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [slots]);

  const getEntry = (slotName, batch) => {
    const sl = slots.find((s) => s.slot_name === slotName);
    return (
      sl?.entries.find((e) =>
        (e.batch_names ?? e.batches ?? []).includes(batch),
      ) ?? null
    );
  };

  return (
    <div className="space-y-8">
      {/* Theory + Special Slots */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
          <BookOpen size={16} /> Lecture / Theory Slots
        </h4>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <table
            className="border-collapse"
            style={{ minWidth: 640, width: "100%" }}
          >
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/80">
                <th
                  className="border border-gray-100 dark:border-gray-700 px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-800/80 z-10"
                  style={{ minWidth: 140 }}
                >
                  Batch
                </th>
                {lectureSlots.map((sl) => (
                  <th
                    key={sl.slot_name}
                    className="border border-gray-100 dark:border-gray-700 px-3 py-2.5 text-center"
                    style={{ minWidth: 110 }}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border text-sm font-bold ${SLOT_COLORS[sl.slot_name] ?? SLOT_COLORS.A}`}
                    >
                      {sl.slot_name}
                    </span>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 font-normal">
                      {sl.entries[0]?.sessions_per_week ?? 1}×/wk
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allBatches.map((batch, bi) => (
                <tr
                  key={batch}
                  className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${bi % 2 ? "bg-gray-50/30 dark:bg-gray-800/10" : ""}`}
                >
                  <td className="border border-gray-100 dark:border-gray-700 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 z-10">
                    {batch}
                  </td>
                  {lectureSlots.map((sl) => {
                    const entry = getEntry(sl.slot_name, batch);
                    if (!entry) {
                      return (
                        <td
                          key={sl.slot_name}
                          className="border border-gray-100 dark:border-gray-700 px-3 py-2 text-center"
                        >
                          <span className="text-[10px] text-gray-200 dark:text-gray-700">
                            —
                          </span>
                        </td>
                      );
                    }
                    const code = entry.course_code ?? entry.course ?? "—";
                    const fac = entry.faculty_code ?? entry.faculty ?? "";
                    const color = SLOT_COLORS[sl.slot_name] ?? SLOT_COLORS.A;
                    return (
                      <td
                        key={sl.slot_name}
                        className="border border-gray-100 dark:border-gray-700 px-1.5 py-1.5"
                      >
                        <div
                          className={`rounded-md border px-2 py-1.5 text-center ${color}`}
                        >
                          <p className="text-[11px] font-bold leading-none">
                            {code}
                          </p>
                          {fac && (
                            <p className="text-[9px] mt-0.5 opacity-60 leading-none">
                              {fac}
                            </p>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lab Slots */}
      {labSlots.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
            <FlaskConical size={16} /> Lab Slots (Day-wise)
          </h4>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <table
              className="border-collapse"
              style={{ minWidth: 640, width: "100%" }}
            >
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/80">
                  <th
                    className="border border-gray-100 dark:border-gray-700 px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-800/80 z-10"
                    style={{ minWidth: 140 }}
                  >
                    Batch
                  </th>
                  {labSlots.map((sl) => (
                    <th
                      key={sl.slot_name}
                      className="border border-gray-100 dark:border-gray-700 px-3 py-2.5 text-center"
                      style={{ minWidth: 130 }}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border text-sm font-bold ${LAB_COLOR}`}
                      >
                        <FlaskConical size={14} />
                      </span>
                      <p className="text-[9px] text-purple-600 dark:text-purple-400 mt-1 font-medium">
                        {sl.slot_name.replace("LAB_", "")}
                      </p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allBatches.map((batch, bi) => (
                  <tr
                    key={batch}
                    className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${bi % 2 ? "bg-gray-50/30 dark:bg-gray-800/10" : ""}`}
                  >
                    <td className="border border-gray-100 dark:border-gray-700 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 z-10">
                      {batch}
                    </td>
                    {labSlots.map((sl) => {
                      const entry = getEntry(sl.slot_name, batch);
                      if (!entry) {
                        return (
                          <td
                            key={sl.slot_name}
                            className="border border-gray-100 dark:border-gray-700 px-3 py-2 text-center"
                          >
                            <span className="text-[10px] text-gray-200 dark:text-gray-700">
                              —
                            </span>
                          </td>
                        );
                      }
                      const code = entry.course_code ?? entry.course ?? "—";
                      const fac = entry.faculty_code ?? entry.faculty ?? "";
                      return (
                        <td
                          key={sl.slot_name}
                          className="border border-gray-100 dark:border-gray-700 px-1.5 py-1.5"
                        >
                          <div
                            className={`rounded-md border px-2 py-1.5 text-center ${LAB_COLOR}`}
                          >
                            <p className="text-[11px] font-bold leading-none">
                              {code}
                            </p>
                            {fac && (
                              <p className="text-[9px] mt-0.5 opacity-60 leading-none">
                                {fac}
                              </p>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Institute view ───────────────────────────────────────────────────────────

const InstituteView = ({ scheduleData, slotsData }) => {
  const [selectedDay, setSelectedDay] = useState("Monday");

  const slotMap = useMemo(() => {
    if (!slotsData?.slots) return {};
    return Object.fromEntries(
      slotsData.slots.map((s) => [s.slot_name, s.entries]),
    );
  }, [slotsData]);

  const allBatches = useMemo(() => {
    if (!slotsData?.slots) return [];
    const seen = new Set();
    slotsData.slots.forEach((sl) =>
      sl.entries.forEach((e) =>
        (e.batch_names ?? e.batches ?? []).forEach((b) => seen.add(b)),
      ),
    );
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [slotsData]);

  const track2Batches = new Set(scheduleData?.track2_batches ?? []);
  const dayGrid = scheduleData?.grid?.[selectedDay];

  const t1Cells = (dayGrid?.track1 ?? []).sort(
    (a, b) => a.period_index - b.period_index,
  );
  const t2Cells = (dayGrid?.track2 ?? []).sort(
    (a, b) => a.period_index - b.period_index,
  );
  const t1Map = Object.fromEntries(t1Cells.map((c) => [c.period_index, c]));
  const t2Map = Object.fromEntries(t2Cells.map((c) => [c.period_index, c]));

  const t1PmLab = getLabBlock(t1Cells, PM_LAB_BLOCK);
  const t2AmLab = getLabBlock(t2Cells, AM_LAB_BLOCK);
  const hasT2 = !!t2AmLab;

  const getEntryForBatchPeriod = (batch, cell) => {
    if (!cell?.slot_name || cell.slot_name === "BREAK") return null;
    const entries = slotMap[cell.slot_name] ?? [];
    return (
      entries.find((e) => (e.batch_names ?? e.batches ?? []).includes(batch)) ??
      null
    );
  };

  const getBatchSchedule = (batch) => {
    const isT2 = track2Batches.has(batch) && hasT2;
    const map = isT2 ? t2Map : t1Map;
    return Array.from({ length: 8 }, (_, i) => ({
      period_index: i,
      cell: map[i] ?? null,
      isT2,
    }));
  };

  return (
    <div className="space-y-4">
      {/* Day selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Day
        </span>
        <div className="flex gap-1 flex-wrap">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedDay === day
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {day.slice(0, 3)}
              {scheduleData?.grid?.[day]?.track2 && (
                <span className="ml-1 text-[8px] text-purple-400">T2</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {hasT2 && (
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300">
            Track 1: theory 9–13, {t1PmLab ? `${t1PmLab} lab 14–17` : "free PM"}
          </span>
          <span className="px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 text-purple-600 dark:text-purple-300">
            Track 2: {t2AmLab} lab 9–12, theory 14–17
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <table
          className="border-collapse"
          style={{ minWidth: 720, width: "100%" }}
        >
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/80">
              <th
                className="border border-gray-100 dark:border-gray-700 px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-800/80 z-10"
                style={{ minWidth: 130 }}
              >
                Batch
              </th>
              {TIME_LABELS.map((t, i) => (
                <th
                  key={i}
                  className={`border border-gray-100 dark:border-gray-700 px-1 py-2.5 text-center text-[9px] font-semibold whitespace-nowrap ${i === LUNCH_PI ? "text-gray-300 dark:text-gray-600" : "text-gray-400 dark:text-gray-500"}`}
                  style={{ minWidth: i === LUNCH_PI ? 48 : 72 }}
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allBatches.map((batch, bi) => {
              const isT2 = track2Batches.has(batch) && hasT2;
              const schedule = getBatchSchedule(batch);
              const batchPmLab = isT2 ? null : t1PmLab;
              const batchAmLab = isT2 ? t2AmLab : null;
              const batchPmLabEntry = t1PmLab
                ? getEntryForBatchPeriod(batch, t1Map[PM_LAB_BLOCK[0]])
                : null;
              const batchAmLabEntry = t2AmLab
                ? getEntryForBatchPeriod(batch, t2Map[AM_LAB_BLOCK[0]])
                : null;

              return (
                <tr
                  key={batch}
                  className={[
                    "transition-colors",
                    bi % 2 ? "bg-gray-50/30 dark:bg-gray-800/10" : "",
                    isT2 ? "bg-purple-50/20 dark:bg-purple-900/5" : "",
                    "hover:bg-gray-50/50 dark:hover:bg-gray-800/30",
                  ].join(" ")}
                >
                  <td className="border border-gray-100 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 z-10">
                    <div className="flex items-center gap-1.5">
                      {batch}
                      {isT2 && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">
                          T2
                        </span>
                      )}
                    </div>
                  </td>

                  {schedule.map(({ period_index: pi, cell }) => {
                    if (pi === LUNCH_PI) {
                      return (
                        <td
                          key={pi}
                          className="border border-gray-100 dark:border-gray-700 px-1 py-1 bg-gray-50/80 dark:bg-gray-800/60 text-center"
                        >
                          <span className="text-[9px] text-gray-300 dark:text-gray-600 italic">
                            —
                          </span>
                        </td>
                      );
                    }

                    // T2 AM Lab
                    if (isT2 && batchAmLab && pi === AM_LAB_BLOCK[0]) {
                      if (batchAmLabEntry) {
                        const code = batchAmLabEntry.course_code ?? batchAmLab;
                        const fac = batchAmLabEntry.faculty_code ?? "";
                        return (
                          <td
                            key={pi}
                            colSpan={3}
                            className="border border-gray-100 dark:border-gray-700 px-1 py-1 align-middle"
                          >
                            <div
                              className={`rounded-md border px-2 py-1 text-center ${LAB_COLOR}`}
                            >
                              <p className="text-[11px] font-bold leading-none">
                                {code}
                              </p>
                              {fac && (
                                <p className="text-[9px] mt-0.5 opacity-60 leading-none">
                                  {fac}
                                </p>
                              )}
                              <p className="text-[9px] mt-0.5 opacity-40 leading-none">
                                {batchAmLab} (AM)
                              </p>
                            </div>
                          </td>
                        );
                      } else {
                        return (
                          <td
                            key={pi}
                            colSpan={3}
                            className="border border-gray-100 dark:border-gray-700 px-1 py-1 text-center"
                          >
                            <span className="text-[10px] text-gray-200 dark:text-gray-700">
                              —
                            </span>
                          </td>
                        );
                      }
                    }
                    if (isT2 && AM_LAB_BLOCK.slice(1).includes(pi)) return null;

                    // T1 PM Lab
                    if (!isT2 && batchPmLab && pi === PM_LAB_BLOCK[0]) {
                      if (batchPmLabEntry) {
                        const code = batchPmLabEntry.course_code ?? batchPmLab;
                        const fac = batchPmLabEntry.faculty_code ?? "";
                        return (
                          <td
                            key={pi}
                            colSpan={3}
                            className="border border-gray-100 dark:border-gray-700 px-1 py-1 align-middle"
                          >
                            <div
                              className={`rounded-md border px-2 py-1 text-center ${LAB_COLOR}`}
                            >
                              <p className="text-[11px] font-bold leading-none">
                                {code}
                              </p>
                              {fac && (
                                <p className="text-[9px] mt-0.5 opacity-60 leading-none">
                                  {fac}
                                </p>
                              )}
                              <p className="text-[9px] mt-0.5 opacity-40 leading-none">
                                {batchPmLab} (PM)
                              </p>
                            </div>
                          </td>
                        );
                      } else {
                        return (
                          <td
                            key={pi}
                            colSpan={3}
                            className="border border-gray-100 dark:border-gray-700 px-1 py-1 text-center"
                          >
                            <span className="text-[10px] text-gray-200 dark:text-gray-700">
                              —
                            </span>
                          </td>
                        );
                      }
                    }
                    if (!isT2 && PM_LAB_BLOCK.slice(1).includes(pi))
                      return null;

                    // Regular theory cell
                    const entry = getEntryForBatchPeriod(batch, cell);
                    const name = cell?.slot_name;

                    if (!entry) {
                      return (
                        <td
                          key={pi}
                          className="border border-gray-100 dark:border-gray-700 px-1 py-1 text-center"
                        >
                          <span className="text-[10px] text-gray-200 dark:text-gray-700">
                            —
                          </span>
                        </td>
                      );
                    }

                    const code =
                      entry.course_code ?? entry.course ?? name ?? "—";
                    const fac = entry.faculty_code ?? entry.faculty ?? "";
                    const color = slotColor(name);

                    return (
                      <td
                        key={pi}
                        className="border border-gray-100 dark:border-gray-700 px-1 py-1"
                      >
                        <div
                          className={`rounded-md border px-1.5 py-1 text-center ${color}`}
                        >
                          <p className="text-[11px] font-bold leading-none">
                            {code}
                          </p>
                          {fac && (
                            <p className="text-[9px] mt-0.5 opacity-60 leading-none">
                              {fac}
                            </p>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const GeneratedTimetableTab = ({ session }) => {
  const {
    generatedSlotsData,
    activeScheduleData,
    isFetchingSlots,
    isFetchingSchedule,
    timetableData,
    fetchGeneratedSlots,
    fetchActiveSchedule,
  } = useAdminStore();

  const [activeTab, setActiveTab] = useState("schedule");
  const [editMode, setEditMode] = useState(false);
  const [isReworking, setIsReworking] = useState(false);
  const [localGrid, setLocalGrid] = useState(null);
  const [lockedCells, setLockedCells] = useState(new Set());

  useEffect(() => {
    if (activeScheduleData?.grid) {
      setLocalGrid(structuredClone(activeScheduleData.grid));
      setLockedCells(new Set());
    }
  }, [activeScheduleData]);

  useEffect(() => {
    if (!session?._id) return;
    fetchGeneratedSlots(session._id);
    fetchActiveSchedule(session._id);
  }, [session?._id, timetableData]);

  const handleEditToggle = () => {
    if (editMode && activeScheduleData?.grid) {
      setLocalGrid(structuredClone(activeScheduleData.grid));
      setLockedCells(new Set());
    }
    setEditMode((v) => !v);
  };

  const handleSwapCells = useCallback(
    (srcDay, srcTrack, srcPi, dstDay, dstTrack, dstPi) => {
      setLocalGrid((prev) => {
        const next = structuredClone(prev);
        const srcArr = next[srcDay]?.[`track${srcTrack}`];
        const dstArr = next[dstDay]?.[`track${dstTrack}`];
        if (!srcArr || !dstArr) return prev;
        const srcCell = srcArr.find((c) => c.period_index === srcPi);
        const dstCell = dstArr.find((c) => c.period_index === dstPi);
        if (!srcCell || !dstCell) return prev;
        [srcCell.slot_name, dstCell.slot_name] = [
          dstCell.slot_name,
          srcCell.slot_name,
        ];
        [srcCell.slot_type, dstCell.slot_type] = [
          dstCell.slot_type,
          srcCell.slot_type,
        ];
        [srcCell.is_lab_anchor, dstCell.is_lab_anchor] = [
          dstCell.is_lab_anchor,
          srcCell.is_lab_anchor,
        ];
        return next;
      });
    },
    [],
  );

  const handleToggleLock = useCallback((day, track, pi) => {
    const key = `${day}-${track}-${pi}`;
    setLockedCells((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleClearLocks = useCallback(() => setLockedCells(new Set()), []);

  const handleSubmitRework = async () => {
    if (!localGrid || !generatedSlotsData) return;
    setIsReworking(true);
    try {
      const timetableForEngine = {};
      for (const [day, tracks] of Object.entries(localGrid)) {
        timetableForEngine[day] = {
          track1: (tracks.track1 ?? []).map((c) => ({
            period_index: c.period_index,
            time_label: c.time_label,
            slot_name: c.slot_name,
          })),
          track2: tracks.track2
            ? tracks.track2.map((c) => ({
                period_index: c.period_index,
                time_label: c.time_label,
                slot_name: c.slot_name,
              }))
            : null,
        };
      }
      const slotsMap = {};
      generatedSlotsData.slots.forEach((s) => {
        slotsMap[s.slot_name] = s.entries.map((e) => ({
          course: e.course_code,
          faculty: e.faculty_code,
          faculty_id: e.faculty_id,
          batches: e.batch_names ?? [],
          batch_ids: e.batch_ids ?? [],
          assignment_id: e.assignment_id,
          sessions_per_week: e.sessions_per_week ?? 1,
        }));
      });

      const res = await fetch("/api/v1/admin/timetable/rework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session._id,
          timetable_id: activeScheduleData?.timetable_id,
          timetable: timetableForEngine,
          slots: slotsMap,
          locked_cells: [...lockedCells],
        }),
      });

      if (!res.ok) throw new Error("Rework failed");
      await fetchGeneratedSlots(session._id);
      await fetchActiveSchedule(session._id);
      setEditMode(false);
      setLockedCells(new Set());
    } catch (err) {
      console.error("ReworkEngine error:", err);
    } finally {
      setIsReworking(false);
    }
  };

  const isLoading = isFetchingSlots || isFetchingSchedule;
  const hasData = generatedSlotsData || activeScheduleData;
  const score = generatedSlotsData?.score ?? activeScheduleData?.score;

  const displayScheduleData = useMemo(() => {
    if (!activeScheduleData) return null;
    return localGrid
      ? { ...activeScheduleData, grid: localGrid }
      : activeScheduleData;
  }, [activeScheduleData, localGrid]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <Loader2 size={22} className="animate-spin text-emerald-500" />
        <span className="text-sm text-gray-400">Loading timetable…</span>
      </div>
    );

  if (!hasData)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <CalendarDays size={40} className="opacity-30" />
        <p className="text-sm text-center">
          No timetable generated yet.
          <br />
          Head to the Finalized Assignments tab and click{" "}
          <span className="font-medium text-emerald-500">
            Generate Timetable
          </span>
          .
        </p>
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-800/50 rounded-xl p-4 border border-emerald-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
            Generated Timetable
          </p>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {session?.term} Term · {generatedSlotsData?.slots?.length ?? 0}{" "}
            slots
            {(activeScheduleData?.track2_batches?.length ?? 0) > 0 && (
              <span className="ml-2 text-xs font-normal text-purple-500 dark:text-purple-400">
                · {activeScheduleData.track2_batches.length} batch
                {activeScheduleData.track2_batches.length !== 1 ? "es" : ""} on
                Track 2
              </span>
            )}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {score != null && <ScoreBadge score={score} />}
          <button
            onClick={handleEditToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              editMode
                ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {editMode ? <Check size={12} /> : <Pencil size={12} />}
            {editMode ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={() => {
              fetchGeneratedSlots(session._id);
              fetchActiveSchedule(session._id);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {editMode && (
        <EditToolbar
          lockedCount={lockedCells.size}
          onClearLocks={handleClearLocks}
          onSubmit={handleSubmitRework}
          isReworking={isReworking}
        />
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        {[
          { key: "schedule", label: "Schedule", icon: <Rows3 size={13} /> },
          { key: "slots", label: "Slots", icon: <LayoutGrid size={13} /> },
          {
            key: "institute",
            label: "Institute",
            icon: <CalendarDays size={13} />,
          },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === key
                ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "schedule" && displayScheduleData && (
        <DualTrackScheduleView
          scheduleData={displayScheduleData}
          slotsData={generatedSlotsData}
          editMode={editMode}
          lockedCells={lockedCells}
          onToggleLock={handleToggleLock}
          onSwapCells={handleSwapCells}
        />
      )}
      {activeTab === "slots" && generatedSlotsData && (
        <SlotsView slotsData={generatedSlotsData} />
      )}
      {activeTab === "institute" &&
        displayScheduleData &&
        generatedSlotsData && (
          <InstituteView
            scheduleData={displayScheduleData}
            slotsData={generatedSlotsData}
          />
        )}

      {/* Empty states */}
      {activeTab === "schedule" && !displayScheduleData && (
        <p className="text-sm text-gray-400 text-center py-10">
          Schedule data unavailable.
        </p>
      )}
      {activeTab === "slots" && !generatedSlotsData && (
        <p className="text-sm text-gray-400 text-center py-10">
          Slot data unavailable.
        </p>
      )}
      {activeTab === "institute" &&
        (!displayScheduleData || !generatedSlotsData) && (
          <p className="text-sm text-gray-400 text-center py-10">
            Both slots and schedule data are needed.
          </p>
        )}
    </div>
  );
};

export default GeneratedTimetableTab;
