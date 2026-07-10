// utils/skeletonDerivation.js
//
// Pure, unit-testable functions that turn a TimetableSkeleton document
// (or its plain { cells: [...] } shape) into the two data structures the
// placement engine needs. These are computed Node-side and passed into
// the Python engine as part of its input payload — the engine itself
// never re-derives them.

const IGNORED_LABELS = new Set([null, undefined, "BREAK", "LUNCH"]);

function normalizeCells(skeleton) {
  const cells = skeleton?.cells ?? skeleton ?? [];
  return cells.filter((c) => c && c.day && c.period_index !== undefined);
}

/**
 * getSlotOccurrenceCount(skeleton)
 * -> { "A": 3, "B": 3, "G": 1, "LAB": 3, ... }
 *
 * Counts DISTINCT DAYS a label appears on, not raw (day, track, period)
 * cells. Track 1 and track 2 on the same day are alternate arrangements
 * of the same day, not two independent occurrences (decision #4).
 */
export function getSlotOccurrenceCount(skeleton) {
  const cells = normalizeCells(skeleton);
  const daysByLabel = {}; // label -> Set(day)

  for (const cell of cells) {
    const label = cell.slot_label;
    if (IGNORED_LABELS.has(label)) continue;
    if (!daysByLabel[label]) daysByLabel[label] = new Set();
    daysByLabel[label].add(cell.day);
  }

  const counts = {};
  for (const [label, daySet] of Object.entries(daysByLabel)) {
    counts[label] = daySet.size;
  }
  return counts;
}

/**
 * getAdjacencyMap(skeleton)
 * -> { "A": Set(["B", "LAB"]), "B": Set(["A", "C"]), ... }
 *
 * For every (day, track), builds the ordered sequence of non-break/
 * non-lunch cells and marks every pair of consecutive labels as mutually
 * adjacent. Because track is an admin choice made AFTER generation
 * (decision #2), we union the adjacency found on track 1 and track 2 for
 * a given day into a single set per label (decision #5) — a candidate
 * placement is rejected if it clashes against EITHER possible neighbor,
 * which is deliberately conservative so no clash can surface later no
 * matter which track ends up chosen.
 *
 * Returned as label -> Set<label>. Symmetric by construction (if A is
 * adjacent to B, B is adjacent to A), which is what the "can't be booked
 * right after" check needs regardless of which side of the pair you're
 * placing.
 */
export function getAdjacencyMap(skeleton) {
  const cells = normalizeCells(skeleton);

  // group into (day, track) -> [{period_index, slot_label}], sorted
  const groups = new Map();
  for (const cell of cells) {
    const key = `${cell.day}::${cell.track}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(cell);
  }

  const adjacency = {};
  const ensure = (label) => {
    if (!adjacency[label]) adjacency[label] = new Set();
    return adjacency[label];
  };

  for (const rows of groups.values()) {
    const sorted = [...rows].sort((a, b) => a.period_index - b.period_index);
    const sequence = sorted.filter((c) => !IGNORED_LABELS.has(c.slot_label));

    // Only mark as adjacent if the cells were ALSO adjacent in period_index
    // (i.e. nothing, not even a break, sits between them). A break period
    // separates two theory blocks, so it does not create adjacency.
    for (let i = 1; i < sequence.length; i++) {
      const prev = sequence[i - 1];
      const curr = sequence[i];
      if (curr.period_index - prev.period_index !== 1) continue;
      if (prev.slot_label === curr.slot_label) continue; // e.g. LAB, LAB, LAB block

      ensure(prev.slot_label).add(curr.slot_label);
      ensure(curr.slot_label).add(prev.slot_label);
    }
  }

  return adjacency;
}

/**
 * Convenience for serializing the adjacency map (Sets) into the JSON
 * payload sent to the Python subprocess.
 */
export function serializeAdjacencyMap(adjacencyMap) {
  const out = {};
  for (const [label, set] of Object.entries(adjacencyMap)) {
    out[label] = [...set];
  }
  return out;
}

/**
 * getSkeletonDaysByLabel(skeleton)
 * -> { "A": ["Monday", "Tuesday", "Thursday"], "G": ["Wednesday"], ... }
 *
 * Companion to getSlotOccurrenceCount — needed to scope
 * choose_occurrences manual-review items to the label's REAL days
 * rather than just a count.
 */
export function getSkeletonDaysByLabel(skeleton) {
  const cells = normalizeCells(skeleton);
  const daysByLabel = {};

  for (const cell of cells) {
    const label = cell.slot_label;
    if (IGNORED_LABELS.has(label)) continue;
    if (!daysByLabel[label]) daysByLabel[label] = new Set();
    daysByLabel[label].add(cell.day);
  }

  const out = {};
  const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  for (const [label, daySet] of Object.entries(daysByLabel)) {
    out[label] = [...daySet].sort(
      (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b),
    );
  }
  return out;
}
