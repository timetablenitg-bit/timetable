// constants.js — shared timetable constants

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Period indices → display labels (matches Python TIME_LABELS)
export const TIME_LABELS = [
  "9:00–9:55",
  "10:00–10:55",
  "11:00–11:55",
  "12:00–12:55",
  "LUNCH",
  "14:00–14:55",
  "15:00–15:55",
  "16:00–16:55",
];

export const LUNCH_PI = 4;
export const BEFORE_LUNCH = [0, 1, 2, 3]; // AM theory periods
export const AFTER_LUNCH = [5, 6, 7]; // PM periods
export const AM_LAB_BLOCK = [0, 1, 2]; // Track-2 AM lab block
export const PM_LAB_BLOCK = [5, 6, 7]; // Track-1 PM lab block
