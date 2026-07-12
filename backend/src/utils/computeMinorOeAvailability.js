// utils/computeMinorOeAvailability.js
//
// Companion to computePlacementAvailability, but scoped ONLY to a batch's
// minor("G")/OE("H") columns — used exclusively for resolving "unplaced"
// review items (point 2: a course that got zero regular-slot placement can
// only be squeezed into an otherwise-empty minor/OE period, on the admin's
// discretion, never into a regular theory/lab slot that would silently
// double-book something).
//
// A (day, slot_type) is "free" for this batch iff:
//   - a grid cell with that slot_type exists on that day at all (some
//     skeletons may not carve out a minor/OE period every day), AND
//   - the batch is not already among that label's GeneratedSlot entries
//     for that day (i.e. it doesn't already take a minor/OE class then),
//     AND
//   - the batch isn't already sitting in that cell's manual_entries (guards
//     against double-resolving the same item, or two different unplaced
//     items racing for the same empty slot).
//
// Unlike computePlacementAvailability, this does NOT check faculty-busy or
// regular-slot batch occupancy — minor/OE periods are shared-by-design, so
// the only thing that matters is whether THIS batch specifically already
// has something there.

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function computeMinorOeAvailability({ schedule, slots, batchIds }) {
  const batchIdSet = new Set(batchIds.map(String));
  const slotByName = new Map(slots.map((s) => [s.slot_name, s]));

  const result = { minor: {}, oe: {} };

  for (const day of DAYS) {
    for (const type of ["minor", "oe"]) {
      const cell = schedule.grid.find(
        (c) => c.day === day && c.slot_type === type,
      );

      if (!cell) {
        result[type][day] = {
          status: "unavailable",
          reason: "No such period on this day",
        };
        continue;
      }

      const slot = slotByName.get(cell.slot_name);
      const alreadyInLabel = (slot?.entries ?? []).some((e) =>
        (e.batch_ids ?? []).some((b) => batchIdSet.has(String(b))),
      );
      const alreadyManual = (cell.manual_entries ?? []).some((e) =>
        (e.batch_ids ?? []).some((b) => batchIdSet.has(String(b))),
      );

      result[type][day] =
        alreadyInLabel || alreadyManual
          ? {
              status: "blocked",
              reason: `Batch already has a ${type.toUpperCase()} class this day`,
            }
          : {
              status: "free",
              cell_ref: {
                day: cell.day,
                period_index: cell.period_index,
                track: cell.track,
              },
            };
    }
  }

  return result;
}
