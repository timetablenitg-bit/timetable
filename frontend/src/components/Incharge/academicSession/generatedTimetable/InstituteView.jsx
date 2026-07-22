import React, { useState, useMemo } from "react";
import {
  DAYS,
  TIME_LABELS,
  LUNCH_PI,
  AM_LAB_BLOCK,
  PM_LAB_BLOCK,
  AFTER_LUNCH,
} from "./constants";
import { LAB_COLOR, slotColor } from "./colors";
import { getLabBlock } from "./helpers";
import {
  resolveBatchTrack,
  buildBatchIdByName,
} from "../../../../utils/resolveBatchTrack";
import { resolveCellEntries, isManualEntry } from "./resolveCellEntries";
import useAdminStore from "../../../../store/admin/index";
import {
  Pencil,
  Check,
  X as XIcon,
  GripVertical,
  Lock,
  Loader2,
  Save,
  Info,
} from "lucide-react";
import WarningsPanel from "./WarningsPanel";
import BatchCellEditorModal from "./BatchCellEditorModal";

// Days that support a track-2 arrangement. Must match what the skeleton
// actually defines — see utils/defaultSkeletonCells.js, which only has
// "Monday-2" and "Tuesday-2" rows. NOTE: backend trackController.js's
// TOGGLE_DAYS currently also includes Thursday, which is stale relative to
// the skeleton — flagged separately, should be fixed there too so a
// Thursday PATCH can't silently set an unrenderable track assignment.
const TOGGLE_DAYS = new Set(["Monday", "Tuesday"]);

// Same fixed treatment used in BatchTimetableGrid for entries that came
// from cell.manual_entries rather than a shared GeneratedSlot label.
const MANUAL_COLOR =
  "bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800";

// ── FilterSelect ──────────────────────────────────────────────────────────────
const FilterSelect = ({ label, value, onChange, options, colorClass }) => {
  const activeColors = {
    emerald: "bg-emerald-600 text-white border-emerald-600",
    violet: "bg-violet-600 text-white border-violet-600",
  };
  const ringColors = {
    emerald: "focus:ring-emerald-500",
    violet: "focus:ring-violet-500",
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 dark:text-gray-500">
        {label}
      </span>
      {value ? (
        <span
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${activeColors[colorClass]}`}
        >
          {value}
          <button
            onClick={() => onChange("")}
            className="ml-0.5 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-[10px] font-bold leading-none transition-colors"
            aria-label={`Clear ${label} filter`}
          >
            ×
          </button>
        </span>
      ) : (
        <select
          value=""
          onChange={(e) => onChange(e.target.value)}
          className={`text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 ${ringColors[colorClass]} cursor-pointer`}
        >
          <option value="">All {label}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

// ── TrackToggle ────────────────────────────────────────────────────────────
// disabled can be a boolean OR true — when disabled, disabledReason (if
// provided) overrides the normal title tooltip so the admin knows *why*
// it's locked, rather than it just looking unresponsive.
const TrackToggle = ({
  isT2,
  isSaving,
  onClick,
  className = "",
  disabled = false,
  disabledReason = "",
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isSaving || disabled}
    title={
      disabled && disabledReason
        ? disabledReason
        : isT2
          ? "Track 2 (lab AM, theory PM) — click to switch to Track 1"
          : "Track 1 (theory AM, lab PM) — click to switch to Track 2"
    }
    className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold leading-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
      isT2
        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50"
        : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
    } ${className}`}
  >
    <span aria-hidden="true">{isSaving ? "⏳" : "🔁"}</span>
    <span>{isT2 ? "T2" : "T1"}</span>
  </button>
);

// ── InstituteView ─────────────────────────────────────────────────────────────
const InstituteView = ({ scheduleData, slotsData }) => {
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [batchFilter, setBatchFilter] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");

  const {
    setBatchTrack,
    isSavingTrack,
    scheduleError,
    saveBatchWeek,
    isSavingBatchWeek,
    scheduleWarnings,
    batchCellError,
  } = useAdminStore();

  // NEW — per-batch drag-and-drop edit mode.
  const [batchEditMode, setBatchEditMode] = useState(false);
  // Map keyed by slot.key -> { day, track, periods, entry }. Staged, local,
  // nothing hits the server until Save.
  const [pendingChanges, setPendingChanges] = useState(new Map());
  const [dragSource, setDragSource] = useState(null); // slot object
  const [dragOverKey, setDragOverKey] = useState(null);
  const [dragError, setDragError] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null); // slot object

  const canEditBatch = !!batchFilter && !facultyFilter;

  React.useEffect(() => {
    if (!canEditBatch) {
      setBatchEditMode(false);
      setPendingChanges(new Map());
    }
  }, [canEditBatch]);

  const isFiltered = !!(batchFilter || facultyFilter);

  // ── derived data ────────────────────────────────────────────────────────────
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

  const allFaculty = useMemo(() => {
    if (!slotsData?.slots) return [];
    const seen = new Set();
    slotsData.slots.forEach((sl) =>
      sl.entries.forEach((e) => {
        const f = (e.faculty_code ?? e.faculty)?.trim();
        if (f) seen.add(f);
      }),
    );
    return [...seen].sort();
  }, [slotsData]);

  const normFaculty = (code) => (code ?? "").trim();

  const facultyMatches = (fac) =>
    !facultyFilter || normFaculty(fac) === normFaculty(facultyFilter);

  const filteredBatches = useMemo(() => {
    let list = allBatches;

    if (batchFilter) {
      list = list.filter((b) => b === batchFilter);
    }

    if (facultyFilter) {
      list = list.filter((batch) =>
        slotsData?.slots?.some((sl) =>
          sl.entries.some(
            (e) =>
              (e.batch_names ?? e.batches ?? []).includes(batch) &&
              normFaculty(e.faculty_code ?? e.faculty) ===
                normFaculty(facultyFilter),
          ),
        ),
      );
    }

    return list;
  }, [allBatches, batchFilter, facultyFilter, slotsData]);

  const batchIdByName = useMemo(
    () => buildBatchIdByName(slotsData),
    [slotsData],
  );

  const trackAssignments = scheduleData?.track_assignments?.length
    ? scheduleData.track_assignments
    : (scheduleData?.suggested_track_assignments ?? []);

  const isBatchOnTrack2 = (day, batchName) => {
    const batchId = batchIdByName[batchName];
    if (!batchId) return false;
    return resolveBatchTrack(trackAssignments, day, batchId) === 2;
  };

  // NEW — does this day currently have any unsaved edit-mode changes
  // staged? Used to block track toggling for that day until the admin
  // saves or cancels, since pendingChanges keys are track-specific
  // (`${day}::${track}::${period}`) and would silently orphan otherwise.
  const dayHasPendingChanges = (day) =>
    [...pendingChanges.keys()].some((k) => k.startsWith(`${day}::`));

  const handleToggleTrack = async (day, batchName) => {
    if (batchEditMode && dayHasPendingChanges(day)) return; // guarded, shouldn't fire (button disabled) but belt-and-braces

    const batchId = batchIdByName[batchName];
    const timetableId = scheduleData?.timetable_id;
    if (!batchId || !timetableId) return;

    const current = resolveBatchTrack(trackAssignments, day, batchId);
    const next = current === 2 ? 1 : 2;

    await setBatchTrack(timetableId, { day, batch_id: batchId, track: next });
  };

  // ── shared cell helpers ─────────────────────────────────────────────────────
  const getEntryForBatchPeriod = (batch, cell) =>
    resolveCellEntries(cell, slotMap, batch);

  // CHANGED — now checks the anchor cell's manual_entries first (same
  // priority as resolveCellEntries), falling back to the raw slot_name
  // lookup. Without this, a lab moved via the new editor would never
  // render anywhere, including outside edit mode.
  const getLabEntry = (labSlotName, batch, anchorCell) => {
    const manual = (anchorCell?.manual_entries ?? []).find((e) =>
      (e.batch_names ?? e.batches ?? []).includes(batch),
    );
    if (manual) return manual;

    const hidden = new Set(
      (anchorCell?.hidden_assignment_ids ?? []).map(String),
    );
    const slot = slotsData?.slots?.find((s) => s.slot_name === labSlotName);
    return (
      slot?.entries?.find(
        (e) =>
          !hidden.has(String(e.assignment_id ?? "")) &&
          (e.batch_names ?? e.batches ?? []).includes(batch),
      ) ?? null
    );
  };

  // NEW — mirrors isManualEntry (used for theory cells) but for lab
  // entries resolved via getLabEntry, which can come from anchorCell's
  // manual_entries array. A reference check is enough since getLabEntry
  // returns the exact object from that array when it's a manual placement.
  const isManualLabEntry = (anchorCell, entry) =>
    !!entry && (anchorCell?.manual_entries ?? []).includes(entry);

  const emptyCell = (key, colSpan) => (
    <td
      key={key}
      colSpan={colSpan}
      className="border border-gray-100 dark:border-gray-700 px-1 py-1 text-center"
    >
      <span className="text-[10px] text-gray-200 dark:text-gray-700">—</span>
    </td>
  );

  const getDayTrackInfo = (day, batch) => {
    const dayGrid = scheduleData?.grid?.[day];
    const t1Cells = (dayGrid?.track1 ?? []).sort(
      (a, b) => a.period_index - b.period_index,
    );
    const t2Cells = (dayGrid?.track2 ?? []).sort(
      (a, b) => a.period_index - b.period_index,
    );
    const t1Map = Object.fromEntries(t1Cells.map((c) => [c.period_index, c]));
    const t2Map = Object.fromEntries(t2Cells.map((c) => [c.period_index, c]));
    const t1PmLab = getLabBlock(t1Map, PM_LAB_BLOCK);
    const t2AmLab = getLabBlock(t2Map, AM_LAB_BLOCK);
    const isT2 = isBatchOnTrack2(day, batch) && !!t2AmLab;
    return {
      map: isT2 ? t2Map : t1Map,
      isT2,
      rowHasT2: TOGGLE_DAYS.has(day),
      batchPmLab: isT2 ? null : t1PmLab,
      batchAmLab: isT2 ? t2AmLab : null,
    };
  };

  // ── period cells renderer — used by the normal (non-edit) views only ────────
  const renderPeriodCells = (batch, isT2, map, batchPmLab, batchAmLab) =>
    Array.from({ length: 8 }, (_, pi) => {
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

      if (isT2 && batchAmLab) {
        if (pi === AM_LAB_BLOCK[0]) {
          const anchorCell = map[pi] ?? null;
          const labEntry = getLabEntry(batchAmLab, batch, anchorCell);
          if (!labEntry || !facultyMatches(labEntry.faculty_code)) {
            return emptyCell(pi, 3);
          }
          const code = labEntry.course_code ?? batchAmLab;
          const fac = labEntry.faculty_code ?? "";
          return (
            <td
              key={pi}
              colSpan={3}
              className="border border-gray-100 dark:border-gray-700 px-1 py-1 align-middle"
            >
              <div
                className={`rounded-md border px-2 py-1 text-center ${LAB_COLOR}`}
              >
                <p className="text-[11px] font-bold leading-none">{code}</p>
                {fac && (
                  <p className="text-[9px] mt-0.5 leading-none opacity-60">
                    {fac}
                  </p>
                )}
                <p className="text-[9px] mt-0.5 opacity-50 leading-none">
                  Lab (AM)
                </p>
              </div>
            </td>
          );
        }
        if (AM_LAB_BLOCK.slice(1).includes(pi)) return null;
      }

      if (!isT2 && batchPmLab) {
        if (pi === PM_LAB_BLOCK[0]) {
          const anchorCell = map[pi] ?? null;
          const labEntry = getLabEntry(batchPmLab, batch, anchorCell);
          if (!labEntry || !facultyMatches(labEntry.faculty_code)) {
            return emptyCell(pi, 3);
          }
          const code = labEntry.course_code ?? batchPmLab;
          const fac = labEntry.faculty_code ?? "";
          return (
            <td
              key={pi}
              colSpan={3}
              className="border border-gray-100 dark:border-gray-700 px-1 py-1 align-middle"
            >
              <div
                className={`rounded-md border px-2 py-1 text-center ${LAB_COLOR}`}
              >
                <p className="text-[11px] font-bold leading-none">{code}</p>
                {fac && (
                  <p className="text-[9px] mt-0.5 leading-none opacity-60">
                    {fac}
                  </p>
                )}
                <p className="text-[9px] mt-0.5 opacity-50 leading-none">
                  Lab (PM)
                </p>
              </div>
            </td>
          );
        }
        if (PM_LAB_BLOCK.slice(1).includes(pi)) return null;
      }

      const cell = map[pi] ?? null;
      const entry = getEntryForBatchPeriod(batch, cell);
      const name = cell?.slot_name;

      if (
        !entry &&
        (!name ||
          name === "BREAK" ||
          name === null ||
          cell?.slot_type === "free" ||
          cell?.slot_type === "lab")
      ) {
        return emptyCell(pi);
      }

      if (!entry) return emptyCell(pi);

      if (!facultyMatches(entry.faculty_code ?? entry.faculty)) {
        return emptyCell(pi);
      }

      const manual = cell ? isManualEntry(cell, entry) : false;
      const code = entry.course_code ?? entry.course ?? "—";
      const fac = entry.faculty_code ?? entry.faculty ?? "";
      const color = manual ? MANUAL_COLOR : slotColor(name);

      return (
        <td
          key={pi}
          className="border border-gray-100 dark:border-gray-700 px-1 py-1"
        >
          <div
            className={`rounded-md border px-1.5 py-1 text-center relative ${color}`}
          >
            {manual && (
              <span
                title="Manually placed"
                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-fuchsia-500 text-white text-[8px] font-bold leading-none"
              >
                M
              </span>
            )}
            <p className="text-[11px] font-bold leading-none">{code}</p>
            {fac && (
              <p className="text-[9px] mt-0.5 leading-none opacity-60">{fac}</p>
            )}
          </div>
        </td>
      );
    });

  // ── FILTERED VIEW (read-only) — all 5 days stacked ──────────────────────────
  const renderFilteredView = () => (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <table
        className="border-collapse"
        style={{ minWidth: 780, width: "100%" }}
      >
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/80">
            <th
              className="border border-gray-100 dark:border-gray-700 px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-800/80 z-10"
              style={{ minWidth: 120 }}
            >
              Batch
            </th>
            <th
              className="border border-gray-100 dark:border-gray-700 px-2 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400"
              style={{ minWidth: 44 }}
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
          {filteredBatches.length === 0 ? (
            <tr>
              <td
                colSpan={TIME_LABELS.length + 2}
                className="py-12 text-center text-sm text-gray-400 dark:text-gray-600"
              >
                No batches match the selected filters.
              </td>
            </tr>
          ) : (
            filteredBatches.map((batch, bi) =>
              DAYS.map((day, di) => {
                const { map, isT2, rowHasT2, batchPmLab, batchAmLab } =
                  getDayTrackInfo(day, batch);
                const assignedT2 = isBatchOnTrack2(day, batch);
                const isFirstDay = di === 0;

                return (
                  <tr
                    key={`${batch}-${day}`}
                    className={[
                      "transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/30",
                      isT2 ? "bg-purple-50/20 dark:bg-purple-900/5" : "",
                      bi % 2 && !isT2
                        ? "bg-gray-50/20 dark:bg-gray-800/10"
                        : "",
                    ].join(" ")}
                    style={
                      isFirstDay && bi > 0
                        ? { borderTop: "2px solid #e5e7eb" }
                        : undefined
                    }
                  >
                    {isFirstDay && (
                      <td
                        rowSpan={DAYS.length}
                        className="border border-gray-100 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 z-10 align-middle"
                        style={
                          bi > 0
                            ? { borderTop: "2px solid #e5e7eb" }
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-1.5">{batch}</div>
                      </td>
                    )}

                    <td
                      className={`border border-gray-100 dark:border-gray-700 px-2 py-1.5 text-center text-[10px] font-semibold whitespace-nowrap ${
                        isT2
                          ? "text-purple-400 dark:text-purple-500"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {day.slice(0, 3)}
                        {rowHasT2 && (
                          <TrackToggle
                            isT2={assignedT2}
                            isSaving={isSavingTrack}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTrack(day, batch);
                            }}
                          />
                        )}
                      </span>
                    </td>

                    {renderPeriodCells(
                      batch,
                      isT2,
                      map,
                      batchPmLab,
                      batchAmLab,
                    )}
                  </tr>
                );
              }),
            )
          )}
        </tbody>
      </table>
    </div>
  );

  // ── NORMAL VIEW — single selected day with day toggle ───────────────────────
  const dayGrid = scheduleData?.grid?.[selectedDay];
  const t1Cells = (dayGrid?.track1 ?? []).sort(
    (a, b) => a.period_index - b.period_index,
  );
  const t2Cells = (dayGrid?.track2 ?? []).sort(
    (a, b) => a.period_index - b.period_index,
  );
  const t1Map = Object.fromEntries(t1Cells.map((c) => [c.period_index, c]));
  const t2Map = Object.fromEntries(t2Cells.map((c) => [c.period_index, c]));
  const t1PmLab = getLabBlock(t1Map, PM_LAB_BLOCK);
  const t2AmLab = getLabBlock(t2Map, AM_LAB_BLOCK);
  const hasT2 = !!t2AmLab;
  const canToggleTrack = TOGGLE_DAYS.has(selectedDay);

  const renderTimeGrid = () => (
    <>
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
              {scheduleData?.grid?.[day]?.track2 ? (
                <span className="ml-1 text-[8px] text-purple-400">T2</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {canToggleTrack && (
        <div className="flex gap-2 text-xs flex-wrap items-center">
          <span className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300">
            Track 1: theory 9–13, {t1PmLab ? `${t1PmLab} lab 14–17` : "free PM"}
          </span>
          <span className="px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 text-purple-600 dark:text-purple-300">
            Track 2: {t2AmLab ? `${t2AmLab} lab 9–12` : "lab 9–12"}, theory
            14–17
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">
            🔁 Click a batch's toggle to change how it's shown — doesn't affect
            the score.
          </span>
          {scheduleError && (
            <span className="text-[10px] text-red-500">{scheduleError}</span>
          )}
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
                  className={`border border-gray-100 dark:border-gray-700 px-1 py-2.5 text-center text-[9px] font-semibold whitespace-nowrap ${
                    i === LUNCH_PI
                      ? "text-gray-300 dark:text-gray-600"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                  style={{ minWidth: i === LUNCH_PI ? 48 : 72 }}
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allBatches.map((batch, bi) => {
              const assignedT2 = isBatchOnTrack2(selectedDay, batch);
              const isT2 = assignedT2 && hasT2;
              const map = isT2 ? t2Map : t1Map;
              const batchPmLab = isT2 ? null : t1PmLab;
              const batchAmLab = isT2 ? t2AmLab : null;

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
                      {canToggleTrack && (
                        <TrackToggle
                          isT2={assignedT2}
                          isSaving={isSavingTrack}
                          onClick={() => handleToggleTrack(selectedDay, batch)}
                        />
                      )}
                    </div>
                  </td>

                  {renderPeriodCells(batch, isT2, map, batchPmLab, batchAmLab)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // NEW — freeform batch-week editor (drag & drop, incl. labs)
  // ══════════════════════════════════════════════════════════════════════════

  // CHANGED — now carries slotName + isManual so the edit-mode cell
  // renderer can use the same slotColor/MANUAL_COLOR logic as the other
  // two views instead of falling back to an unmatched/black block.
  const makeSlot = (day, track, periods, isLab, entry, slotName, isManual) => {
    const batchNames = entry?.batch_names ?? entry?.batches ?? [];
    return {
      key: `${day}::${track}::${periods[0]}`,
      day,
      track,
      periods,
      isLab,
      slotName: slotName ?? null,
      isManual: !!isManual,
      content: entry
        ? {
            course_code: entry.course_code ?? entry.course ?? "",
            faculty_code: entry.faculty_code ?? entry.faculty ?? "",
            component_type: entry.component_type ?? (isLab ? "lab" : "lecture"),
          }
        : null,
      isMultiBatch: batchNames.length > 1,
    };
  };

  // Every draggable "slot" for this batch on this day — theory cells as
  // 1-period slots, lab blocks as a single 3-period slot.
  const buildBatchDayRow = (day, batch) => {
    const { map, isT2, batchPmLab, batchAmLab } = getDayTrackInfo(day, batch);
    const track = isT2 ? 2 : 1;
    const slots = [];
    let pi = 0;
    while (pi < 8) {
      if (pi === LUNCH_PI) {
        // Explicit placeholder — must still occupy a slot in the row so
        // the column count matches the header (TIME_LABELS has one entry
        // per period, lunch included). Previously this period was just
        // skipped, which silently dropped a <td> from the row and shifted
        // every later column left by one — the "lunch has lectures,
        // everything's deranged" bug.
        slots.push({
          key: `${day}::${track}::${pi}::lunch`,
          day,
          track,
          periods: [pi],
          isLab: false,
          isLunch: true,
          slotName: null,
          isManual: false,
          content: null,
          isMultiBatch: false,
        });
        pi++;
        continue;
      }
      if (isT2 && batchAmLab && pi === AM_LAB_BLOCK[0]) {
        const anchorCell = map[pi] ?? null;
        const entry = getLabEntry(batchAmLab, batch, anchorCell);
        slots.push(
          makeSlot(
            day,
            track,
            [...AM_LAB_BLOCK],
            true,
            entry,
            batchAmLab,
            isManualLabEntry(anchorCell, entry),
          ),
        );
        pi = AM_LAB_BLOCK[AM_LAB_BLOCK.length - 1] + 1;
        continue;
      }
      if (!isT2 && batchPmLab && pi === PM_LAB_BLOCK[0]) {
        const anchorCell = map[pi] ?? null;
        const entry = getLabEntry(batchPmLab, batch, anchorCell);
        slots.push(
          makeSlot(
            day,
            track,
            [...PM_LAB_BLOCK],
            true,
            entry,
            batchPmLab,
            isManualLabEntry(anchorCell, entry),
          ),
        );
        pi = PM_LAB_BLOCK[PM_LAB_BLOCK.length - 1] + 1;
        continue;
      }
      const cell = map[pi] ?? null;
      const entry = getEntryForBatchPeriod(batch, cell);
      const manual = cell ? isManualEntry(cell, entry) : false;
      slots.push(
        makeSlot(day, track, [pi], false, entry, cell?.slot_name, manual),
      );
      pi++;
    }
    return slots;
  };

  const effectiveContent = (slot) =>
    pendingChanges.has(slot.key)
      ? pendingChanges.get(slot.key).entry
      : slot.content;

  const stageChange = (slot, entry) => {
    setPendingChanges((prev) => {
      const next = new Map(prev);
      next.set(slot.key, {
        day: slot.day,
        track: slot.track,
        periods: slot.periods,
        entry,
      });
      return next;
    });
  };

  const handleDragStart = (slot) => {
    if (slot.isMultiBatch) return;
    if (!effectiveContent(slot)) return;
    setDragSource(slot);
    setDragError(null);
  };

  const handleDrop = (targetSlot) => {
    setDragOverKey(null);
    if (!dragSource) return;
    const source = dragSource;
    setDragSource(null);

    if (targetSlot.isMultiBatch) {
      setDragError(
        "That cell is a joint session shared with other batches — edit it from the Slots tab instead.",
      );
      return;
    }
    if (targetSlot.periods.length !== source.periods.length) {
      setDragError(
        `Can't drop a ${source.periods.length === 3 ? "lab block" : "single period"} onto a ${
          targetSlot.periods.length === 3 ? "lab block" : "single period"
        } — they're different sizes.`,
      );
      return;
    }
    if (targetSlot.key === source.key) return;

    const sourceContent = effectiveContent(source);
    const targetContent = effectiveContent(targetSlot);

    stageChange(targetSlot, sourceContent);
    stageChange(source, targetContent ?? null);
    setDragError(null);
  };

  const handleClearSlot = (slot) => {
    if (slot.isMultiBatch) return;
    stageChange(slot, null);
  };

  const handleEditSlotClick = (slot) => {
    if (slot.isMultiBatch) return;
    setEditingSlot(slot);
  };

  const handleModalSave = (entryOrNull) => {
    if (editingSlot) stageChange(editingSlot, entryOrNull);
    setEditingSlot(null);
  };

  const handleCancelWeek = () => {
    setPendingChanges(new Map());
    setDragError(null);
    setBatchEditMode(false);
  };

  const handleSaveWeek = async () => {
    if (!batchFilter) return;
    if (!pendingChanges.size) {
      setBatchEditMode(false);
      return;
    }
    const batchId = batchIdByName[batchFilter];
    const timetableId = scheduleData?.timetable_id;
    if (!batchId || !timetableId) return;

    const changes = [...pendingChanges.values()].map((c) => ({
      day: c.day,
      track: c.track,
      periods: c.periods,
      entry: c.entry,
    }));

    const result = await saveBatchWeek(timetableId, {
      batch_id: batchId,
      batch_name: batchFilter,
      changes,
    });
    if (result?.ok) {
      setPendingChanges(new Map());
      setBatchEditMode(false);
    }
  };

  const renderEditableBatchWeek = () => {
    const batch = batchFilter;

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-300 flex-1 min-w-0">
            <Info size={11} className="shrink-0" />
            <span>
              Drag any cell — theory or lab — to move or swap it. Click to edit,
              × to clear. 🔒 cells are joint sessions shared with other batches.
              Changes are local until you save.
            </span>
          </div>
          {dragError && (
            <span className="text-[10px] text-red-500 shrink-0">
              {dragError}
            </span>
          )}
          {batchCellError && (
            <span className="text-[10px] text-red-500 shrink-0">
              {batchCellError}
            </span>
          )}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCancelWeek}
              disabled={isSavingBatchWeek}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveWeek}
              disabled={isSavingBatchWeek}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSavingBatchWeek ? (
                <>
                  <Loader2 size={11} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={11} />
                  Save{pendingChanges.size ? ` (${pendingChanges.size})` : ""}
                </>
              )}
            </button>
          </div>
        </div>

        <WarningsPanel warnings={scheduleWarnings} batchName={batch} />

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <table
            className="border-collapse"
            style={{ minWidth: 720, width: "100%" }}
          >
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/80">
                <th
                  className="border border-gray-100 dark:border-gray-700 px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-800/80 z-10"
                  style={{ minWidth: 90 }}
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
                    style={{ minWidth: i === LUNCH_PI ? 48 : 72 }}
                  >
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => {
                const slots = buildBatchDayRow(day, batch);
                const assignedT2 = isBatchOnTrack2(day, batch);
                const canToggleThisDay = TOGGLE_DAYS.has(day);
                const pendingOnThisDay = dayHasPendingChanges(day);

                return (
                  <tr key={day}>
                    <td className="border border-gray-100 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 z-10">
                      <div className="flex items-center gap-1.5">
                        {day.slice(0, 3)}
                        {canToggleThisDay && (
                          <TrackToggle
                            isT2={assignedT2}
                            isSaving={isSavingTrack}
                            disabled={pendingOnThisDay}
                            disabledReason={
                              pendingOnThisDay
                                ? "Save or cancel this day's pending changes before switching tracks"
                                : ""
                            }
                            onClick={() => handleToggleTrack(day, batch)}
                          />
                        )}
                      </div>
                    </td>
                    {slots.map((slot) => {
                      if (slot.isLunch) {
                        return (
                          <td
                            key={slot.key}
                            className="border border-gray-100 dark:border-gray-700 px-1 py-1 bg-gray-50/80 dark:bg-gray-800/60 text-center"
                          >
                            <span className="text-[9px] text-gray-300 dark:text-gray-600 italic">
                              —
                            </span>
                          </td>
                        );
                      }
                      const content = effectiveContent(slot);
                      const isDragging = dragSource?.key === slot.key;
                      const isOver = dragOverKey === slot.key;
                      const locked = slot.isMultiBatch;
                      const manual = slot.isManual;
                      const color = manual
                        ? MANUAL_COLOR
                        : slot.isLab
                          ? LAB_COLOR
                          : slotColor(slot.slotName) ||
                            "bg-gray-50 dark:bg-gray-800/60";

                      return (
                        <td
                          key={slot.key}
                          colSpan={slot.periods.length}
                          onDragOver={
                            !locked
                              ? (e) => {
                                  e.preventDefault();
                                  setDragOverKey(slot.key);
                                }
                              : undefined
                          }
                          onDragLeave={
                            !locked ? () => setDragOverKey(null) : undefined
                          }
                          onDrop={!locked ? () => handleDrop(slot) : undefined}
                          className={`border border-gray-100 dark:border-gray-700 px-1 py-1 align-middle transition-colors ${
                            isOver ? "bg-emerald-50 dark:bg-emerald-900/20" : ""
                          }`}
                        >
                          {content ? (
                            <div
                              draggable={!locked}
                              onDragStart={
                                !locked
                                  ? () => handleDragStart(slot)
                                  : undefined
                              }
                              onDragEnd={() => {
                                setDragSource(null);
                                setDragOverKey(null);
                              }}
                              onClick={() => handleEditSlotClick(slot)}
                              className={`relative rounded-md border px-2 py-1.5 text-center group ${color} ${
                                locked
                                  ? "opacity-70 cursor-not-allowed"
                                  : "cursor-grab active:cursor-grabbing hover:brightness-95 dark:hover:brightness-110"
                              } ${isDragging ? "opacity-30" : ""}`}
                            >
                              {locked ? (
                                <Lock
                                  size={10}
                                  className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 p-0.5 rounded-full bg-gray-500 text-white"
                                  title="Joint session shared with other batches — edit from Slots tab"
                                />
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClearSlot(slot);
                                  }}
                                  className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-gray-400 dark:bg-gray-600 text-white flex items-center justify-center z-10 hover:bg-red-400 transition-colors"
                                  title="Clear"
                                >
                                  <XIcon size={8} />
                                </button>
                              )}
                              {manual && !locked && (
                                <span
                                  title="Manually placed"
                                  className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-fuchsia-500 text-white text-[8px] font-bold leading-none"
                                >
                                  M
                                </span>
                              )}
                              {!locked && (
                                <GripVertical
                                  size={9}
                                  className="absolute left-1 top-1/2 -translate-y-1/2 opacity-40 group-hover:opacity-70 transition-opacity"
                                />
                              )}
                              <p className="text-[11px] font-bold leading-none">
                                {content.course_code}
                              </p>
                              {content.faculty_code && (
                                <p className="text-[9px] mt-0.5 leading-none opacity-60">
                                  {content.faculty_code}
                                </p>
                              )}
                              {slot.isLab && (
                                <p className="text-[9px] mt-0.5 opacity-50 leading-none">
                                  Lab
                                </p>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditSlotClick(slot)}
                              className="w-full h-full py-1.5 rounded-md text-[10px] text-gray-200 dark:text-gray-700 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10 hover:text-emerald-500 transition-colors"
                            >
                              +
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {editingSlot && (
          <BatchCellEditorModal
            batchName={batch}
            day={editingSlot.day}
            periodIndex={editingSlot.periods[0]}
            timeLabel={TIME_LABELS[editingSlot.periods[0]]}
            currentEntry={effectiveContent(editingSlot)}
            isSaving={false}
            onSave={handleModalSave}
            onClose={() => setEditingSlot(null)}
          />
        )}
      </div>
    );
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-4 flex-wrap rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 px-4 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Filter
        </span>

        <FilterSelect
          label="Batch"
          value={batchFilter}
          onChange={setBatchFilter}
          options={allBatches}
          colorClass="emerald"
        />

        <FilterSelect
          label="Faculty"
          value={facultyFilter}
          onChange={setFacultyFilter}
          options={allFaculty}
          colorClass="violet"
        />

        {isFiltered && !batchEditMode && (
          <>
            <span className="text-gray-200 dark:text-gray-700 select-none">
              |
            </span>
            <button
              onClick={() => {
                setBatchFilter("");
                setFacultyFilter("");
              }}
              className="text-[11px] text-gray-400 hover:text-red-500 dark:hover:text-red-400 font-medium transition-colors"
            >
              Clear all
            </button>
            <span className="ml-auto text-[10px] italic text-gray-400 dark:text-gray-500">
              All 5 days · {filteredBatches.length} batch
              {filteredBatches.length !== 1 ? "es" : ""}
            </span>
          </>
        )}

        {canEditBatch && !batchEditMode && (
          <button
            onClick={() => setBatchEditMode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Pencil size={12} />
            Edit {batchFilter}'s timetable
          </button>
        )}
      </div>

      {batchEditMode
        ? renderEditableBatchWeek()
        : isFiltered
          ? renderFilteredView()
          : renderTimeGrid()}
    </div>
  );
};

export default InstituteView;
