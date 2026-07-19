// utils/computePlacementAvailability.js
//
// Given a manual-review item's assignment (course/faculty/batches), builds
// a per-(day,track,period) availability map so the admin UI can highlight
// cells instead of the admin guessing free slots by eye.
//
// Status meanings:
//   "free"        -> cell is empty for THIS batch, faculty is free in this
//                     cell AND in both the immediately preceding and
//                     immediately following periods that day (whether or
//                     not some OTHER batch shares the label here — that no
//                     longer matters, see FIXED note below).
//   "consecutive" -> cell is empty for THIS batch and faculty is free in
//                     this cell, but the faculty is already teaching in
//                     EITHER the immediately preceding OR the immediately
//                     following period that day. Still a legal placement,
//                     but flagged so the admin can see it would put the
//                     faculty in back-to-back periods (work-life balance
//                     consideration) rather than an isolated slot.
//   "blocked"      -> one of: batch already has a class here (via slot_name
//                     entries or a manually-placed entry), the cell is a
//                     BREAK/LUNCH, the faculty is already teaching
//                     elsewhere at this exact day/period, OR placing here
//                     would give the faculty THREE consecutive periods
//                     (busy on both the preceding and following period).
//
// FIXED (this pass, take 3): previous passes still gated free-vs-blocked
// on whether some OTHER batch also occupied the same label at this cell —
// "shared_ok" only for minor/oe labels, then later for any label but as a
// separate status. That distinction is dropped entirely now. The ONLY
// things that matter for whether a cell is usable by this batch are:
//   (a) is THIS batch already scheduled here (batch conflict)?
//   (b) is THIS faculty already teaching at this exact period (hard
//       conflict, can't be in two places at once)?
//   (c) would this placement give the faculty three straight periods
//       (immediately-before AND immediately-after both occupied by this
//       faculty)? -- soft-blocked as a workload guardrail.
// An unrelated batch sharing the same label/cell no longer affects the
// status at all; it's a completely orthogonal fact (different batch,
// different students, doesn't conflict with this batch or this faculty
// unless (b)/(c) above already say so).
//
// NEW (manual-review commit-to-grid model):
//   - cell.manual_entries: entries placed directly on a cell by resolving
//     an "overflow" review item. These do NOT live in a GeneratedSlot doc,
//     so they must be checked here explicitly for both batch-occupancy and
//     faculty-busy purposes. An entry belonging to the CURRENT assignment
//     is ignored (idempotent re-resolution: re-opening the same item's
//     availability shouldn't show its own prior placement as blocked).
//   - cell.hidden_assignment_ids: assignment_ids suppressed on THIS cell
//     only, from resolving a "choose_occurrences" item (an un-chosen day).
//     Entries matching a hidden id are filtered out of slot.entries before
//     computing occupancy — this is what makes a de-selected occurrence
//     free for THIS batch without affecting any other batch still sharing
//     that label on that day.
//
// LIMITATION: "batch already has a class" is read straight off the grid's
// track1/track2 arrays, without applying each batch's saved
// track_assignments projection. In practice this only matters on the few
// TOGGLE_DAYS (Monday/Tuesday) where a batch might be "on" track2 — we
// mark a cell blocked if the batch appears in EITHER track's entries for
// that day/period, which is the safe (conservative) direction to err in.
//
// LIMITATION: the before/after adjacency check looks at period_index - 1
// and period_index + 1 on the SAME day, with no special-casing around the
// LUNCH period. This is intentional and safe: a lunch/break cell never has
// faculty entries, so it never appears in `facultyBusy`, and therefore
// never counts as an adjacent class on either side of it.

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function computePlacementAvailability({
  schedule,
  slots,
  batchIds,
  facultyId,
  currentAssignmentId,
  dropCourseAssignmentId,
}) {
  const batchIdSet = new Set(batchIds.map(String));
  const slotByName = new Map(slots.map((s) => [s.slot_name, s]));
  const currentIdStr = String(currentAssignmentId ?? "");
  // 🔥 NEW (case 3, manual-placement path) — mirrors slot_generator.py's
  // _is_drop_pair exemption. Without this, an admin resolving a backlog
  // course's overflow/unplaced item that has drop_course_id set would see
  // the dropped current-sem course's own cell reported as "blocked: Batch
  // already scheduled", even though the engine itself would happily place
  // them together there. Only the ONE named assignment is exempted — any
  // other batch conflict in that cell is still a real conflict.
  const dropIdStr = String(dropCourseAssignmentId ?? "");

  // Effective entries for a cell: slot_name-derived entries with any
  // per-cell hidden assignments filtered out, PLUS any manual_entries sitting
  // directly on the cell. This is the single source of truth both the
  // faculty-busy pass and the per-cell occupancy pass below use, so the two
  // stay consistent with each other.
  const effectiveEntries = (cell) => {
    const hidden = new Set((cell.hidden_assignment_ids ?? []).map(String));
    const slot = cell.slot_name ? slotByName.get(cell.slot_name) : null;
    const fromSlot = (slot?.entries ?? []).filter(
      (e) => !hidden.has(String(e.assignment_id ?? "")),
    );
    const manual = cell.manual_entries ?? [];
    return [...fromSlot, ...manual];
  };

  // faculty_busy[day-period] -> true if this faculty teaches ANY track at
  // that slot, via either a shared label or a manually-placed entry.
  // Reused both for "is the faculty busy at the target cell itself" AND
  // for the before/after adjacency check below.
  const facultyBusy = new Set();
  for (const cell of schedule.grid) {
    const entries = effectiveEntries(cell);
    if (!entries.length) continue;
    const teachesHere = entries.some(
      (e) =>
        String(e.faculty_id ?? "") === String(facultyId) &&
        String(e.assignment_id ?? "") !== currentIdStr,
    );
    if (teachesHere) facultyBusy.add(`${cell.day}-${cell.period_index}`);
  }

  const result = {};
  for (const day of DAYS) {
    result[day] = { track1: {}, track2: {} };
    for (const track of [1, 2]) {
      const cells = schedule.grid.filter(
        (c) => c.day === day && c.track === track,
      );
      for (const cell of cells) {
        const pi = cell.period_index;

        // 1. Physical break/lunch periods are never assignable.
        if (cell.slot_type === "break") {
          result[day][`track${track}`][pi] = {
            status: "blocked",
            reason: "Lunch/Break",
          };
          continue;
        }

        // 2. Is THIS batch already occupying this cell — via the shared
        // label (hidden-filtered) or via a manually-placed entry?
        const slot = cell.slot_name ? slotByName.get(cell.slot_name) : null;
        const hidden = new Set((cell.hidden_assignment_ids ?? []).map(String));
        const slotEntries = (slot?.entries ?? []).filter(
          (e) => !hidden.has(String(e.assignment_id ?? "")),
        );
        const manualOthers = (cell.manual_entries ?? []).filter(
          (e) => String(e.assignment_id ?? "") !== currentIdStr,
        );

        // 🔥 NEW (case 3) — an occupant whose assignment_id is the one this
        // item's backlog students explicitly dropped doesn't count as
        // occupying the cell for THIS batch; that's the whole point of
        // marking it dropped.
        const isDroppedOccupant = (e) =>
          !!dropIdStr && String(e.assignment_id ?? "") === dropIdStr;

        const batchOccupiedViaSlot = slotEntries.some(
          (e) =>
            !isDroppedOccupant(e) &&
            (e.batch_ids ?? []).some((b) => batchIdSet.has(String(b))),
        );
        const batchOccupiedViaManual = manualOthers.some(
          (e) =>
            !isDroppedOccupant(e) &&
            (e.batch_ids ?? []).some((b) => batchIdSet.has(String(b))),
        );

        if (batchOccupiedViaSlot || batchOccupiedViaManual) {
          result[day][`track${track}`][pi] = {
            status: "blocked",
            reason:
              batchOccupiedViaManual && !batchOccupiedViaSlot
                ? "Batch already scheduled (manually placed)"
                : "Batch already scheduled",
          };
          continue;
        }

        // Cell is empty for THIS batch from here on — an unrelated batch
        // may still be sitting on the same label, purely informational.
        const otherBatchPresent =
          slotEntries.length > 0 || manualOthers.length > 0;

        // 3. Hard conflict: faculty is already teaching AT this exact
        // day/period (can't be in two places at once).
        const facultyKey = `${day}-${pi}`;
        if (facultyBusy.has(facultyKey)) {
          result[day][`track${track}`][pi] = {
            status: "blocked",
            reason: "Faculty busy at this time",
          };
          continue;
        }

        // 4. Workload guardrail: check the periods immediately before and
        // immediately after this one, same day, for the same faculty.
        const prevBusy = facultyBusy.has(`${day}-${pi - 1}`);
        const nextBusy = facultyBusy.has(`${day}-${pi + 1}`);

        if (prevBusy && nextBusy) {
          result[day][`track${track}`][pi] = {
            status: "blocked",
            reason:
              "Would create three consecutive teaching periods for this faculty",
          };
          continue;
        }

        if (prevBusy || nextBusy) {
          result[day][`track${track}`][pi] = {
            status: "consecutive",
            reason: otherBatchPresent
              ? "Free, but adjacent to another class for this faculty"
              : "Free, but adjacent to another class for this faculty",
          };
          continue;
        }

        result[day][`track${track}`][pi] = {
          status: "free",
          ...(otherBatchPresent ? { reason: "Free" } : {}),
        };
      }
    }
  }
  return result;
}
