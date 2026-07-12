// utils/resolveCellEntries.js
//
// Single source of truth for "what course is this batch actually taking in
// this grid cell", used by every view that renders a cell (BatchTimetableGrid,
// InstituteView, DualTrackScheduleView if it ever needs per-batch rendering).
//
// A cell's effective entry for a batch can come from three places, checked
// in this order:
//
//   1. cell.manual_entries — entries committed directly onto this cell by
//      resolving an "overflow" review item. These never touch slot_name /
//      GeneratedSlot, so they must be checked first and explicitly.
//   2. cell.slot_name -> GeneratedSlot.entries, MINUS anything listed in
//      cell.hidden_assignment_ids (an assignment suppressed on this specific
//      cell by resolving a "choose_occurrences" item for an un-chosen day).
//   3. Otherwise null — nothing here for this batch.
//
// Any component that reads `slotMap[cell.slot_name]` directly instead of
// calling this will silently ignore manual placements and un-hide
// de-selected occurrences — both of which are the exact bugs this file
// exists to prevent.

export function resolveCellEntries(cell, slotMap, batchName) {
  if (!cell) return null;

  // 1 — manual placements (overflow resolution) win first; they're the most
  // specific data we have for this exact cell.
  const manual = (cell.manual_entries ?? []).find((e) =>
    (e.batch_names ?? e.batches ?? []).includes(batchName),
  );
  if (manual) return manual;

  // 2 — normal slot_name-derived entry, with per-cell hidden ids filtered.
  if (!cell.slot_name || cell.slot_name === "BREAK") return null;

  const hidden = new Set((cell.hidden_assignment_ids ?? []).map(String));
  const entries = slotMap[cell.slot_name] ?? [];

  return (
    entries.find(
      (e) =>
        !hidden.has(String(e.assignment_id ?? "")) &&
        (e.batch_names ?? e.batches ?? []).includes(batchName),
    ) ?? null
  );
}

// Convenience helper: true if a resolved entry came from manual_entries
// rather than a shared GeneratedSlot label. Lets renderers give manually
// placed sessions a distinct visual treatment (they have no slot_name to
// derive a color from).
export function isManualEntry(cell, entry) {
  if (!entry) return false;
  return (cell.manual_entries ?? []).some(
    (e) =>
      e === entry || String(e.assignment_id) === String(entry.assignment_id),
  );
}
