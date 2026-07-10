// ManualReviewPanel.jsx
//
// CHANGED: items are now grouped by batch (the primary way an admin thinks
// about "what's left to fix"), and placement is done by clicking a real
// per-batch timetable (BatchTimetableGrid) instead of raw day/period/track
// selects. Overflow items fetch live availability (free / shared_ok /
// blocked) from the backend; choose_occurrences items reuse the already-
// loaded schedule/slots data from the parent tab for visual context.
import React, { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  AlertTriangle,
  CalendarClock,
  ListChecks,
  CheckCircle2,
  MousePointerClick,
  X,
} from "lucide-react";
import useManualReviewStore from "../../../../store/admin/useManualReviewStore";
import BatchTimetableGrid from "./BatchTimetableGrid";

const batchKeyFor = (item) =>
  (item.assignment_id?.batch_ids ?? []).map((b) => b.batch_name).join(", ") ||
  "Unassigned";

// ── OverflowItemCard ─────────────────────────────────────────────────────────
const OverflowItemCard = ({
  item,
  onResolve,
  isResolving,
  scheduleData,
  slotsData,
}) => {
  const { fetchAvailability, isFetchingAvailability } = useManualReviewStore();
  const [expanded, setExpanded] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [placements, setPlacements] = useState([]);

  const courseCode = item.assignment_id?.course_id?.course_code ?? "—";
  const facultyCode = item.assignment_id?.faculty_id?.faculty_code ?? "";
  const batches = item.assignment_id?.batch_ids ?? [];
  const remaining = item.sessions_needed - placements.length;

  const handleExpand = async () => {
    if (!expanded && !availability) {
      const result = await fetchAvailability(item._id);
      if (result.ok) setAvailability(result.data.availability);
    }
    setExpanded((v) => !v);
  };

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
            <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />{" "}
                Free
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />{" "}
                Shared minor/OE period, free for this batch
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />{" "}
                Blocked
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
                  onCellClick={handleCellClick}
                />
              </div>
            ))}
          </div>
        ))}

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
    </div>
  );
};

// ── ChooseOccurrencesItemCard ────────────────────────────────────────────────
const ChooseOccurrencesItemCard = ({
  item,
  onResolve,
  isResolving,
  scheduleData,
  slotsData,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [chosenDays, setChosenDays] = useState([]);

  const courseCode = item.assignment_id?.course_id?.course_code ?? "—";
  const batches = item.assignment_id?.batch_ids ?? [];
  const canConfirm = chosenDays.length === item.sessions_to_choose;

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

      {expanded &&
        batches.map((b) => (
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
              onCellClick={toggleDay}
            />
          </div>
        ))}

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
  } = useManualReviewStore();

  useEffect(() => {
    if (session?._id) fetchPendingItems(session._id);
  }, [session?._id]);

  // Group everything (both kinds) by batch composite key.
  const groups = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const key = batchKeyFor(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  const handleResolveOverflow = async (item_id, placements) => {
    const result = await resolveOverflow(item_id, placements);
    if (result.ok) {
      await fetchPendingItems(session._id);
      onResolved?.();
    }
  };

  const handleResolveChoose = async (item_id, chosen_days) => {
    const result = await resolveChooseOccurrences(item_id, chosen_days);
    if (result.ok) {
      await fetchPendingItems(session._id);
      onResolved?.();
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <Loader2 size={20} className="animate-spin text-emerald-500" />
        <span className="text-sm text-gray-400">Loading review queue…</span>
      </div>
    );
  }

  if (error)
    return <p className="text-sm text-red-500 text-center py-10">{error}</p>;

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
        <CheckCircle2 size={36} className="opacity-30" />
        <p className="text-sm">Nothing pending — every course was placed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map(([batchKey, batchItems]) => {
        const overflowItems = batchItems.filter((i) => i.kind === "overflow");
        const chooseItems = batchItems.filter(
          (i) => i.kind === "choose_occurrences",
        );

        return (
          <div key={batchKey} className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100 dark:border-gray-700">
              <CalendarClock size={13} className="text-gray-400" />
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                {batchKey}
              </h3>
              <span className="text-[10px] text-gray-400">
                ({batchItems.length} pending)
              </span>
            </div>

            {overflowItems.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  Overflow — needs manual placement
                </h4>
                {overflowItems.map((item) => (
                  <OverflowItemCard
                    key={item._id}
                    item={item}
                    onResolve={handleResolveOverflow}
                    isResolving={isResolving}
                    scheduleData={scheduleData}
                    slotsData={slotsData}
                  />
                ))}
              </div>
            )}

            {chooseItems.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  Pick occurrences
                </h4>
                {chooseItems.map((item) => (
                  <ChooseOccurrencesItemCard
                    key={item._id}
                    item={item}
                    onResolve={handleResolveChoose}
                    isResolving={isResolving}
                    scheduleData={scheduleData}
                    slotsData={slotsData}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ManualReviewPanel;
