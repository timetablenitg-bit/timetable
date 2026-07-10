// BatchTimetableGrid.jsx
//
// NEW. Single-batch week grid reusing InstituteView's color language,
// dropped into the manual-review flow so the admin places/picks courses
// by clicking a real timetable instead of raw day/period/track dropdowns.
//
// mode="place"  -> colors cells by availability status (free/shared_ok/
//                  blocked from /manual-review/:id/availability) and is
//                  clickable on non-blocked cells. Used for overflow items.
// mode="choose" -> highlights an anchor label's available_days / chosen
//                  status and is clickable per-day. Used for
//                  choose_occurrences items.
// mode="view"   -> read-only, just shows what's currently there.
//
// LIMITATION: unlike InstituteView this does NOT merge lab blocks into a
// single colspan cell — each period renders independently. Fine for
// placement context (labs are never valid overflow/choose targets anyway
// since they're occupied), but don't reuse this for the main schedule view.
import React, { useMemo } from "react";
import { DAYS, TIME_LABELS, LUNCH_PI } from "./constants";
import { slotColor } from "./colors";

const STATUS_STYLE = {
  free: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer",
  shared_ok:
    "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer",
  blocked:
    "bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-700 opacity-50 cursor-not-allowed",
  selected: "bg-indigo-500 border-indigo-600 text-white cursor-pointer",
};

const BatchTimetableGrid = ({
  batchName,
  scheduleData,
  slotsData,
  mode = "view",
  availability = null, // { [day]: { track1: {[pi]: {status, reason}}, track2: {...} } }
  selectedPlacements = [], // [{day, period_index, track}] — "place" mode
  availableDays = [], // "choose" mode
  chosenDays = [], // "choose" mode
  onCellClick, // "place": (day, pi, track) | "choose": (day) => void
}) => {
  const slotMap = useMemo(() => {
    if (!slotsData?.slots) return {};
    return Object.fromEntries(
      slotsData.slots.map((s) => [s.slot_name, s.entries]),
    );
  }, [slotsData]);

  const getEntry = (cell) => {
    if (!cell?.slot_name || cell.slot_name === "BREAK") return null;
    const entries = slotMap[cell.slot_name] ?? [];
    return (
      entries.find((e) =>
        (e.batch_names ?? e.batches ?? []).includes(batchName),
      ) ?? null
    );
  };

  const isSelected = (day, pi, track) =>
    selectedPlacements.some(
      (p) => p.day === day && p.period_index === pi && p.track === track,
    );

  const renderCell = (day, track, pi) => {
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

    const trackCells = scheduleData?.grid?.[day]?.[`track${track}`] ?? [];
    const cell = trackCells.find((c) => c.period_index === pi) ?? null;
    const entry = getEntry(cell);
    const code = entry?.course_code ?? entry?.course;
    const fac = entry?.faculty_code ?? entry?.faculty;

    const status = availability?.[day]?.[`track${track}`]?.[pi]?.status;
    const reason = availability?.[day]?.[`track${track}`]?.[pi]?.reason;
    const selected = isSelected(day, pi, track);
    const clickable = mode === "place" && status && status !== "blocked";

    let className =
      "border px-1 py-1 text-center align-middle transition-colors ";
    className +=
      mode === "place"
        ? selected
          ? STATUS_STYLE.selected
          : (STATUS_STYLE[status] ?? STATUS_STYLE.blocked)
        : "border-gray-100 dark:border-gray-700";

    return (
      <td
        key={pi}
        className={className}
        title={mode === "place" ? (reason ?? status) : undefined}
        onClick={clickable ? () => onCellClick?.(day, pi, track) : undefined}
      >
        {code ? (
          <div
            className={`rounded-md px-1.5 py-1 ${slotColor(cell.slot_name)}`}
          >
            <p className="text-[10px] font-bold leading-none">{code}</p>
            {fac && (
              <p className="text-[8px] mt-0.5 opacity-60 leading-none">{fac}</p>
            )}
          </div>
        ) : mode === "place" ? (
          <span className="text-[9px] font-medium">
            {selected
              ? "✓ Placing"
              : status === "free"
                ? "Free"
                : status === "shared_ok"
                  ? "Shared"
                  : "—"}
          </span>
        ) : (
          <span className="text-[10px] text-gray-200 dark:text-gray-700">
            —
          </span>
        )}
      </td>
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="border-collapse w-full" style={{ minWidth: 640 }}>
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/80">
            <th
              className="border border-gray-100 dark:border-gray-700 px-2 py-1.5 text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-800/80"
              style={{ minWidth: 90 }}
            >
              Day
            </th>
            {TIME_LABELS.map((t, i) => (
              <th
                key={i}
                className="border border-gray-100 dark:border-gray-700 px-1 py-1.5 text-center text-[8px] font-semibold text-gray-400 dark:text-gray-500 whitespace-nowrap"
              >
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => {
            const hasT2 = !!scheduleData?.grid?.[day]?.track2;
            const tracksToShow =
              mode === "place" ? [1, ...(hasT2 ? [2] : [])] : [1];
            const isChooseDay =
              mode === "choose" && availableDays.includes(day);
            const isChosen = mode === "choose" && chosenDays.includes(day);

            return tracksToShow.map((track) => (
              <tr
                key={`${day}-${track}`}
                className={
                  isChooseDay
                    ? `cursor-pointer transition-colors ${isChosen ? "bg-indigo-50 dark:bg-indigo-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/40"}`
                    : ""
                }
                onClick={isChooseDay ? () => onCellClick?.(day) : undefined}
              >
                <td className="border border-gray-100 dark:border-gray-700 px-2 py-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 sticky left-0 bg-white dark:bg-gray-800">
                  {day.slice(0, 3)}
                  {tracksToShow.length > 1 && (
                    <span className="ml-1 text-[8px] text-gray-300">
                      T{track}
                    </span>
                  )}
                  {mode === "choose" && isChooseDay && (
                    <span
                      className={`ml-1 text-[9px] ${isChosen ? "text-indigo-500 font-bold" : "text-gray-300"}`}
                    >
                      {isChosen ? "✓" : "○"}
                    </span>
                  )}
                </td>
                {Array.from({ length: 8 }, (_, pi) =>
                  renderCell(day, track, pi),
                )}
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BatchTimetableGrid;
