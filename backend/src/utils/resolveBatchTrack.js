// utils/resolveBatchTrack.js
//
// Read-time resolver used wherever a per-batch view of the timetable is
// rendered (e.g. "show Batch X's Monday"). Projects which track
// arrangement that batch should be shown under for a given day, based on
// the admin's saved track_assignments. Defaults to track 1 if the admin
// hasn't made a choice for that (day, batch) yet.
//
// This is intentionally NOT persisted onto the grid itself — track is a
// display projection, not a placement fact (decision #6).

export function resolveBatchTrack(trackAssignments, day, batchId) {
  const batchIdStr = String(batchId);
  const match = (trackAssignments ?? []).find(
    (t) => t.day === day && String(t.batch_id) === batchIdStr,
  );
  return match ? match.track : 1;
}

/**
 * Given the flat grid and a batch's id, returns the week's cells with
 * each Monday/Tuesday/Thursday resolved to the correct track, and
 * Wednesday/Friday passed through as-is (track 1 only).
 */
export function projectGridForBatch(grid, trackAssignments, batchId) {
  const TRACK_TOGGLE_DAYS = new Set(["Monday", "Tuesday", "Thursday"]);

  return grid.filter((cell) => {
    if (!TRACK_TOGGLE_DAYS.has(cell.day)) {
      return cell.track === 1;
    }
    const chosenTrack = resolveBatchTrack(trackAssignments, cell.day, batchId);
    return cell.track === chosenTrack;
  });
}
