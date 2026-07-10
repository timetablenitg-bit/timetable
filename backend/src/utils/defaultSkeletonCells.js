// utils/defaultSkeletonCells.js
//
// This is a straight transcription of the old hardcoded TEMPLATE object
// from python_engine/timetable_generator.py into skeleton cell documents.
// Used ONLY to seed the first TimetableSkeleton for a session so the
// migration to a DB-backed skeleton doesn't break anything that was
// already relying on that exact layout.
//
// "LAB" placeholders become slot_label: "LAB" here — the engine resolves
// which concrete LAB_<DAY> array fills that placeholder at generation time.

const TIME_LABELS = {
  0: "9:00-9:55",
  1: "10:00-10:55",
  2: "11:00-11:55",
  3: "12:00-12:55",
  4: "LUNCH",
  5: "14:00-14:55",
  6: "15:00-15:55",
  7: "16:00-16:55",
};

// (day, track) -> [ [period_index, slot_label|null], ... ]
const RAW_TEMPLATE = {
  "Monday-1": [
    [0, "A"],
    [1, "B"],
    [2, "C"],
    [3, "D"],
    [4, "BREAK"],
    [5, "LAB"],
    [6, "LAB"],
    [7, "LAB"],
  ],
  "Monday-2": [
    [0, "A"],
    [1, "LAB"],
    [2, "LAB"],
    [3, "LAB"],
    [4, "BREAK"],
    [5, "B"],
    [6, "C"],
    [7, "D"],
  ],
  "Tuesday-1": [
    [0, "E"],
    [1, "F"],
    [2, "A"],
    [3, "G"],
    [4, "BREAK"],
    [5, "LAB"],
    [6, "LAB"],
    [7, "LAB"],
  ],
  "Tuesday-2": [
    [0, "LAB"],
    [1, "LAB"],
    [2, "LAB"],
    [3, "G"],
    [4, "BREAK"],
    [5, "E"],
    [6, "F"],
    [7, "A"],
  ],
  "Wednesday-1": [
    [0, "B"],
    [1, "C"],
    [2, "D"],
    [3, "E"],
    [4, "BREAK"],
    [5, "G"],
    [6, "H"],
    [7, "TUT"],
  ],
  "Thursday-1": [
    [0, "F"],
    [1, "A"],
    [2, "B"],
    [3, "H"],
    [4, "BREAK"],
    [5, "LAB"],
    [6, "LAB"],
    [7, "LAB"],
  ],
  "Friday-1": [
    [0, "C"],
    [1, "D"],
    [2, "E"],
    [3, "F"],
    [4, "BREAK"],
    [5, "G"],
    [6, "H"],
    [7, "1-CREDIT"],
  ],
  // Wednesday/Friday have no track 2 — skeleton simply has no cells for them.
};

export function buildDefaultSkeletonCells() {
  const cells = [];
  for (const [key, rows] of Object.entries(RAW_TEMPLATE)) {
    const [day, trackStr] = key.split("-");
    const track = Number(trackStr);
    for (const [period_index, slot_label] of rows) {
      cells.push({
        day,
        track,
        period_index,
        time_label: TIME_LABELS[period_index],
        slot_label,
      });
    }
  }
  return cells;
}
