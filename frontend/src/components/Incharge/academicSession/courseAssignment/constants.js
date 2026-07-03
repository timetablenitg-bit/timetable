export const EVEN_SEMS = new Set([2, 4, 6, 8]);
export const ODD_SEMS = new Set([1, 3, 5, 7]);

export const DURATION_MAP = { lecture: 1, tutorial: 1, lab: 3 };

export const ASSIGNMENT_TYPE_OPTIONS = [
  { value: "regular", label: "Regular" },
  { value: "backlog", label: "Backlog" },
  { value: "minor", label: "Minor" },
  { value: "oe", label: "Open Elective" },
];

export const COMPONENT_TYPE_OPTIONS = [
  { value: "lecture", label: "Lecture" },
  { value: "lab", label: "Lab" },
  { value: "tutorial", label: "Tutorial" },
];

export const ASSIGNMENT_TYPE_COLORS = {
  regular:
    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  backlog:
    "bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-400",
  minor:
    "bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-400",
  oe: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
};
