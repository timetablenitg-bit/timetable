// utils/resolveCellEntries.js
//
// Single source of truth for "what course(s) is this batch actually taking
// in this grid cell", used by every view that renders a cell
// (BatchTimetableGrid, InstituteView, EditableSlotsView, SlotsView, ...).
//
// A cell's effective entries for a batch can come from three places, checked
// in this order:
//
//   1. cell.manual_entries — entries committed directly onto this cell by
//      resolving an "overflow" review item. These never touch slot_name /
//      GeneratedSlot, so they must be checked first and explicitly.
//   2. cell.slot_name -> GeneratedSlot.entries, MINUS anything listed in
//      cell.hidden_assignment_ids (an assignment suppressed on this specific
//      cell by resolving a "choose_occurrences" item for an un-chosen day).
//   3. Otherwise [] — nothing here for this batch.
//
// IMPORTANT — a cell can legitimately hold MORE THAN ONE entry for the same
// batch. This isn't an edge case to collapse away: it's exactly what
// drop_course_id (case 3 — a backlog course explicitly placed alongside the
// current-sem course its students dropped) and parallel_with (case 4 —
// disjoint backlog groups explicitly placed on the same slot) produce. The
// engine (slot_generator.py) already places both entries in the SAME
// bucket/label on purpose; picking only one here would silently hide the
// other from the batch that's supposed to see both.
//
// Any component that reads `slotMap[cell.slot_name]` directly, or that
// calls .find() instead of filtering, will silently drop the second entry
// in these cases — that's the bug this file exists to prevent.

// Returns EVERY entry that belongs to this batch in this cell, in priority
// order (manual placements first if any exist; otherwise every matching
// slot-derived entry, hidden ids excluded). Use this for rendering — it's
// the one that won't silently drop a co-located drop/parallel entry.
export function resolveCellEntriesGroup(cell, slotMap, batchName) {
  if (!cell) return [];

  // 1 — manual placements (overflow resolution) win first; they're the most
  // specific data we have for this exact cell. (Manual entries are single,
  // ad-hoc placements — they don't participate in drop/parallel co-location,
  // so ALL manual matches for this batch is still just "all of them".)
  const manual = (cell.manual_entries ?? []).filter((e) =>
    (e.batch_names ?? e.batches ?? []).includes(batchName),
  );
  if (manual.length) return manual;

  // 2 — normal slot_name-derived entries, with per-cell hidden ids filtered.
  if (!cell.slot_name || cell.slot_name === "BREAK") return [];

  const hidden = new Set((cell.hidden_assignment_ids ?? []).map(String));
  const entries = slotMap[cell.slot_name] ?? [];

  return entries.filter(
    (e) =>
      !hidden.has(String(e.assignment_id ?? "")) &&
      (e.batch_names ?? e.batches ?? []).includes(batchName),
  );
}

// Back-compat single-entry accessor for call sites that only ever expect
// one course per cell (e.g. lab anchors, availability checks). Returns the
// first entry from resolveCellEntriesGroup. New rendering code should
// prefer resolveCellEntriesGroup directly so it doesn't drop a co-located
// drop/parallel entry.
export function resolveCellEntries(cell, slotMap, batchName) {
  const group = resolveCellEntriesGroup(cell, slotMap, batchName);
  return group[0] ?? null;
}

// Describes WHY an entry is sharing a cell with its co-located peers, for
// display purposes (e.g. a small badge/divider label). Returns null if the
// entry isn't co-located with anything, or a short descriptor otherwise:
//   { kind: "drop", peer }      — this entry's batch dropped `peer`, or vice
//                                  versa (drop_course_id is one-directional,
//                                  so we check both ways here).
//   { kind: "parallel", peers } — this entry shares a parallel_group_id with
//                                  one or more other entries in the group.
// `group` should be the full array from resolveCellEntriesGroup (or the
// slot's raw entries, for the lab/anchor case) so peers can be found by id.
export function describeCoLocation(entry, group) {
  if (!entry || !group || group.length < 2) return null;

  const peers = group.filter((e) => e !== entry);

  const dropPeer = peers.find(
    (p) =>
      (entry.drop_course_id &&
        String(entry.drop_course_id) === String(p.assignment_id)) ||
      (p.drop_course_id &&
        String(p.drop_course_id) === String(entry.assignment_id)),
  );
  if (dropPeer) return { kind: "drop", peer: dropPeer };

  if (entry.parallel_group_id) {
    const parallelPeers = peers.filter(
      (p) =>
        p.parallel_group_id &&
        String(p.parallel_group_id) === String(entry.parallel_group_id),
    );
    if (parallelPeers.length) return { kind: "parallel", peers: parallelPeers };
  }

  return null;
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
