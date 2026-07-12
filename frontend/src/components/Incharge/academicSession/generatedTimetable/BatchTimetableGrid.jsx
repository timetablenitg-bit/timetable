// BatchTimetableGrid.jsx
//
// Single-batch week grid reusing InstituteView's color language, dropped
// into the manual-review flow so the admin places/picks courses by clicking
// a real timetable instead of raw day/period/track dropdowns.
//
// mode="place"  -> colors cells by availability status (free/consecutive/
//                  blocked from /manual-review/:id/availability) and is
//                  clickable on non-blocked cells. Used for overflow items.
// mode="choose" -> highlights an anchor label's available_days / chosen
//                  status and is clickable per-day. Used for
//                  choose_occurrences items.
// mode="view"   -> read-only, just shows what's currently there.
//
// CHANGED: cell contents are now resolved via resolveCellEntries instead of
// a raw slotMap[cell.slot_name] lookup, so:
//   - a manually-placed overflow session (cell.manual_entries) shows up on
//     the grid even though it has no slot_name at all.
//   - an occurrence hidden via choose_occurrences (cell.hidden_assignment_ids)
//     stops showing for this batch, even though the shared label's
//     GeneratedSlot doc still lists it for other days/batches.
// Manually-placed entries get a small "M" badge so the admin can tell a
// committed manual placement apart from an engine-generated one at a glance.
//
// CHANGED (faculty workload guardrail): computePlacementAvailability now
// returns "consecutive" instead of "shared_ok" — the status no longer
// reflects whether another batch shares the label at this cell (that fact
// stopped mattering entirely), it now reflects whether placing here would
// put the faculty back-to-back with another class on one side. "blocked"
// additionally covers the case where the faculty would end up with three
// straight periods (busy on both the preceding and following period) — see
// computePlacementAvailability.js for the full rule.
//
// CHANGED (this pass): free/consecutive cells with no entry for THIS batch
// now show "Free · <slot_name>" instead of a bare glyph, whenever the cell
// actually carries a label (i.e. some other batch's course sits there under
// that name) — genuinely empty cells (no slot_name at all) still just show
// the glyph, since there's no label to report. Color alone conveys the
// free-vs-adjacent distinction now (green vs amber), so the text no longer
// needs to spell it out.
//
// CHANGED (this pass — single track per day): this used to render BOTH
// track1 and track2 as separate rows for a day whenever track2 existed.
// That's wrong for this grid's purpose — only one track is ever the real,
// live schedule for a given day; track1/track2 are kept in sync with each
// other rather than being two different things happening at once. Rendering
// both was just showing the same day twice. Now each day renders a single
// row, picking whichever track actually has cells for that day (track1
// first, falling back to track2 only if track1 is empty/absent). The
// resolved track still travels through to onCellClick so placements land on
// the correct array server-side.
//
// CHANGED (this pass — highlight target course): new highlightAssignmentId
// prop. When set, any cell whose resolved entry belongs to that assignment
// (per resolveCellEntries, so this covers both slot_name-derived AND
// manual_entries-derived entries) gets an indigo ring + a small dot badge,
// regardless of mode. Lets the admin see at a glance where a course they're
// currently resolving (overflow/choose_occurrences) already has other
// sessions placed, e.g. so they don't stack two sessions on the same day or
// can see the existing rhythm before picking more slots. This is purely a
// visual overlay — it doesn't affect status/clickability, and can coexist
// with the "M" manual badge (opposite corners) since a manually-placed cell
// can itself belong to the highlighted assignment.
//
// LIMITATION: unlike InstituteView this does NOT merge lab blocks into a
// single colspan cell — each period renders independently. Fine for
// placement context (labs are never valid overflow/choose targets anyway
// since they're occupied), but don't reuse this for the main schedule view.
import React, { useMemo } from "react";
import { DAYS, TIME_LABELS, LUNCH_PI } from "./constants";
import { slotColor } from "./colors";
import { resolveCellEntries, isManualEntry } from "./resolveCellEntries";

const STATUS_STYLE = {
  free: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 cursor-pointer",
  // Free, but adjacent to another class for this faculty on one side —
  // still fully usable, just flagged so the admin sees the trade-off.
  consecutive:
    "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer",
  blocked:
    "bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-700 opacity-50 cursor-not-allowed",
  selected: "bg-indigo-500 border-indigo-600 text-white cursor-pointer",
};

// Manually-placed entries have no slot_name to derive a color from — give
// them a fixed, recognizable treatment instead of falling through to
// slotColor's default.
const MANUAL_COLOR =
  "bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800";

// Ring treatment for a cell that belongs to the assignment currently being
// resolved elsewhere on this same card (highlightAssignmentId). Kept
// separate from MANUAL_COLOR/slotColor so it can layer on top of either.
const TARGET_RING = "ring-2 ring-offset-1 ring-indigo-500 dark:ring-indigo-400";

const BatchTimetableGrid = ({
  batchName,
  scheduleData,
  slotsData,
  mode = "view",
  availability = null, // { [day]: { track1: {[pi]: {status, reason}}, track2: {...} } }
  selectedPlacements = [], // [{day, period_index, track}] — "place" mode
  availableDays = [], // "choose" mode
  chosenDays = [], // "choose" mode
  highlightAssignmentId = null, // cells resolving to this assignment get ringed, any mode
  onCellClick, // "place": (day, pi, track) | "choose": (day) => void
}) => {
  const slotMap = useMemo(() => {
    if (!slotsData?.slots) return {};
    return Object.fromEntries(
      slotsData.slots.map((s) => [s.slot_name, s.entries]),
    );
  }, [slotsData]);

  // Only one track is ever "the" real schedule for a given day — track1
  // and track2 are kept in sync rather than being two concurrent things, so
  // pick whichever one actually has cells for this day instead of showing
  // both.
  const trackForDay = (day) => {
    const t1 = scheduleData?.grid?.[day]?.track1;
    if (t1 && t1.length) return 1;
    const t2 = scheduleData?.grid?.[day]?.track2;
    if (t2 && t2.length) return 2;
    return 1;
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
    const entry = resolveCellEntries(cell, slotMap, batchName);
    const manual = entry && cell ? isManualEntry(cell, entry) : false;
    const isTarget =
      !!entry &&
      !!highlightAssignmentId &&
      String(entry.assignment_id ?? "") === String(highlightAssignmentId);
    const code = entry?.course_code ?? entry?.course;
    const fac = entry?.faculty_code ?? entry?.faculty;

    const status = availability?.[day]?.[`track${track}`]?.[pi]?.status;
    const reason = availability?.[day]?.[`track${track}`]?.[pi]?.reason;
    const selected = isSelected(day, pi, track);
    const clickable = mode === "place" && status && status !== "blocked";
    const isAvailableStatus = status === "free" || status === "consecutive";

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
            className={`rounded-md px-1.5 py-1 relative ${
              manual ? MANUAL_COLOR : slotColor(cell.slot_name)
            } ${isTarget ? TARGET_RING : ""}`}
          >
            {manual && (
              <span
                title="Manually placed"
                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-fuchsia-500 text-white text-[8px] font-bold leading-none"
              >
                M
              </span>
            )}
            {isTarget && (
              <span
                title="Existing session for this course"
                className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-indigo-500 text-white text-[8px] font-bold leading-none"
              >
                •
              </span>
            )}
            <p className="text-[10px] font-bold leading-none">{code}</p>
            {fac && (
              <p className="text-[8px] mt-0.5 opacity-60 leading-none">{fac}</p>
            )}
          </div>
        ) : mode === "place" ? (
          <span className="text-[9px] font-semibold">
            {selected
              ? "✓"
              : isAvailableStatus
                ? cell?.slot_name
                  ? `Free · ${cell.slot_name}`
                  : "Free"
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
            const track = trackForDay(day);
            const isChooseDay =
              mode === "choose" && availableDays.includes(day);
            const isChosen = mode === "choose" && chosenDays.includes(day);

            return (
              <tr
                key={day}
                className={
                  isChooseDay
                    ? `cursor-pointer transition-colors ${isChosen ? "bg-indigo-50 dark:bg-indigo-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/40"}`
                    : ""
                }
                onClick={isChooseDay ? () => onCellClick?.(day) : undefined}
              >
                <td className="border border-gray-100 dark:border-gray-700 px-2 py-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 sticky left-0 bg-white dark:bg-gray-800">
                  {day.slice(0, 3)}
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BatchTimetableGrid;
