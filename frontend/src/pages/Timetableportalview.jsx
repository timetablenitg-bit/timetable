// TimetablePortalView.jsx
// Shows the full week at once — all 5 days stacked — mirroring the admin
// InstituteView filtered layout. No day subtab needed.
//
// Props:
//   scheduleData  – { grid, track2_batches, ... }
//   slotsData     – { slots, ... }
//   presetBatch   – string | null   e.g. "CSE-5"   (student)
//   presetFaculty – string | null   e.g. "PRS"     (faculty)
//   isLoading     – bool
//   error         – string | null

import React, { useMemo } from "react";
import { CalendarDays, Loader2, AlertCircle } from "lucide-react";
import {
  resolveCellEntriesGroup,
  describeCoLocation,
} from "../components/Incharge/academicSession/generatedTimetable/resolveCellEntries";

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const LUNCH_PI = 4;
const AM_LAB_BLOCK = [1, 2, 3];
const PM_LAB_BLOCK = [5, 6, 7];

const TIME_LABELS = [
  "9–10",
  "10–11",
  "11–12",
  "12–13",
  "LUNCH",
  "14–15",
  "15–16",
  "16–17",
];

// ─── Colors ───────────────────────────────────────────────────────────────────
const SLOT_PALETTES = [
  "bg-sky-50    border-sky-200    text-sky-800    dark:bg-sky-900/20    dark:border-sky-700    dark:text-sky-300",
  "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-300",
  "bg-amber-50  border-amber-200  text-amber-800  dark:bg-amber-900/20  dark:border-amber-700  dark:text-amber-300",
  "bg-rose-50   border-rose-200   text-rose-800   dark:bg-rose-900/20   dark:border-rose-700   dark:text-rose-300",
  "bg-violet-50 border-violet-200 text-violet-800 dark:bg-violet-900/20 dark:border-violet-700 dark:text-violet-300",
  "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-300",
  "bg-teal-50   border-teal-200   text-teal-800   dark:bg-teal-900/20   dark:border-teal-700   dark:text-teal-300",
  "bg-pink-50   border-pink-200   text-pink-800   dark:bg-pink-900/20   dark:border-pink-700   dark:text-pink-300",
];
const LAB_COLOR =
  "bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-300";

const _colorCache = {};
let _colorIdx = 0;
function slotColor(name) {
  if (!name || name === "BREAK") return "";
  if (!_colorCache[name]) {
    _colorCache[name] = SLOT_PALETTES[_colorIdx % SLOT_PALETTES.length];
    _colorIdx++;
  }
  return _colorCache[name];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getLabBlock(periodMap, block) {
  for (const pi of block) {
    const c = periodMap[pi];
    if (c && (c.is_lab_anchor || c.slot_type === "lab") && c.slot_name)
      return c.slot_name;
  }
  return null;
}

function toMap(cells = []) {
  return Object.fromEntries(
    [...cells]
      .sort((a, b) => a.period_index - b.period_index)
      .map((c) => [c.period_index, c]),
  );
}

const norm = (s) => (s ?? "").trim().toUpperCase();

// ─── Main component ───────────────────────────────────────────────────────────
const TimetablePortalView = ({
  scheduleData,
  slotsData,
  presetBatch = null,
  presetFaculty = null,
  isLoading = false,
  error = null,
}) => {
  const mode = presetFaculty ? "faculty" : "student";

  // slot_name → entries[]
  const slotMap = useMemo(() => {
    if (!slotsData?.slots) return {};
    return Object.fromEntries(
      slotsData.slots.map((s) => [s.slot_name, s.entries]),
    );
  }, [slotsData]);

  const track2Batches = new Set(scheduleData?.track2_batches ?? []);

  // All slot names where this faculty appears (used to fast-check cells)
  const facultySlotNames = useMemo(() => {
    if (!presetFaculty || !slotsData?.slots) return new Set();
    const s = new Set();
    slotsData.slots.forEach((sl) => {
      if (
        sl.entries.some(
          (e) => norm(e.faculty_code ?? e.faculty) === norm(presetFaculty),
        )
      )
        s.add(sl.slot_name);
    });
    return s;
  }, [presetFaculty, slotsData]);

  // ── entry lookups ─────────────────────────────────────────────────────────
  // Each of these resolves to a GROUP of entries, not a single one — a cell
  // can legitimately hold more than one entry for the same batch: a backlog
  // course placed alongside the current-sem course its students dropped
  // (drop_course_id), or two backlog courses explicitly run in parallel
  // (parallel_with). The engine places both entries in the SAME
  // bucket/label on purpose (see resolveCellEntries.js) — picking only the
  // first match here would silently hide the co-located course from the
  // very students/faculty it's scheduled for.
  function entrySub(entry) {
    return mode === "student"
      ? (entry.faculty_code ?? "")
      : (entry.batch_names ?? entry.batches ?? []).join(", ");
  }

  function groupForBatch(cell, batch) {
    return resolveCellEntriesGroup(cell, slotMap, batch);
  }

  // Lab blocks here are only ever keyed by slot_name (no manual/hidden
  // per-cell overrides at the block level, same as before this change) — a
  // synthetic cell shim keeps this on the same resolveCellEntriesGroup path
  // so drop co-location still resolves correctly for lab entries too.
  function labGroupForBatch(slotName, batch) {
    if (!slotName) return [];
    return resolveCellEntriesGroup({ slot_name: slotName }, slotMap, batch);
  }

  function facultyGroupFromEntries(entries) {
    return entries.filter(
      (e) => norm(e.faculty_code ?? e.faculty) === norm(presetFaculty),
    );
  }

  function groupForFaculty(cell) {
    if (!cell?.slot_name || !facultySlotNames.has(cell.slot_name)) return [];
    const manual = (cell.manual_entries ?? []).filter(
      (e) => norm(e.faculty_code ?? e.faculty) === norm(presetFaculty),
    );
    if (manual.length) return manual;
    if (cell.slot_name === "BREAK") return [];
    const hidden = new Set((cell.hidden_assignment_ids ?? []).map(String));
    return facultyGroupFromEntries(
      (slotMap[cell.slot_name] ?? []).filter(
        (e) => !hidden.has(String(e.assignment_id ?? "")),
      ),
    );
  }

  function labGroupForFaculty(slotName) {
    if (!slotName || !facultySlotNames.has(slotName)) return [];
    return facultyGroupFromEntries(slotMap[slotName] ?? []);
  }

  // ── Cell renderer (shared) ────────────────────────────────────────────────
  const emptyTd = (key) => (
    <td
      key={key}
      className="border border-gray-100 dark:border-gray-700 px-1 py-1 text-center"
      style={{ minWidth: 68 }}
    >
      <span className="text-[10px] text-gray-200 dark:text-gray-700">—</span>
    </td>
  );

  const lunchTd = (key) => (
    <td
      key={key}
      className="border border-gray-100 dark:border-gray-700 px-1 py-1 bg-gray-50/80 dark:bg-gray-800/60 text-center"
      style={{ minWidth: 40 }}
    >
      <span className="text-[9px] text-gray-300 dark:text-gray-600 italic">
        —
      </span>
    </td>
  );

  // Renders a cell for a GROUP of entries (usually length 1). When the
  // group has more than one entry — the drop/parallel co-location case —
  // it splits the cell into stacked bands, one per entry, each labeled with
  // why it's sharing the slot. Mirrors BatchTimetableGrid.jsx's rendering
  // so admin and portal views show the same thing.
  function courseTd(key, slotName, group, isLab, colSpan = 1) {
    const color = isLab ? LAB_COLOR : slotColor(slotName);

    if (!group.length) {
      return (
        <td
          key={key}
          colSpan={colSpan}
          className="border border-gray-100 dark:border-gray-700 px-1 py-1 align-middle"
          style={{ minWidth: 68 * colSpan }}
        >
          {slotName ? (
            <div
              className={`rounded-md border px-1.5 py-1 text-center ${color}`}
            >
              <p className="text-[11px] font-bold leading-none">{slotName}</p>
              {isLab && (
                <p className="text-[8px] mt-0.5 opacity-40 leading-none uppercase tracking-wide">
                  Lab
                </p>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-gray-200 dark:text-gray-700">
              —
            </span>
          )}
        </td>
      );
    }

    if (group.length === 1) {
      const entry = group[0];
      const sub = entrySub(entry);
      return (
        <td
          key={key}
          colSpan={colSpan}
          className="border border-gray-100 dark:border-gray-700 px-1 py-1 align-middle"
          style={{ minWidth: 68 * colSpan }}
        >
          <div className={`rounded-md border px-1.5 py-1 text-center ${color}`}>
            <p className="text-[11px] font-bold leading-none">
              {entry.course_code ?? "—"}
            </p>
            {sub && (
              <p className="text-[9px] mt-0.5 opacity-60 leading-none line-clamp-1">
                {sub}
              </p>
            )}
            {isLab && (
              <p className="text-[8px] mt-0.5 opacity-40 leading-none uppercase tracking-wide">
                Lab
              </p>
            )}
          </div>
        </td>
      );
    }

    return (
      <td
        key={key}
        colSpan={colSpan}
        className="border border-gray-100 dark:border-gray-700 px-1 py-1 align-middle"
        style={{ minWidth: 68 * colSpan }}
      >
        <div className={`rounded-md border overflow-hidden ${color}`}>
          {group.map((entry, i) => {
            const coLoc = describeCoLocation(entry, group);
            const sub = entrySub(entry);
            return (
              <div
                key={entry.assignment_id ?? i}
                className={`px-1.5 py-0.5 text-center ${
                  i > 0
                    ? "border-t border-dashed border-black/10 dark:border-white/10"
                    : ""
                }`}
                title={
                  coLoc?.kind === "drop"
                    ? `Shares this slot — drops ${coLoc.peer.course_code ?? coLoc.peer.course}`
                    : coLoc?.kind === "parallel"
                      ? "Runs in parallel with another backlog course"
                      : undefined
                }
              >
                <p className="text-[9px] font-bold leading-none">
                  {entry.course_code ?? "—"}
                </p>
                {sub && (
                  <p className="text-[7px] mt-0.5 opacity-60 leading-none">
                    {sub}
                  </p>
                )}
                {coLoc && (
                  <p className="text-[6.5px] mt-0.5 font-semibold uppercase tracking-wide opacity-70 leading-none">
                    {coLoc.kind === "drop" ? "⇄ drop" : "∥ parallel"}
                  </p>
                )}
                {isLab && i === 0 && (
                  <p className="text-[6.5px] mt-0.5 opacity-40 leading-none uppercase tracking-wide">
                    Lab
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </td>
    );
  }

  // ── Render 8 period cells for a (batch | faculty) × day row ──────────────
  function renderPeriodCells(periodMap, pmLab, amLab, isT2, rowKey) {
    const cells = [];
    let skip = 0;

    for (let pi = 0; pi < 8; pi++) {
      const key = `${rowKey}-${pi}`;

      if (pi === LUNCH_PI) {
        cells.push(lunchTd(key));
        continue;
      }

      if (skip > 0) {
        skip--;
        continue;
      }

      // AM lab block (Track 2)
      if (isT2 && amLab && pi === AM_LAB_BLOCK[0]) {
        const group =
          mode === "student"
            ? labGroupForBatch(amLab, presetBatch)
            : labGroupForFaculty(amLab);
        cells.push(courseTd(key, amLab, group, true, 3));
        skip = 2;
        continue;
      }

      // PM lab block (Track 1)
      if (!isT2 && pmLab && pi === PM_LAB_BLOCK[0]) {
        const group =
          mode === "student"
            ? labGroupForBatch(pmLab, presetBatch)
            : labGroupForFaculty(pmLab);
        cells.push(courseTd(key, pmLab, group, true, 3));
        skip = 2;
        continue;
      }

      // Regular theory cell
      const cell = periodMap[pi] ?? null;
      const group =
        mode === "student"
          ? groupForBatch(cell, presetBatch)
          : groupForFaculty(cell);

      if (!group.length) {
        cells.push(emptyTd(key));
        continue;
      }

      cells.push(courseTd(key, cell?.slot_name, group, false, 1));
    }

    return cells;
  }

  // ── Per-day track info for a given batch ─────────────────────────────────
  function trackInfoForBatch(day, batch) {
    const dg = scheduleData?.grid?.[day] ?? {};
    const t1 = toMap(dg.track1);
    const t2 = toMap(dg.track2 ?? []);
    const t2Al = getLabBlock(t2, AM_LAB_BLOCK);
    const isT2 = track2Batches.has(batch) && !!t2Al;
    return {
      map: isT2 ? t2 : t1,
      isT2,
      pmLab: isT2 ? null : getLabBlock(t1, PM_LAB_BLOCK),
      amLab: isT2 ? t2Al : null,
    };
  }

  // ── Per-day track info for faculty (both tracks) ──────────────────────────
  function trackInfoForFaculty(day) {
    const dg = scheduleData?.grid?.[day] ?? {};
    const t1 = toMap(dg.track1);
    const t2 = toMap(dg.track2 ?? []);
    const t2Al = getLabBlock(t2, AM_LAB_BLOCK);
    return {
      t1,
      t2,
      t1PmLab: getLabBlock(t1, PM_LAB_BLOCK),
      t2AmLab: t2Al,
      hasT2: !!t2Al,
    };
  }

  // ─── Loading / Error / Empty ──────────────────────────────────────────────
  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={24} className="animate-spin text-blue-500" />
        <p className="text-sm text-gray-400">Loading your timetable…</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-400">
        <AlertCircle size={32} className="opacity-50" />
        <p className="text-sm text-center">{error}</p>
      </div>
    );

  if (!scheduleData || !slotsData)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
        <CalendarDays size={40} className="opacity-25" />
        <p className="text-sm text-center">
          No timetable published yet.
          <br />
          Check back later or contact your administrator.
        </p>
      </div>
    );

  // ─── Header label ─────────────────────────────────────────────────────────
  const headerLabel =
    mode === "student"
      ? `Batch · ${presetBatch ?? "—"}${track2Batches.has(presetBatch) ? " · Track 2" : ""}`
      : `Faculty · ${presetFaculty ?? "—"}`;

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-4 text-gray-700 dark:text-gray-200">
      {/* Page header */}
      <div className="flex items-center gap-3 px-1">
        <div className="p-2.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-500/30 shrink-0">
          <CalendarDays size={22} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {mode === "faculty" ? "My Teaching Schedule" : "My Timetable"}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{headerLabel}</p>
        </div>
      </div>

      {/* ── MOBILE: day-by-day cards ── */}
      <div className="md:hidden space-y-5">
        {DAYS.map((day) => {
          // Collect visible periods for this day
          let rows = []; // { timeLabel, entries: [...], isLab }

          if (mode === "student" && presetBatch) {
            const { map, isT2, pmLab, amLab } = trackInfoForBatch(
              day,
              presetBatch,
            );
            let skip = 0;
            for (let pi = 0; pi < 8; pi++) {
              if (pi === LUNCH_PI || skip-- > 0) continue;
              skip = 0;

              if (isT2 && amLab && pi === AM_LAB_BLOCK[0]) {
                const group = labGroupForBatch(amLab, presetBatch);
                if (group.length)
                  rows.push({ timeLabel: "9–12", entries: group, isLab: true });
                skip = 2;
                continue;
              }
              if (!isT2 && pmLab && pi === PM_LAB_BLOCK[0]) {
                const group = labGroupForBatch(pmLab, presetBatch);
                if (group.length)
                  rows.push({
                    timeLabel: "14–17",
                    entries: group,
                    isLab: true,
                  });
                skip = 2;
                continue;
              }

              const cell = map[pi] ?? null;
              const group = groupForBatch(cell, presetBatch);
              if (group.length)
                rows.push({
                  timeLabel: TIME_LABELS[pi],
                  entries: group,
                  isLab: false,
                });
            }
          }

          if (mode === "faculty" && presetFaculty) {
            const { t1, t2, t1PmLab, t2AmLab, hasT2 } =
              trackInfoForFaculty(day);

            const scanTrack = (map, pmLab, amLab, isT2) => {
              let skip = 0;
              for (let pi = 0; pi < 8; pi++) {
                if (pi === LUNCH_PI || skip-- > 0) continue;
                skip = 0;

                if (isT2 && amLab && pi === AM_LAB_BLOCK[0]) {
                  const group = labGroupForFaculty(amLab);
                  if (group.length)
                    rows.push({
                      timeLabel: "9–12",
                      entries: group,
                      isLab: true,
                    });
                  skip = 2;
                  continue;
                }
                if (!isT2 && pmLab && pi === PM_LAB_BLOCK[0]) {
                  const group = labGroupForFaculty(pmLab);
                  if (group.length)
                    rows.push({
                      timeLabel: "14–17",
                      entries: group,
                      isLab: true,
                    });
                  skip = 2;
                  continue;
                }

                const cell = map[pi] ?? null;
                const group = groupForFaculty(cell);
                if (group.length)
                  rows.push({
                    timeLabel: TIME_LABELS[pi],
                    entries: group,
                    isLab: false,
                  });
              }
            };

            scanTrack(t1, t1PmLab, null, false);
            if (hasT2) scanTrack(t2, null, t2AmLab, true);
          }

          if (rows.length === 0) return null;

          return (
            <div key={day}>
              {/* Day label */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
                  {day}
                </span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              </div>
              <div className="space-y-1.5">
                {rows.map((r, i) => {
                  const first = r.entries[0];
                  const color = r.isLab
                    ? LAB_COLOR
                    : slotColor(first.course_code);
                  return (
                    <div key={i} className="flex gap-3 items-center">
                      <span className="text-[10px] w-14 shrink-0 text-gray-400 dark:text-gray-500 font-medium">
                        {r.timeLabel}
                      </span>
                      <div
                        className={`flex-1 rounded-lg border overflow-hidden ${color}`}
                      >
                        {r.entries.map((entry, j) => {
                          const coLoc = describeCoLocation(entry, r.entries);
                          const sub = entrySub(entry);
                          return (
                            <div
                              key={entry.assignment_id ?? j}
                              className={`px-3 py-2 ${
                                j > 0
                                  ? "border-t border-dashed border-black/10 dark:border-white/10"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs font-bold leading-tight">
                                    {entry.course_code ?? "—"}
                                  </p>
                                  {sub && (
                                    <p className="text-[10px] mt-0.5 opacity-65 leading-tight">
                                      {sub}
                                    </p>
                                  )}
                                  {coLoc && (
                                    <p className="text-[9px] mt-0.5 font-semibold uppercase tracking-wide opacity-70 leading-tight">
                                      {coLoc.kind === "drop"
                                        ? "⇄ drop"
                                        : "∥ parallel"}
                                    </p>
                                  )}
                                </div>
                                {r.isLab && j === 0 && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/40 border border-current font-semibold shrink-0">
                                    LAB
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Mobile empty state */}
        {DAYS.every((day) => {
          if (mode === "student" && presetBatch) {
            const { map, isT2, pmLab, amLab } = trackInfoForBatch(
              day,
              presetBatch,
            );
            return (
              !Object.values(map).some(
                (c) => c.slot_name && groupForBatch(c, presetBatch).length,
              ) &&
              !(isT2
                ? labGroupForBatch(amLab, presetBatch).length
                : labGroupForBatch(pmLab, presetBatch).length)
            );
          }
          if (mode === "faculty" && presetFaculty) {
            const dg = scheduleData?.grid?.[day] ?? {};
            return ![...(dg.track1 ?? []), ...(dg.track2 ?? [])].some(
              (c) => c.slot_name && facultySlotNames.has(c.slot_name),
            );
          }
          return true;
        }) && (
          <p className="text-center text-sm text-gray-400 py-10">
            No classes scheduled this week.
          </p>
        )}
      </div>

      {/* ── DESKTOP: all-days table ── */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <table
          className="border-collapse"
          style={{ minWidth: 760, width: "100%" }}
        >
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/80">
              {/* Row header col */}
              <th
                className="border border-gray-100 dark:border-gray-700 px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-800/80 z-10"
                style={{ minWidth: 72 }}
              >
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
                  style={{ minWidth: i === LUNCH_PI ? 40 : 68 }}
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* STUDENT — one row per day */}
            {mode === "student" &&
              presetBatch &&
              DAYS.map((day, di) => {
                const { map, isT2, pmLab, amLab } = trackInfoForBatch(
                  day,
                  presetBatch,
                );
                const rowKey = `s-${day}`;

                return (
                  <tr
                    key={day}
                    className={[
                      "transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/30",
                      isT2 ? "bg-purple-50/20 dark:bg-purple-900/5" : "",
                      di % 2 ? "bg-gray-50/20 dark:bg-gray-800/10" : "",
                    ].join(" ")}
                  >
                    <td
                      className={`border border-gray-100 dark:border-gray-700 px-3 py-2 text-xs font-bold sticky left-0 bg-white dark:bg-gray-900 z-10 ${
                        isT2
                          ? "text-purple-500 dark:text-purple-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {day.slice(0, 3)}
                        {isT2 && (
                          <span className="text-[8px] px-1 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">
                            T2
                          </span>
                        )}
                      </div>
                    </td>
                    {renderPeriodCells(map, pmLab, amLab, isT2, rowKey)}
                  </tr>
                );
              })}

            {/* FACULTY — one row per day (or two if that day has T2) */}
            {mode === "faculty" &&
              presetFaculty &&
              DAYS.map((day, di) => {
                const { t1, t2, t1PmLab, t2AmLab, hasT2 } =
                  trackInfoForFaculty(day);

                // Only show T2 row if faculty actually has something on track2 that day
                const facultyHasT2 =
                  (hasT2 &&
                    Array.from(t2 ? Object.values(t2) : []).some(
                      (c) => c.slot_name && facultySlotNames.has(c.slot_name),
                    )) ||
                  (hasT2 && t2AmLab && facultySlotNames.has(t2AmLab));

                const rows = [
                  {
                    key: `f-${day}-t1`,
                    trackLabel: hasT2 ? "T1" : day.slice(0, 3),
                    map: t1,
                    pmLab: t1PmLab,
                    amLab: null,
                    isT2: false,
                    showDay: true,
                  },
                  ...(hasT2
                    ? [
                        {
                          key: `f-${day}-t2`,
                          trackLabel: "T2",
                          map: t2,
                          pmLab: null,
                          amLab: t2AmLab,
                          isT2: true,
                          showDay: false,
                        },
                      ]
                    : []),
                ];

                return rows.map(
                  (
                    { key, trackLabel, map, pmLab, amLab, isT2, showDay },
                    ri,
                  ) => (
                    <tr
                      key={key}
                      className={[
                        "transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/30",
                        isT2 ? "bg-purple-50/20 dark:bg-purple-900/5" : "",
                        di % 2 && !isT2
                          ? "bg-gray-50/20 dark:bg-gray-800/10"
                          : "",
                      ].join(" ")}
                      style={
                        ri === 0 && di > 0
                          ? { borderTop: "2px solid #e5e7eb" }
                          : undefined
                      }
                    >
                      <td
                        className={`border border-gray-100 dark:border-gray-700 px-3 py-2 text-xs font-bold sticky left-0 bg-white dark:bg-gray-900 z-10 ${
                          isT2
                            ? "text-purple-500 dark:text-purple-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {trackLabel}
                      </td>
                      {renderPeriodCells(map, pmLab, amLab, isT2, key)}
                    </tr>
                  ),
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Desktop empty state */}
      {mode === "student" &&
        presetBatch &&
        (() => {
          const hasAnything = DAYS.some((day) => {
            const { map, isT2, pmLab, amLab } = trackInfoForBatch(
              day,
              presetBatch,
            );
            const labSlot = isT2 ? amLab : pmLab;
            return (
              Object.values(map).some(
                (c) => groupForBatch(c, presetBatch).length,
              ) ||
              (labSlot && labGroupForBatch(labSlot, presetBatch).length)
            );
          });
          return !hasAnything ? (
            <p className="hidden md:block text-center text-sm text-gray-400 py-8">
              No classes scheduled this week.
            </p>
          ) : null;
        })()}
      {mode === "faculty" &&
        presetFaculty &&
        (() => {
          const hasAnything = DAYS.some((day) => {
            const dg = scheduleData?.grid?.[day] ?? {};
            return [...(dg.track1 ?? []), ...(dg.track2 ?? [])].some(
              (c) => c.slot_name && facultySlotNames.has(c.slot_name),
            );
          });
          return !hasAnything ? (
            <p className="hidden md:block text-center text-sm text-gray-400 py-8">
              No classes scheduled this week.
            </p>
          ) : null;
        })()}
    </div>
  );
};

export default TimetablePortalView;
