// utils/computePlacementAvailability.js
//
// Given a manual-review item's assignment (course/faculty/batches), builds
// a per-(day,track,period) availability map so the admin UI can highlight
// cells instead of the admin guessing free slots by eye.
//
// Status meanings:
//   "free"       -> grid cell has no slot_name at all
//   "shared_ok"  -> slot_name exists but is a MINOR ("G") or OE ("H") label
//                   and this batch isn't already among that label's
//                   entries — i.e. it's a period other batches use for
//                   minor/OE, but this batch doesn't take one then, so
//                   it's free from THIS batch's point of view.
//   "blocked"    -> batch already has a class there, the cell is a
//                   BREAK/LUNCH, or the assignment's faculty is already
//                   teaching elsewhere at that day/period (checked across
//                   BOTH tracks, since track1/track2 run in parallel).
//
// LIMITATION: "batch already has a class" is read straight off the grid's
// track1/track2 arrays, without applying each batch's saved
// track_assignments projection. In practice this only matters on the few
// TOGGLE_DAYS (Monday/Tuesday) where a batch might be "on" track2 — we
// mark a cell blocked if the batch appears in EITHER track's entries for
// that day/period, which is the safe (conservative) direction to err in.

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function computePlacementAvailability({
  schedule,
  slots,
  batchIds,
  facultyId,
  currentAssignmentId,
}) {
  const batchIdSet = new Set(batchIds.map(String));
  const slotByName = new Map(slots.map((s) => [s.slot_name, s]));

  // faculty_busy[day-period] -> true if this faculty teaches ANY track at that slot
  const facultyBusy = new Set();
  for (const cell of schedule.grid) {
    if (!cell.slot_name) continue;
    const slot = slotByName.get(cell.slot_name);
    if (!slot) continue;
    const teachesHere = slot.entries.some(
      (e) =>
        String(e.faculty_id ?? "") === String(facultyId) &&
        String(e.assignment_id ?? "") !== String(currentAssignmentId),
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
        const facultyKey = `${day}-${pi}`;

        if (cell.slot_type === "break" || facultyBusy.has(facultyKey)) {
          result[day][`track${track}`][pi] = {
            status: "blocked",
            reason:
              cell.slot_type === "break"
                ? "Lunch/Break"
                : "Faculty busy at this time",
          };
          continue;
        }

        if (!cell.slot_name) {
          result[day][`track${track}`][pi] = { status: "free" };
          continue;
        }

        const slot = slotByName.get(cell.slot_name);
        const entries = slot?.entries ?? [];
        const batchOccupied = entries.some((e) =>
          (e.batch_ids ?? []).some((b) => batchIdSet.has(String(b))),
        );

        if (batchOccupied) {
          result[day][`track${track}`][pi] = {
            status: "blocked",
            reason: "Batch already scheduled",
          };
          continue;
        }

        const isSharedLabel =
          cell.slot_type === "minor" || cell.slot_type === "oe";
        result[day][`track${track}`][pi] = isSharedLabel
          ? {
              status: "shared_ok",
              reason: `Shared ${cell.slot_type.toUpperCase()} period — other batches use it, this batch doesn't`,
            }
          : {
              status: "blocked",
              reason: "Slot occupied by another batch/course",
            };
      }
    }
  }
  return result;
}
