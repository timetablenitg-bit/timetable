import React, { useState, useMemo, useEffect } from "react";
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
  Trash2,
} from "lucide-react";
import WarningsPanel from "./WarningsPanel";
import BatchCellEditorModal from "./BatchCellEditorModal";
import { useTour } from "../../../../context/TourContext";
import useTourAutostart from "../../../../tour/Usetourautostart";

const TOGGLE_DAYS = new Set(["Monday", "Tuesday"]);

const MANUAL_COLOR =
  "bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800";

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

    unplacedAssignments,
    isFetchingUnplaced,
    fetchUnplacedAssignments,
  } = useAdminStore();

  const [batchEditMode, setBatchEditMode] = useState(false);
  const {
    switchView,
    stop: stopTour,
    view: activeTourView,
    run: tourRunning,
    stepIndex: tourStepIndex,
    steps: tourSteps,
  } = useTour();
  const instituteBaseView = "academic-session-timetable-institute";
  const instituteFilteredView = "academic-session-timetable-institute-filtered";
  const instituteEditView = "academic-session-timetable-institute-editing";

  useTourAutostart(instituteBaseView, { enabled: !batchEditMode });
  useTourAutostart(instituteEditView, { enabled: batchEditMode });
  useEffect(() => {
    if (!batchEditMode) return;
    switchView(instituteEditView);
  }, [batchEditMode, switchView]);

  useEffect(() => {
    return () => stopTour();
  }, [stopTour]);

  const [pendingChanges, setPendingChanges] = useState(new Map());
  const [dragSource, setDragSource] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);
  const [dragError, setDragError] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);

  const [extraLabs, setExtraLabs] = useState(new Map());

  const [labPickMode, setLabPickMode] = useState(null);

  const canEditBatch = !!batchFilter && !facultyFilter;

  React.useEffect(() => {
    if (!canEditBatch) {
      setBatchEditMode(false);
      setPendingChanges(new Map());
      setExtraLabs(new Map());
      setLabPickMode(null);
    }
  }, [canEditBatch]);

  useEffect(() => {
    if (!tourRunning || batchEditMode) return;
    if (activeTourView !== instituteBaseView) return;
    const isOnLastBaseStep = tourStepIndex === tourSteps.length - 1;
    if (!isOnLastBaseStep || !canEditBatch) return;
    switchView(instituteFilteredView);
  }, [
    tourRunning,
    activeTourView,
    batchEditMode,
    tourStepIndex,
    tourSteps.length,
    canEditBatch,
    switchView,
    instituteBaseView,
    instituteFilteredView,
  ]);

  useEffect(() => {
    if (!tourRunning || batchEditMode) return;
    if (activeTourView !== instituteFilteredView) return;
    if (canEditBatch) return;
    switchView(instituteBaseView);
  }, [
    tourRunning,
    activeTourView,
    batchEditMode,
    canEditBatch,
    switchView,
    instituteBaseView,
    instituteFilteredView,
  ]);

  useEffect(() => {
    const sessionId = scheduleData?.session_id;
    if (sessionId) {
      fetchUnplacedAssignments(sessionId);
    }
  }, [scheduleData?.session_id, fetchUnplacedAssignments]);

  const isFiltered = !!(batchFilter || facultyFilter);

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

  const dayHasPendingChanges = (day) =>
    [...pendingChanges.keys()].some((k) => k.startsWith(`${day}::`));

  const handleToggleTrack = async (day, batchName) => {
    if (batchEditMode && dayHasPendingChanges(day)) return;

    const batchId = batchIdByName[batchName];
    const timetableId = scheduleData?.timetable_id;
    if (!batchId || !timetableId) return;

    const current = resolveBatchTrack(trackAssignments, day, batchId);
    const next = current === 2 ? 1 : 2;

    await setBatchTrack(timetableId, { day, batch_id: batchId, track: next });
  };

  const batchUnplacedSummary = useMemo(() => {
    const map = {};
    (unplacedAssignments ?? []).forEach((a) => {
      (a.batch_names ?? []).forEach((b) => {
        map[b] = map[b] || { lecture: 0, lab: 0, other: 0 };
        const key =
          a.component_type === "lab"
            ? "lab"
            : a.component_type === "lecture"
              ? "lecture"
              : "other";
        map[b][key] += 1;
      });
    });
    return map;
  }, [unplacedAssignments]);

  const UnplacedBadge = ({ batch }) => {
    const info = batchUnplacedSummary[batch];
    if (!info || (!info.lecture && !info.lab && !info.other)) return null;
    const parts = [];
    if (info.lecture)
      parts.push(`${info.lecture} lecture${info.lecture > 1 ? "s" : ""}`);
    if (info.lab) parts.push(`${info.lab} lab${info.lab > 1 ? "s" : ""}`);
    if (info.other) parts.push(`${info.other} other`);
    return (
      <span
        title={`Still unplaced for ${batch}: ${parts.join(", ")}`}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 whitespace-nowrap"
      >
        ⚠ {parts.join(" · ")}
      </span>
    );
  };

  const getEntryForBatchPeriod = (batch, cell) =>
    resolveCellEntries(cell, slotMap, batch);

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
    const isT2 = isBatchOnTrack2(day, batch);
    return {
      map: isT2 ? t2Map : t1Map,
      isT2,
      rowHasT2: TOGGLE_DAYS.has(day),
      batchPmLab: isT2 ? null : t1PmLab,

      batchAmLab: isT2 ? t2AmLab : null,
    };
  };

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

  const renderFilteredView = () => (
    <div className="space-y-3">
      {(batchFilter || facultyFilter) && (
        <WarningsPanel
          warnings={scheduleWarnings}
          batchName={batchFilter || undefined}
          facultyName={facultyFilter || undefined}
        />
      )}

      <div
        className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
        data-tour="institute-batch-edit-grid"
      >
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
                          <div className="flex flex-col items-start gap-1">
                            <span>{batch}</span>
                            <UnplacedBadge batch={batch} />
                          </div>
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
    </div>
  );

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
        {scheduleError && (
          <span className="text-[10px] text-red-500">{scheduleError}</span>
        )}
      </div>

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
              const isT2 = assignedT2;
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
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-1.5">
                        {batch}
                        {canToggleTrack && (
                          <TrackToggle
                            isT2={assignedT2}
                            isSaving={isSavingTrack}
                            onClick={() =>
                              handleToggleTrack(selectedDay, batch)
                            }
                          />
                        )}
                      </div>
                      <UnplacedBadge batch={batch} />
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
            assignment_id: entry.assignment_id ?? null,
            course_code: entry.course_code ?? entry.course ?? "",
            faculty_code: entry.faculty_code ?? entry.faculty ?? "",
            component_type: entry.component_type ?? (isLab ? "lab" : "lecture"),
          }
        : null,
      isMultiBatch: batchNames.length > 1,
    };
  };

  const buildBatchDayRow = (day, batch) => {
    const { map, isT2, batchPmLab, batchAmLab } = getDayTrackInfo(day, batch);
    const track = isT2 ? 2 : 1;
    const dayExtraLabs = extraLabs.get(`${day}::${track}`) ?? [];
    const slots = [];
    let pi = 0;
    while (pi < 8) {
      if (pi === LUNCH_PI) {
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

      const extraBlock = dayExtraLabs.find((block) => block[0] === pi);
      if (extraBlock) {
        const slotKey = `${day}::${track}::${pi}::extralab`;
        slots.push({
          key: slotKey,
          day,
          track,
          periods: extraBlock,
          isLab: true,
          isExtraLab: true,
          slotName: null,
          isManual: true,
          content: null,
          isMultiBatch: false,
        });
        pi = extraBlock[extraBlock.length - 1] + 1;
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
        `Can't drop a ${source.periods.length === 1 ? "single period" : `${source.periods.length}-period block`} onto a ${
          targetSlot.periods.length === 1
            ? "single period"
            : `${targetSlot.periods.length}-period block`
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
    setExtraLabs(new Map());
    setLabPickMode(null);
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
      setExtraLabs(new Map());
      setBatchEditMode(false);
    }
  };

  const reservedPeriodsFor = (day, track) => {
    const batch = batchFilter;
    const { batchAmLab, batchPmLab, isT2 } = getDayTrackInfo(day, batch);
    const reserved = new Set();
    if (isT2 && batchAmLab) AM_LAB_BLOCK.forEach((p) => reserved.add(p));
    if (!isT2 && batchPmLab) PM_LAB_BLOCK.forEach((p) => reserved.add(p));
    (extraLabs.get(`${day}::${track}`) ?? []).forEach((block) =>
      block.forEach((p) => reserved.add(p)),
    );
    return reserved;
  };

  const findFreeLabBlock = (day, length) => {
    const batch = batchFilter;
    const { map, isT2 } = getDayTrackInfo(day, batch);
    const track = isT2 ? 2 : 1;
    const reserved = reservedPeriodsFor(day, track);

    for (let pi = 0; pi <= 8 - length; pi++) {
      const span = Array.from({ length }, (_, i) => pi + i);
      if (span.includes(LUNCH_PI)) continue;
      if (span.some((p) => reserved.has(p))) continue;

      const occupied = span.some((p) => {
        const cell = map[p] ?? null;
        const entry = getEntryForBatchPeriod(batch, cell);
        return !!entry;
      });
      if (occupied) continue;

      return span;
    }
    return null;
  };

  const classifyLabStart = (day, start, length) => {
    const batch = batchFilter;
    const { map, isT2 } = getDayTrackInfo(day, batch);
    const track = isT2 ? 2 : 1;
    const reserved = reservedPeriodsFor(day, track);

    if (start + length > 8) return "blocked";
    const span = Array.from({ length }, (_, i) => start + i);
    if (span.includes(LUNCH_PI)) return "blocked";
    if (span.some((p) => reserved.has(p))) return "blocked";

    let anyOccupied = false;
    for (const p of span) {
      const cell = map[p] ?? null;
      const entry = getEntryForBatchPeriod(batch, cell);
      if (entry) {
        if ((entry.batch_names ?? entry.batches ?? []).length > 1) {
          return "blocked";
        }
        anyOccupied = true;
      }
    }
    return anyOccupied ? "occupied" : "free";
  };

  const commitExtraLabBlock = (day, periods) => {
    const batch = batchFilter;
    const { isT2 } = getDayTrackInfo(day, batch);
    const track = isT2 ? 2 : 1;
    const key = `${day}::${track}`;

    setExtraLabs((prev) => {
      const next = new Map(prev);
      next.set(key, [...(next.get(key) ?? []), periods]);
      return next;
    });
    setDragError(null);
    setLabPickMode(null);
    setEditingSlot({
      key: `${day}::${track}::${periods[0]}::extralab`,
      day,
      track,
      periods,
      isLab: true,
      isExtraLab: true,
      content: null,
      isMultiBatch: false,
    });
  };

  const handleAutoAddExtraLab = (day, length) => {
    const periods = findFreeLabBlock(day, length);
    if (!periods) {
      setDragError(
        `No genuinely free ${length}-period block left on ${day} — try "Pick periods" to place it manually, moving or overriding something if needed.`,
      );
      return;
    }
    commitExtraLabBlock(day, periods);
  };

  const handleRemoveExtraLab = (slot) => {
    setExtraLabs((prev) => {
      const next = new Map(prev);
      const key = `${slot.day}::${slot.track}`;
      const blocks = (next.get(key) ?? []).filter(
        (b) => b[0] !== slot.periods[0],
      );
      if (blocks.length) next.set(key, blocks);
      else next.delete(key);
      return next;
    });
    setPendingChanges((prev) => {
      const next = new Map(prev);
      next.delete(slot.key);
      return next;
    });
  };

  const renderEditableBatchWeek = () => {
    const batch = batchFilter;

    return (
      <div className="space-y-3">
        <div
          data-tour="institute-batch-edit-toolbar"
          className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800"
        >
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

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {batch}
          </span>
          <UnplacedBadge batch={batch} />
        </div>

        <WarningsPanel
          warnings={scheduleWarnings}
          batchName={batch}
          facultyName={facultyFilter || undefined}
        />

        <div
          className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
          data-tour="institute-batch-edit-grid"
        >
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
                const pickingThisDay = labPickMode?.day === day;

                return (
                  <tr key={day}>
                    <td className="border border-gray-100 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 z-10 align-top">
                      <div className="flex flex-col gap-1.5">
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

                        {pickingThisDay ? (
                          <div className="flex flex-wrap items-center gap-1">
                            {Array.from(
                              { length: 9 - labPickMode.length },
                              (_, start) => {
                                const status = classifyLabStart(
                                  day,
                                  start,
                                  labPickMode.length,
                                );
                                if (status === "blocked") return null;
                                return (
                                  <button
                                    key={start}
                                    onClick={() =>
                                      commitExtraLabBlock(
                                        day,
                                        Array.from(
                                          { length: labPickMode.length },
                                          (_, i) => start + i,
                                        ),
                                      )
                                    }
                                    title={
                                      status === "occupied"
                                        ? `${TIME_LABELS[start]} — will replace what's currently there for ${batch}`
                                        : `${TIME_LABELS[start]} — free`
                                    }
                                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold transition-colors ${
                                      status === "free"
                                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                                        : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                                    }`}
                                  >
                                    {TIME_LABELS[start]}
                                  </button>
                                );
                              },
                            )}
                            <button
                              onClick={() => setLabPickMode(null)}
                              className="text-[9px] text-gray-400 hover:text-red-500 px-1"
                              title="Cancel picking"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAutoAddExtraLab(day, 3)}
                              title="Auto-place a 3hr lab in the next genuinely free block"
                              className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                            >
                              +3h Lab
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAutoAddExtraLab(day, 2)}
                              title="Auto-place a 2hr lab in the next genuinely free block"
                              className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                            >
                              +2h Lab
                            </button>
                            <button
                              type="button"
                              onClick={() => setLabPickMode({ day, length: 3 })}
                              title="Choose exactly where a 3hr lab goes"
                              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium text-gray-400 hover:text-purple-500 border border-dashed border-gray-300 dark:border-gray-600 transition-colors"
                            >
                              Pick 3h…
                            </button>
                            <button
                              type="button"
                              onClick={() => setLabPickMode({ day, length: 2 })}
                              title="Choose exactly where a 2hr lab goes"
                              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium text-gray-400 hover:text-purple-500 border border-dashed border-gray-300 dark:border-gray-600 transition-colors"
                            >
                              Pick 2h…
                            </button>
                          </div>
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
                              {slot.isExtraLab && !locked && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveExtraLab(slot);
                                  }}
                                  className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 rounded-full bg-gray-400 dark:bg-gray-600 text-white flex items-center justify-center z-10 hover:bg-red-400 transition-colors"
                                  title="Remove this extra lab slot entirely"
                                >
                                  <Trash2 size={8} />
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
                                  Lab{slot.periods.length === 2 ? " (2hr)" : ""}
                                </p>
                              )}
                            </div>
                          ) : slot.isExtraLab ? (
                            <div className="relative w-full h-full">
                              <button
                                onClick={() => handleEditSlotClick(slot)}
                                className="w-full h-full py-1.5 rounded-md text-[10px] text-purple-300 dark:text-purple-700 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10 hover:text-emerald-500 transition-colors"
                              >
                                +
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveExtraLab(slot);
                                }}
                                title="Remove this extra lab slot"
                                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-gray-400 dark:bg-gray-600 text-white flex items-center justify-center hover:bg-red-400 transition-colors"
                              >
                                <XIcon size={8} />
                              </button>
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
            isLab={!!editingSlot.isLab}
            periodCount={editingSlot.periods.length}
            unplaced={unplacedAssignments}
            isFetchingUnplaced={isFetchingUnplaced}
            onSave={handleModalSave}
            onClose={() => setEditingSlot(null)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div
        data-tour="institute-filters"
        className="flex items-center gap-4 flex-wrap rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 px-4 py-2.5"
      >
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

        {!batchFilter && (
          <span className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-800">
            <Info size={11} className="shrink-0" />
            Filter by batch to edit that batch's timetable
          </span>
        )}

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
            data-tour="institute-batch-edit-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Pencil size={12} />
            Edit {batchFilter}'s timetable
          </button>
        )}
      </div>
      <div data-tour="institute-grid">
        {batchEditMode
          ? renderEditableBatchWeek()
          : isFiltered
            ? renderFilteredView()
            : renderTimeGrid()}
      </div>
    </div>
  );
};

export default InstituteView;
