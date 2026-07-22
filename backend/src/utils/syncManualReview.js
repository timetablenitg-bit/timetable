// utils/syncManualReview.js
//
// Canonical reconciliation between the three places that record "is this
// assignment placed": GeneratedSlot.entries, TimetableSchedule.grid
// (manual_entries + hidden_assignment_ids), and ManualReviewItem
// (kind: "unplaced"). Anything that writes to either of the first two MUST
// call reconcileUnplacedItems() afterwards — that's what keeps the pending
// queue, the slot editor's "unplaced" picker, and the batch-week
// drag-and-drop view from disagreeing with each other about the same
// assignment.

import { GeneratedSlot } from "../models/generatedSlotModel.js";
import { TimetableSchedule } from "../models/timetableScheduleModel.js";
import { ManualReviewItem } from "../models/manualReviewModel.js";
import { CourseAssignment } from "../models/courseAssignmentModel.js";

/**
 * The single definition of "is this assignment currently placed" — used by
 * BOTH getUnplacedAssignments (slotEditController) and
 * reconcileUnplacedItems (below), so the "pick a course" modal and the
 * pending-review queue can never disagree about the same assignment.
 *
 * An assignment counts as placed if it has at least one LIVE occurrence
 * anywhere on the grid:
 *   - a GeneratedSlot entry for the label sitting on that cell, UNLESS the
 *     cell's hidden_assignment_ids suppresses it (choose_occurrences'
 *     un-chosen days, or a batch-week single-batch clear), OR
 *   - a manual_entries entry placed directly on the cell (overflow /
 *     unplaced-resolution / batch-week manual placement).
 *
 * manual_entries are never checked against hidden_assignment_ids — that
 * field is only ever populated with slot-derived assignment_ids (see
 * batchWeekController / manualReviewController), never with manual_entries'
 * own ids.
 */
export function computeEffectivelyPlacedIds(slots, schedule) {
  const placed = new Set();
  const slotByName = new Map(slots.map((s) => [s.slot_name, s]));

  for (const cell of schedule?.grid ?? []) {
    const hidden = new Set((cell.hidden_assignment_ids ?? []).map(String));

    const slot = cell.slot_name ? slotByName.get(cell.slot_name) : null;
    for (const e of slot?.entries ?? []) {
      const id = e.assignment_id ? String(e.assignment_id) : null;
      if (id && !hidden.has(id)) placed.add(id);
    }

    for (const e of cell.manual_entries ?? []) {
      if (e.assignment_id) placed.add(String(e.assignment_id));
    }
  }

  return placed;
}

/**
 * Reconciles ManualReviewItem(kind: "unplaced") against the CURRENT,
 * authoritative placement state (computeEffectivelyPlacedIds) instead of
 * trusting whatever id list the caller happens to have on hand.
 *
 * - Resolves any pending "unplaced" item whose assignment now has a live
 *   occurrence somewhere (slot editor placement, manual-review resolution,
 *   or a batch-week drag-and-drop that re-adds it).
 * - REOPENS (creates fresh, or flips resolved -> pending) an "unplaced" item
 *   for any assignment that has NO live occurrence anywhere. This is the
 *   piece that was previously missing entirely: nothing caught the case
 *   where batch-week drag-and-drop clears a course's only cell, or a slot
 *   delete / bulk save removes it — the course would vanish from the grid
 *   with no review item ever created, so no admin would be prompted to
 *   actually go fix it.
 *
 * Call this after ANY write to GeneratedSlot.entries or to
 * TimetableSchedule.grid (manual_entries / hidden_assignment_ids) for a
 * given session_id + generation_id. It's idempotent and safe to call even
 * when nothing changed.
 */
export async function reconcileUnplacedItems(session_id, generation_id) {
  const [slots, schedule, assignments, reviewItems] = await Promise.all([
    GeneratedSlot.find({ session_id, generation_id }).lean(),
    TimetableSchedule.findOne({ session_id, generation_id }),
    CourseAssignment.find({ session_id })
      .select("_id sessions_per_week")
      .lean(),
    ManualReviewItem.find({ session_id, generation_id, kind: "unplaced" }),
  ]);

  const placedIds = computeEffectivelyPlacedIds(slots, schedule);
  const itemByAssignment = new Map(
    reviewItems.map((it) => [String(it.assignment_id), it]),
  );

  const toResolve = [];
  const toReopen = [];
  const toCreate = [];

  for (const assignment of assignments) {
    const aid = String(assignment._id);
    const isPlaced = placedIds.has(aid);
    const item = itemByAssignment.get(aid);

    if (isPlaced) {
      if (item && item.status === "pending") toResolve.push(item);
    } else if (!item) {
      toCreate.push(assignment);
    } else if (item.status === "resolved") {
      toReopen.push(item);
    }
    // else: already pending — nothing changed, leave it alone.
  }

  await Promise.all(
    toResolve.map((item) => {
      item.status = "resolved";
      item.resolution = { placements: [], chosen_days: [] };
      return item.save();
    }),
  );

  await Promise.all(
    toReopen.map((item) => {
      item.status = "pending";
      item.resolution = { placements: [], chosen_days: [] };
      return item.save();
    }),
  );

  if (toCreate.length) {
    await ManualReviewItem.insertMany(
      toCreate.map((assignment) => ({
        session_id,
        generation_id,
        assignment_id: assignment._id,
        kind: "unplaced",
        status: "pending",
        sessions_needed: assignment.sessions_per_week ?? 0,
        reason:
          "No longer has any placement in the timetable — needs a minor/OE slot picked.",
      })),
    );
  }
}

/**
 * @deprecated Kept only so nothing else importing this breaks. Prefer
 * reconcileUnplacedItems, which checks the FULL current placement state
 * instead of trusting a caller-supplied id list — it catches un-placement
 * too, not just placement, which is what was actually going stale.
 */
export async function resolvePendingReviewsForPlacedAssignments(
  session_id,
  generation_id,
  assignmentIds = [],
) {
  const ids = [...new Set(assignmentIds.map(String))].filter(Boolean);
  if (!ids.length) return;

  await ManualReviewItem.updateMany(
    {
      session_id,
      generation_id,
      status: "pending",
      kind: "unplaced",
      assignment_id: { $in: ids },
    },
    {
      $set: {
        status: "resolved",
        resolution: { placements: [], chosen_days: [] },
      },
    },
  );
}
