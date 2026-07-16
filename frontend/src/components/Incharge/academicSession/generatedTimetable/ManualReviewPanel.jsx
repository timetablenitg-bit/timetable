import React, { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  AlertTriangle,
  CalendarClock,
  ListChecks,
  CheckCircle2,
  MousePointerClick,
  ChevronRight,
  SkipForward,
  Lock,
  X,
} from "lucide-react";
import useManualReviewStore from "../../../../store/useManualReviewStore";
import BatchTimetableGrid from "./BatchTimetableGrid";

const DAY_LIST = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// ── sessionStorage-backed persistence for skip/expand state ──────────────
//
// Namespaced per session id so switching between review sessions doesn't
// bleed one session's skips/expansions into another's, and so re-entering
// the SAME session later (even after the panel has fully unmounted) picks
// up right where the admin left off. Best-effort: storage errors (private
// browsing, quota, etc.) just fall back to an empty set rather than
// breaking the panel.
const STORAGE_PREFIX = "manualReviewPanel";

const loadPersistedSet = (sessionId, subkey) => {
  if (!sessionId || typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(
      `${STORAGE_PREFIX}:${sessionId}:${subkey}`,
    );
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const savePersistedSet = (sessionId, subkey, set) => {
  if (!sessionId || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      `${STORAGE_PREFIX}:${sessionId}:${subkey}`,
      JSON.stringify([...set]),
    );
  } catch {
    // best-effort — persistence failing shouldn't break the panel
  }
};

// Sorted so the composite key is stable regardless of what order the API
// returns batch_ids in on any given fetch — see the top-of-file note on
// why an unstable key was wiping BatchGroupCard's (now-lifted) state.
const batchKeyFor = (item) =>
  (item.assignment_id?.batch_ids ?? [])
    .map((b) => b.batch_name)
    .sort()
    .join(", ") || "Unassigned";

// ── minor/OE <-> real-grid helpers ───────────────────────────────────────
//
// scheduleData.grid[day][`track${n}`] already contains the minor/OE cells
// as ordinary periods (slot_type: "minor" | "oe"), the same shape as every
// other cell. So instead of a separate picker UI, we can find those cells
// and drive BatchTimetableGrid's normal "place" mode with them directly.
const findMinorOeCell = (scheduleData, day, slot_type) => {
  const t1 = (scheduleData?.grid?.[day]?.track1 ?? []).map((c) => ({
    ...c,
    track: 1,
  }));
  const t2 = (scheduleData?.grid?.[day]?.track2 ?? []).map((c) => ({
    ...c,
    track: 2,
  }));
  return [...t1, ...t2].find((c) => c.slot_type === slot_type) ?? null;
};

// Builds a BatchTimetableGrid-shaped availability map that only "lights up"
// the minor(G)/OE(H) cells — everything else is forced blocked so the grid
// visually reads as "these two columns are the only legal targets" — plus a
// reverse lookup so a cell click can be turned back into a slot_type.
const buildMinorOeGridAvailability = (scheduleData, availability) => {
  const grid = {};
  const cellSlotType = {};
  for (const day of DAY_LIST) grid[day] = { track1: {}, track2: {} };

  for (const slot_type of ["minor", "oe"]) {
    for (const day of DAY_LIST) {
      const cell = findMinorOeCell(scheduleData, day, slot_type);
      if (!cell) continue;
      const info = availability?.[slot_type]?.[day];
      const status = info?.status === "free" ? "free" : "blocked";
      grid[day][`track${cell.track}`][cell.period_index] = {
        status,
        reason:
          info?.reason ??
          (slot_type === "minor" ? "Minor period (G)" : "Open Elective (H)"),
      };
      cellSlotType[`${day}-${cell.track}-${cell.period_index}`] = slot_type;
    }
  }
  return { grid, cellSlotType };
};

// ── OverflowItemCard ─────────────────────────────────────────────────────
//
// Availability is no longer fetched-once-and-cached. Resolving a DIFFERENT
// review item (e.g. a choose_occurrences item freeing a cell via
// hidden_assignment_ids) can change what's free for THIS item too — same
// faculty, overlapping batches, whatever. If this card stays expanded (or
// gets re-expanded) after that happens, the old cached availability was
// showing stale "blocked" cells that were actually freed by the other
// resolution. `reviewVersion` (bumped by the parent on every successful
// resolve) forces a refetch whenever that's happened while this card is open.
const OverflowItemCard = ({
  item,
  onResolve,
  isResolving,
  scheduleData,
  slotsData,
  reviewVersion,
  isSkipped = false,
  onToggleSkip,
}) => {
  const { fetchAvailability, isFetchingAvailability } = useManualReviewStore();
  const [expanded, setExpanded] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [placements, setPlacements] = useState([]);
  const [lastFetchedVersion, setLastFetchedVersion] = useState(null);

  const courseCode = item.assignment_id?.course_id?.course_code ?? "—";
  const facultyCode = item.assignment_id?.faculty_id?.faculty_code ?? "";
  const batches = item.assignment_id?.batch_ids ?? [];
  const remaining = item.sessions_needed - placements.length;
  const highlightAssignmentId = item.assignment_id?._id ?? null;

  const refreshAvailability = async () => {
    const result = await fetchAvailability(item._id);
    if (result.ok) setAvailability(result.data.availability);
    setLastFetchedVersion(reviewVersion);
  };

  const handleExpand = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next) await refreshAvailability();
  };

  useEffect(() => {
    if (expanded && reviewVersion !== lastFetchedVersion) {
      refreshAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewVersion, expanded]);

  const handleCellClick = (day, period_index, track) => {
    if (remaining <= 0) return;
    if (
      placements.some(
        (p) =>
          p.day === day && p.period_index === period_index && p.track === track,
      )
    )
      return;
    setPlacements((prev) => [...prev, { day, period_index, track }]);
  };

  const removePlacement = (idx) =>
    setPlacements((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {courseCode}
            </span>
            {facultyCode && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                {facultyCode}
              </span>
            )}
          </div>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 shrink-0">
          <AlertTriangle size={10} />
          Needs {item.sessions_needed} more session
          {item.sessions_needed !== 1 ? "s" : ""}
        </span>
      </div>

      <p className="text-[12px] text-gray-500 dark:text-gray-400">
        {item.reason}
      </p>

      {isSkipped && (
        <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
          <SkipForward size={10} />
          Deferred — resolve whenever you're ready
        </span>
      )}

      <button
        onClick={handleExpand}
        className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        <MousePointerClick size={12} />
        {expanded ? "Hide timetable" : "Choose slots on the timetable"}
      </button>

      {placements.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {placements.map((p, idx) => (
            <span
              key={idx}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300"
            >
              {p.day.slice(0, 3)} · {p.period_index} · T{p.track}
              <button
                onClick={() => removePlacement(idx)}
                className="hover:text-red-500"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {expanded &&
        (isFetchingAvailability || !availability ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 size={16} className="animate-spin text-indigo-500" />
            <span className="text-xs text-gray-400">Loading availability…</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />{" "}
                Free
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Free,
                but back-to-back for this faculty
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />{" "}
                Blocked
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full ring-2 ring-indigo-500 bg-white dark:bg-gray-800" />
                This course's other sessions
              </span>
            </div>
            {batches.map((b) => (
              <div key={b._id} className="space-y-1">
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  {b.batch_name}
                </p>
                <BatchTimetableGrid
                  batchName={b.batch_name}
                  scheduleData={scheduleData}
                  slotsData={slotsData}
                  mode="place"
                  availability={availability}
                  selectedPlacements={placements}
                  highlightAssignmentId={highlightAssignmentId}
                  onCellClick={handleCellClick}
                />
              </div>
            ))}
          </div>
        ))}

      <div className="flex items-center gap-2">
        <button
          onClick={() => onResolve(item._id, placements)}
          disabled={isResolving || placements.length !== item.sessions_needed}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-40"
        >
          {isResolving ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <CheckCircle2 size={11} />
          )}
          Confirm {placements.length}/{item.sessions_needed} placed
        </button>
        <button
          type="button"
          onClick={onToggleSkip}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border transition-colors ${
            isSkipped
              ? "border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          <SkipForward size={11} />
          {isSkipped ? "Move back to queue" : "Skip for now"}
        </button>
      </div>
    </div>
  );
};

// ── UnplacedItemCard ──────────────────────────────────────────────────────
//
// For kind === "unplaced": the course got NO automatic placement at all.
// The only legal target is an empty minor(G)/OE(H) period for this item's
// batch — never a regular theory/lab cell. Picks are made directly on the
// real BatchTimetableGrid (same widget overflow uses) rather than a
// separate day-pill list, so the selection is visibly "on the timetable"
// as soon as it's made — every other cell is rendered blocked so only the
// minor/OE columns are clickable.
//
// No highlightAssignmentId here on purpose: an unplaced item has no
// existing sessions anywhere to point at.
const UnplacedItemCard = ({
  item,
  onResolve,
  isResolving,
  reviewVersion,
  scheduleData,
  slotsData,
  isSkipped = false,
  onToggleSkip,
}) => {
  const { fetchMinorOeAvailability, isFetchingAvailability } =
    useManualReviewStore();
  const [expanded, setExpanded] = useState(false);
  const [availability, setAvailability] = useState(null); // { minor: {day:{status,reason}}, oe: {...} }
  const [picks, setPicks] = useState([]); // [{ day, slot_type }]
  const [lastFetchedVersion, setLastFetchedVersion] = useState(null);

  const courseCode = item.assignment_id?.course_id?.course_code ?? "—";
  const facultyCode = item.assignment_id?.faculty_id?.faculty_code ?? "";
  const batches = item.assignment_id?.batch_ids ?? [];
  const remaining = item.sessions_needed - picks.length;

  const refreshAvailability = async () => {
    const result = await fetchMinorOeAvailability(item._id);
    if (result.ok) setAvailability(result.data.availability);
    setLastFetchedVersion(reviewVersion);
  };

  const handleExpand = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next) await refreshAvailability();
  };

  useEffect(() => {
    if (expanded && reviewVersion !== lastFetchedVersion) {
      refreshAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewVersion, expanded]);

  const { grid: gridAvailability, cellSlotType } = useMemo(
    () =>
      availability
        ? buildMinorOeGridAvailability(scheduleData, availability)
        : { grid: {}, cellSlotType: {} },
    [availability, scheduleData],
  );

  const selectedPlacements = useMemo(
    () =>
      picks
        .map((p) => {
          const cell = findMinorOeCell(scheduleData, p.day, p.slot_type);
          return cell
            ? { day: p.day, period_index: cell.period_index, track: cell.track }
            : null;
        })
        .filter(Boolean),
    [picks, scheduleData],
  );

  const isPicked = (day, slot_type) =>
    picks.some((p) => p.day === day && p.slot_type === slot_type);

  const togglePick = (day, slot_type) => {
    if (isPicked(day, slot_type)) {
      setPicks((prev) =>
        prev.filter((p) => !(p.day === day && p.slot_type === slot_type)),
      );
      return;
    }
    if (remaining <= 0) return;
    const cell = findMinorOeCell(scheduleData, day, slot_type);
    const status = cell
      ? gridAvailability?.[day]?.[`track${cell.track}`]?.[cell.period_index]
          ?.status
      : undefined;
    if (status !== "free") return;
    setPicks((prev) => [...prev, { day, slot_type }]);
  };

  const handleCellClick = (day, pi, track) => {
    const slot_type = cellSlotType[`${day}-${track}-${pi}`];
    if (!slot_type) return; // not a minor/OE cell — not a valid target
    togglePick(day, slot_type);
  };

  return (
    <div className="rounded-xl border border-fuchsia-200 dark:border-fuchsia-800 bg-fuchsia-50/50 dark:bg-fuchsia-900/10 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {courseCode}
          </span>
          {facultyCode && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {facultyCode}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-[10px] font-medium text-fuchsia-600 dark:text-fuchsia-400 px-2 py-1 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 shrink-0">
          <AlertTriangle size={10} />
          Unplaced — needs {item.sessions_needed} session
          {item.sessions_needed !== 1 ? "s" : ""}
        </span>
      </div>

      <p className="text-[12px] text-gray-500 dark:text-gray-400">
        {item.reason}
      </p>

      {isSkipped && (
        <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
          <SkipForward size={10} />
          Deferred — resolve whenever you're ready
        </span>
      )}

      <button
        onClick={handleExpand}
        className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        <MousePointerClick size={12} />
        {expanded ? "Hide timetable" : "Pick empty minor/OE slots"}
      </button>

      {picks.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {picks.map((p, idx) => (
            <span
              key={idx}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-300"
            >
              {p.day.slice(0, 3)} · {p.slot_type === "minor" ? "Minor" : "OE"}
              <button
                onClick={() => togglePick(p.day, p.slot_type)}
                className="hover:text-red-500"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {expanded &&
        (isFetchingAvailability || !availability ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 size={16} className="animate-spin text-indigo-500" />
            <span className="text-xs text-gray-400">
              Checking minor/OE availability…
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />{" "}
                Free (Minor/OE only)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300" /> Not a
                valid target
              </span>
            </div>
            {batches.map((b) => (
              <div key={b._id} className="space-y-1">
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  {b.batch_name}
                </p>
                <BatchTimetableGrid
                  batchName={b.batch_name}
                  scheduleData={scheduleData}
                  slotsData={slotsData}
                  mode="place"
                  availability={gridAvailability}
                  selectedPlacements={selectedPlacements}
                  onCellClick={handleCellClick}
                />
              </div>
            ))}
          </div>
        ))}

      <div className="flex items-center gap-2">
        <button
          onClick={() => onResolve(item._id, picks)}
          disabled={isResolving || picks.length !== item.sessions_needed}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-40"
        >
          {isResolving ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <CheckCircle2 size={11} />
          )}
          Confirm {picks.length}/{item.sessions_needed} placed
        </button>
        <button
          type="button"
          onClick={onToggleSkip}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border transition-colors ${
            isSkipped
              ? "border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          <SkipForward size={11} />
          {isSkipped ? "Move back to queue" : "Skip for now"}
        </button>
      </div>
    </div>
  );
};

// ── ChooseOccurrencesItemCard ────────────────────────────────────────────
// No server availability fetch here, renders straight off
// scheduleData/slotsData from the parent. Also passes
// highlightAssignmentId so the grid rings any cell already holding a
// session for this assignment (e.g. previously-confirmed days from an
// earlier partial resolution, or anchor-day sessions).
const ChooseOccurrencesItemCard = ({
  item,
  onResolve,
  isResolving,
  scheduleData,
  slotsData,
  isSkipped = false,
  onToggleSkip,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [chosenDays, setChosenDays] = useState([]);

  const courseCode = item.assignment_id?.course_id?.course_code ?? "—";
  const batches = item.assignment_id?.batch_ids ?? [];
  const canConfirm = chosenDays.length === item.sessions_to_choose;
  const highlightAssignmentId = item.assignment_id?._id ?? null;

  const toggleDay = (day) => {
    setChosenDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day);
      if (prev.length >= item.sessions_to_choose) return prev;
      return [...prev, day];
    });
  };

  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {courseCode}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
          <ListChecks size={10} />
          Pick {item.sessions_to_choose} of {item.available_days.length}
        </span>
      </div>

      <p className="text-[12px] text-gray-500 dark:text-gray-400">
        {item.reason}
      </p>

      {isSkipped && (
        <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
          <SkipForward size={10} />
          Deferred — resolve whenever you're ready
        </span>
      )}

      <div className="flex flex-wrap gap-2">
        {item.available_days.map((day) => {
          const selected = chosenDays.includes(day);
          return (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                selected
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {day} (anchor: {item.anchor_label})
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        <MousePointerClick size={12} />
        {expanded ? "Hide timetable" : "View on the timetable"}
      </button>

      {expanded && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full ring-2 ring-indigo-500 bg-white dark:bg-gray-800" />
              This course's other sessions
            </span>
          </div>
          {batches.map((b) => (
            <div key={b._id} className="space-y-1">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                {b.batch_name}
              </p>
              <BatchTimetableGrid
                batchName={b.batch_name}
                scheduleData={scheduleData}
                slotsData={slotsData}
                mode="choose"
                availableDays={item.available_days}
                chosenDays={chosenDays}
                highlightAssignmentId={highlightAssignmentId}
                onCellClick={toggleDay}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => onResolve(item._id, chosenDays)}
          disabled={isResolving || !canConfirm}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-40"
        >
          {isResolving ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <CheckCircle2 size={11} />
          )}
          Confirm {chosenDays.length}/{item.sessions_to_choose} selected
        </button>
        <button
          type="button"
          onClick={onToggleSkip}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border transition-colors ${
            isSkipped
              ? "border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          <SkipForward size={11} />
          {isSkipped ? "Move back to queue" : "Skip for now"}
        </button>
      </div>
    </div>
  );
};

// ── step tracker ─────────────────────────────────────────────────────────
const FLOW_STEPS = [
  { key: "choose", label: "Pick Occurrences" },
  { key: "unplaced", label: "Unplaced" },
  { key: "overflow", label: "Overflow" },
];

const StepPip = ({ state }) => {
  if (state === "done")
    return <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />;
  // "deferred": every remaining item in this stage was skipped rather than
  // actually resolved — distinct from "done" so the admin isn't misled
  // into thinking the stage is fully clear.
  if (state === "deferred")
    return <SkipForward size={12} className="text-amber-500 shrink-0" />;
  if (state === "locked")
    return (
      <Lock size={10} className="text-gray-300 dark:text-gray-600 shrink-0" />
    );
  return (
    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 animate-pulse" />
  );
};

// ── BatchGroupCard ───────────────────────────────────────────────────────
// One card per batch. Enforces the flow order (choose -> unplaced ->
// overflow): only the ACTIVE (non-skipped) items belonging to the current
// stage are rendered, so the admin never sees — or can act on — a later
// stage before an earlier one is fully resolved or deferred. This also
// removes the old repetition of re-printing the batch name / header for
// every kind of pending item. Skipped items live in their own standing
// "Deferred" section beneath the active stage, always visible.
//
// `skippedIds` and `isExpanded`/`onToggleExpand` are owned by the parent
// panel now (not local state here) — see the top-of-file note on why that
// matters: it keeps this data alive across resolve-triggered refetches
// even if this particular card instance gets torn down and rebuilt.
const BatchGroupCard = ({
  batchKey,
  batchItems,
  scheduleData,
  slotsData,
  reviewVersion,
  isResolving,
  onResolveChoose,
  onResolveUnplaced,
  onResolveOverflow,
  isExpanded,
  onToggleExpand,
  skippedIds,
  onToggleSkip,
}) => {
  const collapsed = !isExpanded;

  const chooseItems = batchItems.filter((i) => i.kind === "choose_occurrences");
  const unplacedItems = batchItems.filter((i) => i.kind === "unplaced");
  const overflowItems = batchItems.filter((i) => i.kind === "overflow");

  // "Active" = belongs to this stage AND hasn't been skipped. These are
  // what actually drive flow progression and what render in the main
  // stage section.
  const chooseActive = chooseItems.filter((i) => !skippedIds.has(i._id));
  const unplacedActive = unplacedItems.filter((i) => !skippedIds.has(i._id));
  const overflowActive = overflowItems.filter((i) => !skippedIds.has(i._id));

  // null activeStep = nothing left that actually needs the admin's
  // attention right now (every remaining item, if any, is deferred).
  // BUG FIX: this used to fall through to "overflow" by default whenever
  // choose/unplaced had no active items — including when overflow itself
  // was ALSO fully resolved. That meant finishing every overflow item
  // still left the tracker calling "Overflow" the active step forever
  // (pulsing dot, never the done checkmark) any time an earlier stage
  // had a deferred leftover. Falling through to null instead lets
  // stepState below correctly resolve every stage to "done" or
  // "deferred" once there's genuinely nothing active left anywhere.
  const activeStep =
    chooseActive.length > 0
      ? "choose"
      : unplacedActive.length > 0
        ? "unplaced"
        : overflowActive.length > 0
          ? "overflow"
          : null;

  const stepOrder = FLOW_STEPS.map((s) => s.key);
  const activeCounts = {
    choose: chooseActive.length,
    unplaced: unplacedActive.length,
    overflow: overflowActive.length,
  };
  const counts = {
    choose: chooseItems.length,
    unplaced: unplacedItems.length,
    overflow: overflowItems.length,
  };

  const stepState = (key) => {
    if (key === activeStep) return "active";
    const idx = stepOrder.indexOf(key);
    // With no active step anywhere, treat every stage as "passed" so it
    // resolves purely on its own done/deferred count below.
    const activeIdx = activeStep
      ? stepOrder.indexOf(activeStep)
      : stepOrder.length;
    if (idx < activeIdx) {
      // Passed this stage — but if it was only passed because everything
      // left in it got skipped (not resolved), flag it instead of
      // claiming it's done.
      return activeCounts[key] === 0 && counts[key] > 0 ? "deferred" : "done";
    }
    return "locked";
  };

  // Everything currently deferred, across all three kinds, for the
  // standing "Deferred" section — independent of activeStep so a skipped
  // item stays reachable no matter how far the flow has moved on.
  const deferredItems = batchItems.filter((i) => skippedIds.has(i._id));
  const cardForKind = (kind) =>
    kind === "choose_occurrences"
      ? ChooseOccurrencesItemCard
      : kind === "unplaced"
        ? UnplacedItemCard
        : OverflowItemCard;
  const resolverForKind = (kind) =>
    kind === "choose_occurrences"
      ? onResolveChoose
      : kind === "unplaced"
        ? onResolveUnplaced
        : onResolveOverflow;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700 cursor-pointer select-none"
        onClick={() => onToggleExpand(batchKey)}
        role="button"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            size={14}
            className={`text-gray-400 shrink-0 transition-transform ${
              collapsed ? "" : "rotate-90"
            }`}
          />
          <CalendarClock size={13} className="text-gray-400" />
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
            {batchKey}
          </h3>
          <span className="text-[10px] text-gray-400">
            ({batchItems.length} pending)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {FLOW_STEPS.map(({ key, label }, i) => {
            const state = stepState(key);
            const count = counts[key];
            return (
              <React.Fragment key={key}>
                <div className="flex items-center gap-1.5">
                  <StepPip state={state} />
                  <span
                    className={`text-[10px] font-medium whitespace-nowrap ${
                      state === "active"
                        ? "text-indigo-600 dark:text-indigo-400"
                        : state === "done"
                          ? "text-emerald-500"
                          : state === "deferred"
                            ? "text-amber-500"
                            : "text-gray-300 dark:text-gray-600"
                    }`}
                  >
                    {label}
                    {count > 0 ? ` (${count})` : ""}
                  </span>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <span className="text-gray-200 dark:text-gray-700">›</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className={`p-4 space-y-3 ${collapsed ? "hidden" : ""}`}>
        {activeStep === null && deferredItems.length > 0 && (
          <p className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
            <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
            Everything else in this batch is resolved — only the deferred item
            {deferredItems.length !== 1 ? "s" : ""} below need attention.
          </p>
        )}

        {activeStep === "choose" &&
          chooseActive.map((item) => (
            <ChooseOccurrencesItemCard
              key={item._id}
              item={item}
              onResolve={onResolveChoose}
              isResolving={isResolving}
              scheduleData={scheduleData}
              slotsData={slotsData}
              isSkipped={false}
              onToggleSkip={() => onToggleSkip(item._id)}
            />
          ))}

        {activeStep === "unplaced" &&
          unplacedActive.map((item) => (
            <UnplacedItemCard
              key={item._id}
              item={item}
              onResolve={onResolveUnplaced}
              isResolving={isResolving}
              reviewVersion={reviewVersion}
              scheduleData={scheduleData}
              slotsData={slotsData}
              isSkipped={false}
              onToggleSkip={() => onToggleSkip(item._id)}
            />
          ))}

        {activeStep === "overflow" &&
          overflowActive.map((item) => (
            <OverflowItemCard
              key={item._id}
              item={item}
              onResolve={onResolveOverflow}
              isResolving={isResolving}
              scheduleData={scheduleData}
              slotsData={slotsData}
              reviewVersion={reviewVersion}
              isSkipped={false}
              onToggleSkip={() => onToggleSkip(item._id)}
            />
          ))}

        {deferredItems.length > 0 && (
          <div className="pt-3 mt-1 border-t border-dashed border-gray-200 dark:border-gray-700 space-y-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-500">
              <SkipForward size={11} />
              Deferred ({deferredItems.length}) — resolve anytime
            </p>
            {deferredItems.map((item) => {
              const Card = cardForKind(item.kind);
              return (
                <Card
                  key={item._id}
                  item={item}
                  onResolve={resolverForKind(item.kind)}
                  isResolving={isResolving}
                  reviewVersion={reviewVersion}
                  scheduleData={scheduleData}
                  slotsData={slotsData}
                  isSkipped
                  onToggleSkip={() => onToggleSkip(item._id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── main panel ────────────────────────────────────────────────────────────
const ManualReviewPanel = ({
  session,
  scheduleData,
  slotsData,
  onResolved,
}) => {
  const {
    items,
    isFetching,
    isResolving,
    error,
    fetchPendingItems,
    resolveOverflow,
    resolveChooseOccurrences,
    resolveUnplaced,
  } = useManualReviewStore();

  // Bumped on every successful resolution of ANY item. Passed to cards so an
  // already-open one knows a resolution happened elsewhere and its cached
  // availability may now be stale.
  const [reviewVersion, setReviewVersion] = useState(0);

  // Tracks whether we've completed at least one fetch. Only the FIRST load
  // shows the full-page spinner; every later fetchPendingItems() call (the
  // ones triggered after a resolve) is a background refresh and shouldn't
  // tear down the whole tree — that's what was reading as a "reload" on
  // every single update.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Which items are deferred, and which batch cards are expanded.
  // sessionStorage-backed (keyed by session._id) rather than plain
  // useState — see the top-of-file changelog. Lifting this into the panel
  // was necessary but not sufficient: it only survives a BatchGroupCard
  // remounting, not the PANEL itself being unmounted by its parent (tab
  // switch, changed `key`, navigating to a different batch/session and
  // back). Reading from / writing to sessionStorage means the component
  // instance no longer matters at all — only the session id does.
  const [skippedIds, setSkippedIds] = useState(() =>
    loadPersistedSet(session?._id, "skipped"),
  );
  const [expandedBatches, setExpandedBatches] = useState(() =>
    loadPersistedSet(session?._id, "expanded"),
  );

  // Re-hydrate from storage whenever we're pointed at a (possibly new)
  // session — covers both the panel mounting fresh for the first time and
  // session._id changing under an already-mounted panel.
  useEffect(() => {
    setSkippedIds(loadPersistedSet(session?._id, "skipped"));
    setExpandedBatches(loadPersistedSet(session?._id, "expanded"));
  }, [session?._id]);

  // Persist on every change so a later remount (or a different tab/session
  // switch) picks the state back up.
  useEffect(() => {
    savePersistedSet(session?._id, "skipped", skippedIds);
  }, [session?._id, skippedIds]);

  useEffect(() => {
    savePersistedSet(session?._id, "expanded", expandedBatches);
  }, [session?._id, expandedBatches]);

  const toggleSkip = (itemId) =>
    setSkippedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });

  const toggleExpandBatch = (batchKey) =>
    setExpandedBatches((prev) => {
      const next = new Set(prev);
      if (next.has(batchKey)) next.delete(batchKey);
      else next.add(batchKey);
      return next;
    });

  useEffect(() => {
    if (!session?._id) return;
    (async () => {
      await fetchPendingItems(session._id);
      setHasLoadedOnce(true);
    })();
  }, [session?._id]);

  // Group everything (all three kinds) by batch composite key.
  const groups = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const key = batchKeyFor(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  // Once an item is actually resolved it can never come back as pending, so
  // there's no reason to keep it marked "skipped" any longer — drop it from
  // the set. Harmless either way (a resolved id just won't match anything
  // in future `items`), but keeping this tidy avoids the set growing
  // unbounded over a long review session.
  const clearSkipped = (itemId) =>
    setSkippedIds((prev) => {
      if (!prev.has(itemId)) return prev;
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });

  const handleResolveOverflow = async (item_id, placements) => {
    const result = await resolveOverflow(item_id, placements);
    if (result.ok) {
      clearSkipped(item_id);
      setReviewVersion((v) => v + 1);
      await fetchPendingItems(session._id);
      onResolved?.();
    }
  };

  const handleResolveChoose = async (item_id, chosen_days) => {
    const result = await resolveChooseOccurrences(item_id, chosen_days);
    if (result.ok) {
      clearSkipped(item_id);
      setReviewVersion((v) => v + 1);
      await fetchPendingItems(session._id);
      onResolved?.();
    }
  };

  const handleResolveUnplaced = async (item_id, placements) => {
    const result = await resolveUnplaced(item_id, placements);
    if (result.ok) {
      clearSkipped(item_id);
      setReviewVersion((v) => v + 1);
      await fetchPendingItems(session._id);
      onResolved?.();
    }
  };

  if (isFetching && !hasLoadedOnce) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <Loader2 size={20} className="animate-spin text-emerald-500" />
        <span className="text-sm text-gray-400">Loading review queue…</span>
      </div>
    );
  }

  if (error && !items.length)
    return <p className="text-sm text-red-500 text-center py-10">{error}</p>;

  if (!items.length && hasLoadedOnce) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
        <CheckCircle2 size={36} className="opacity-30" />
        <p className="text-sm">Nothing pending — every course was placed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Non-blocking refresh indicator — replaces the old full-panel
          spinner for every resolve-triggered refetch. Reserves its row
          via min-height-less padding so groups don't jump when it
          appears/disappears. */}
      {isFetching && hasLoadedOnce && (
        <div className="flex items-center justify-end gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
          <Loader2 size={11} className="animate-spin" />
          Refreshing…
        </div>
      )}

      <div className="space-y-4">
        {groups.map(([batchKey, batchItems]) => (
          <BatchGroupCard
            key={batchKey}
            batchKey={batchKey}
            batchItems={batchItems}
            scheduleData={scheduleData}
            slotsData={slotsData}
            reviewVersion={reviewVersion}
            isResolving={isResolving}
            onResolveChoose={handleResolveChoose}
            onResolveUnplaced={handleResolveUnplaced}
            onResolveOverflow={handleResolveOverflow}
            isExpanded={expandedBatches.has(batchKey)}
            onToggleExpand={toggleExpandBatch}
            skippedIds={skippedIds}
            onToggleSkip={toggleSkip}
          />
        ))}
      </div>
    </div>
  );
};

export default ManualReviewPanel;
