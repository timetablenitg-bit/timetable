// helpers.js — pure utility functions

/**
 * Returns the lab slot name if all periods in `block` share the same LAB name,
 * otherwise returns null.
 */
export function getLabBlock(trackRow, block) {
  if (!trackRow) return null;
  const names = block.map((p) => trackRow[p]?.slot_name);
  if (names.every((n) => n && n.startsWith("LAB") && n === names[0])) {
    return names[0];
  }
  return null;
}
