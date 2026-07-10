// utils/resolveBatchTrack.js
//
// Frontend port of the backend util of the same name. Track is a per-batch
// DISPLAY projection chosen by the admin after generation — never a
// placement fact, never decided by the engine (see
// models/timetableScheduleModel.js track_assignments). Use this wherever a
// component needs to know which track (1 or 2) a given batch should be shown
// under for a given day.
//
// Defaults to track 1 if the admin hasn't made a choice for that (day, batch)
// yet, matching the backend's default.

export function resolveBatchTrack(trackAssignments, day, batchId) {
  if (!batchId) return 1;
  const batchIdStr = String(batchId);
  const match = (trackAssignments ?? []).find(
    (t) => t.day === day && String(t.batch_id) === batchIdStr,
  );
  return match ? match.track : 1;
}

/**
 * Given the flat grid and a batch's id, returns the week's cells with each
 * Monday/Tuesday/Thursday resolved to the correct track, and Wednesday/Friday
 * passed through as-is (track 1 only).
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

/**
 * Builds a batch_name -> batch_id lookup from a GeneratedSlot payload
 * ({ slots: [...] }, as returned by GET /timetable/slots). Needed because
 * track_assignments key off batch_id, but most timetable components (Slots
 * view, Institute view) key their tables off batch_name.
 */
export function buildBatchIdByName(slotsData) {
  const map = {};
  (slotsData?.slots ?? []).forEach((sl) => {
    (sl.entries ?? []).forEach((e) => {
      const names = e.batch_names ?? e.batches ?? [];
      const ids = e.batch_ids ?? [];
      names.forEach((name, i) => {
        if (ids[i] && !map[name]) map[name] = ids[i];
      });
    });
  });
  return map;
}
