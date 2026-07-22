// utils/reconcileOccurrenceReview.js
import { TimetableSkeleton } from "../models/timetableSkeletonModel.js";
import { ManualReviewItem } from "../models/manualReviewModel.js";
import { CourseAssignment } from "../models/courseAssignmentModel.js";

/**
 * After entries are written into a GeneratedSlot (slot_name), checks whether
 * each placed assignment's sessions_per_week matches how many days that
 * slot_name occurs on the active skeleton. On mismatch, creates a pending
 * ManualReviewItem — same as the engine would've at generation time —
 * instead of letting a short/over placement sit silently in the grid.
 *
 * LIMITATION: only compares assignment.sessions_per_week directly. Does
 * NOT replicate synced_with group shortfall/excess logic (decision #6) —
 * a synced_with member's TRUE need may depend on its group, not just its
 * own sessions_per_week. Not implemented here; flagging rather than
 * guessing at that algorithm.
 */
export async function reconcileOccurrenceReview({
  session_id,
  generation_id,
  slot_name,
  entries,
}) {
  const assignmentIds = [
    ...new Set(
      (entries ?? [])
        .map((e) => e.assignment_id)
        .filter(Boolean)
        .map(String),
    ),
  ];
  if (!assignmentIds.length) return;

  const skeleton = await TimetableSkeleton.findOne({
    session_id,
    is_active: true,
  }).lean();
  if (!skeleton) return;

  const availableDays = [
    ...new Set(
      skeleton.cells
        .filter((c) => c.slot_label === slot_name)
        .map((c) => c.day),
    ),
  ].sort();
  const labelDayCount = availableDays.length;
  if (!labelDayCount) return;

  const assignments = await CourseAssignment.find({
    _id: { $in: assignmentIds },
  }).lean();

  for (const assignment of assignments) {
    const needed = assignment.sessions_per_week;
    if (needed == null) continue;

    // FIXED: was scoped to status: "pending", which meant every re-save of
    // this slot re-created a brand new choose_occurrences/overflow item
    // even after the admin had already resolved one for this exact
    // assignment — the structural mismatch (day count vs sessions_per_week)
    // never goes away on its own, so it kept firing forever. A RESOLVED
    // item already has the admin's decision (chosen_days / placements)
    // baked into the grid; re-flagging it as pending again would contradict
    // that decision instead of respecting it. Checking ANY status means we
    // only ever create ONE review item per assignment+kind+generation, ever.
    const existing = await ManualReviewItem.findOne({
      session_id,
      generation_id,
      assignment_id: assignment._id,
      kind: { $in: ["overflow", "choose_occurrences"] },
    });
    if (existing) continue;

    if (needed < labelDayCount) {
      await ManualReviewItem.create({
        session_id,
        generation_id,
        assignment_id: assignment._id,
        kind: "choose_occurrences",
        anchor_label: slot_name,
        available_days: availableDays,
        sessions_to_choose: needed,
        reason: `Placed on ${slot_name} (occurs ${labelDayCount}x/week) but only needs ${needed}/week. Choose which day(s) to keep.`,
      });
    } else if (needed > labelDayCount) {
      await ManualReviewItem.create({
        session_id,
        generation_id,
        assignment_id: assignment._id,
        kind: "overflow",
        sessions_needed: needed - labelDayCount,
        reason: `Placed on ${slot_name} (occurs ${labelDayCount}x/week) but needs ${needed}/week. Manually place the remaining ${needed - labelDayCount}.`,
      });
    }
  }
}
