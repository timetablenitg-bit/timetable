// utils/syncManualReview.js
import { ManualReviewItem } from "../models/manualReviewModel.js";

/**
 * Marks any pending ManualReviewItem docs for this generation as resolved
 * when their assignment now appears placed in a GeneratedSlot's entries —
 * i.e. the admin placed it directly via the slot editor instead of going
 * through the manual-review resolve endpoints. Keeps the pending queue from
 * showing stale items for courses that are already sitting in the timetable.
 *
 * One-directional on purpose: we never reopen items here. Entries missing
 * from a bulkUpdateSlots save doesn't reliably mean "someone unplaced it,"
 * and overflow/unplaced items resolved via the TimetableSchedule grid path
 * never touch GeneratedSlot.entries anyway, so absence isn't a reliable
 * signal either way.
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
