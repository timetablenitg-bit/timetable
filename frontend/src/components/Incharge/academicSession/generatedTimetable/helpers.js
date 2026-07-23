// helpers.js — pure utility functions

/**
 * Returns the lab slot name if `block` (an array of period_index values,
 * e.g. AM_LAB_BLOCK / PM_LAB_BLOCK) forms one merged lab in `trackRow`,
 * otherwise returns null.
 *
 * CHANGED — previously required every period's slot_name to (a) exist,
 * (b) start with "LAB", and (c) be exactly equal across all periods in
 * the block. Any single period breaking that — a null/empty slot_name, a
 * lab whose naming convention doesn't happen to start with "LAB", or the
 * periods simply not sharing one slot_name for whatever upstream reason —
 * silently returned null, and every caller (DualTrackScheduleView,
 * InstituteView) fell back to rendering 3 separate per-period cells
 * instead of one merged lab block, with no visible error.
 *
 * `slot_type` is the authoritative, schema-enforced signal for "this
 * period is a lab" (see gridCellSchema.slot_type in
 * models/timetableScheduleModel.js) — it's set at generation/placement
 * time independent of naming, so check that first instead of pattern-
 * matching slot_name.
 */
export function getLabBlock(trackRow, block) {
  if (!trackRow) return null;

  const cells = block.map((p) => trackRow[p]);
  if (cells.some((c) => !c)) return null; // a period in the block has no cell at all

  const allLabType = cells.every((c) => c.slot_type === "lab");
  if (!allLabType) return null;

  // Normal case: all periods point at the same GeneratedSlot label — use
  // it, since callers rely on this string to look the lab up in
  // slotsData (e.g. LabMergedCell).
  const names = cells.map((c) => c.slot_name);
  if (names.every((n) => n && n === names[0])) {
    return names[0];
  }

  // slot_type agrees this is one lab block, but slot_name isn't
  // consistent across the periods (e.g. null on some, or genuinely
  // different labels — which would itself indicate a data problem worth
  // surfacing rather than silently un-merging). Fall back to whichever
  // non-null name is present, preferring the first period's, so the
  // block still renders as ONE merged cell instead of splitting into
  // per-period cells that no longer line up with the 3-period colSpan
  // math elsewhere in the grid.
  const firstNonNull = names.find((n) => !!n);
  if (firstNonNull) return firstNonNull;

  // slot_type is "lab" on every period but there's no slot_name at all —
  // e.g. a lab placed entirely via manual_entries, which never touches
  // slot_name. Return a non-null placeholder so callers still treat it
  // as one merged block; callers that need real content (course_code,
  // faculty) should resolve it from the cell's manual_entries rather
  // than from this label (see InstituteView's getLabEntry, which already
  // checks manual_entries before falling back to a slotsData lookup by
  // name).
  return "LAB";
}
