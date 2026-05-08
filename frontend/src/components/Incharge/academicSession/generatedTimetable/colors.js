// colors.js — slot colour maps and helpers

export const SLOT_COLORS = {
  A: "bg-blue-50   dark:bg-blue-900/20   border-blue-200   dark:border-blue-700   text-blue-800   dark:text-blue-300",
  B: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700 text-violet-800 dark:text-violet-300",
  C: "bg-amber-50  dark:bg-amber-900/20  border-amber-200  dark:border-amber-700  text-amber-800  dark:text-amber-300",
  D: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300",
  E: "bg-rose-50   dark:bg-rose-900/20   border-rose-200   dark:border-rose-700   text-rose-800   dark:text-rose-300",
  F: "bg-cyan-50   dark:bg-cyan-900/20   border-cyan-200   dark:border-cyan-700   text-cyan-800   dark:text-cyan-300",
  G: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 text-orange-800 dark:text-orange-300",
  H: "bg-pink-50   dark:bg-pink-900/20   border-pink-200   dark:border-pink-700   text-pink-800   dark:text-pink-300",
};

export const LAB_COLOR =
  "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600 text-purple-800 dark:text-purple-300";

export function slotColor(name) {
  if (!name || name === "BREAK") return "";
  if (name.startsWith("LAB")) return LAB_COLOR;
  return SLOT_COLORS[name] ?? SLOT_COLORS.A;
}
