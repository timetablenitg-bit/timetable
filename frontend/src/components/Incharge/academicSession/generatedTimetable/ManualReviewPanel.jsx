// ManualReviewPanel.jsx
//
// Surfaces everything slot_generator.py routed to manual review:
//   - "overflow": course needs MORE sessions/week than any label offers.
//     Admin picks day/period/track for each excess session.
//   - "choose_occurrences": course needs FEWER occurrences than the label
//     it landed in provides. Admin picks which N of the available days to
//     keep.
//
// Resolving an item writes straight into the saved schedule server-side —
// there's no local draft state to manage here beyond the picker inputs
// themselves, so this component stays fairly thin.

import React, { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  AlertTriangle,
  CalendarClock,
  ListChecks,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import useManualReviewStore from "../../../../store/useManualReviewStore";
import { DAYS, TIME_LABELS } from "./constants";

const FIELD =
  "text-[12px] px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500";

// ── OverflowItemCard ─────────────────────────────────────────────────────────

const OverflowItemCard = ({ item, onResolve, isResolving }) => {
  const [placements, setPlacements] = useState(() =>
    Array.from({ length: item.sessions_needed }, () => ({
      day: DAYS[0],
      period_index: 0,
      track: 1,
    })),
  );

  const updatePlacement = (idx, field, value) => {
    setPlacements((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
    );
  };

  const courseCode = item.assignment_id?.course_id?.course_code ?? "—";
  const facultyCode = item.assignment_id?.faculty_id?.faculty_code ?? "";
  const batchNames = (item.assignment_id?.batch_ids ?? [])
    .map((b) => b.batch_name)
    .join(", ");

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
          {batchNames && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              {batchNames}
            </p>
          )}
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

      <div className="space-y-2">
        {placements.map((p, idx) => (
          <div key={idx} className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-gray-400 dark:text-gray-500 w-14">
              Slot {idx + 1}
            </span>
            <select
              value={p.day}
              onChange={(e) => updatePlacement(idx, "day", e.target.value)}
              className={FIELD}
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={p.period_index}
              onChange={(e) =>
                updatePlacement(idx, "period_index", Number(e.target.value))
              }
              className={FIELD}
            >
              {TIME_LABELS.map((label, pi) => (
                <option key={pi} value={pi} disabled={label === "LUNCH"}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={p.track}
              onChange={(e) =>
                updatePlacement(idx, "track", Number(e.target.value))
              }
              className={FIELD}
            >
              <option value={1}>Track 1</option>
              <option value={2}>Track 2</option>
            </select>
          </div>
        ))}
      </div>

      <button
        onClick={() => onResolve(item._id, placements)}
        disabled={isResolving}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-60"
      >
        {isResolving ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <CheckCircle2 size={11} />
        )}
        Confirm placement
      </button>
    </div>
  );
};

// ── ChooseOccurrencesItemCard ────────────────────────────────────────────────

const ChooseOccurrencesItemCard = ({ item, onResolve, isResolving }) => {
  const [chosenDays, setChosenDays] = useState([]);

  const toggleDay = (day) => {
    setChosenDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day);
      if (prev.length >= item.sessions_to_choose) return prev; // cap at required count
      return [...prev, day];
    });
  };

  const courseCode = item.assignment_id?.course_id?.course_code ?? "—";
  const batchNames = (item.assignment_id?.batch_ids ?? [])
    .map((b) => b.batch_name)
    .join(", ");
  const canConfirm = chosenDays.length === item.sessions_to_choose;

  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {courseCode}
          </span>
          {batchNames && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              {batchNames}
            </p>
          )}
        </div>
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

const ManualReviewPanel = ({ session, onResolved }) => {
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

  const overflowItems = useMemo(
    () => items.filter((i) => i.kind === "overflow"),
    [items],
  );
  const chooseItems = useMemo(
    () => items.filter((i) => i.kind === "choose_occurrences"),
    [items],
  );

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

  if (error) {
    return <p className="text-sm text-red-500 text-center py-10">{error}</p>;
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
        <CheckCircle2 size={36} className="opacity-30" />
        <p className="text-sm">Nothing pending — every course was placed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {overflowItems.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <CalendarClock size={13} />
            Overflow — needs manual placement ({overflowItems.length})
          </h4>
          {overflowItems.map((item) => (
            <OverflowItemCard
              key={item._id}
              item={item}
              onResolve={handleResolveOverflow}
              isResolving={isResolving}
            />
          ))}
        </div>
      )}

      {chooseItems.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <ListChecks size={13} />
            Pick occurrences ({chooseItems.length})
          </h4>
          {chooseItems.map((item) => (
            <ChooseOccurrencesItemCard
              key={item._id}
              item={item}
              onResolve={handleResolveChoose}
              isResolving={isResolving}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ManualReviewPanel;
