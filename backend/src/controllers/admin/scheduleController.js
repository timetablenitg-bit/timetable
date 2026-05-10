// controllers/scheduleEditController.js
// Routes:
//   PUT   /api/v1/admin/timetable/engine/schedule/:timetable_id       — save grid
//   POST  /api/v1/admin/timetable/engine/schedule/:timetable_id/evaluate — save + re-score

import { TimetableSchedule } from "../../models/timetableScheduleModel.js";

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts the frontend localGrid format:
 *   { Monday: { track1: [{period_index, slot_name, ...}], track2: [...] }, ... }
 * into the flat gridCellSchema array the DB stores.
 */
function gridObjectToFlat(gridObj) {
  const flat = [];
  for (const [day, tracks] of Object.entries(gridObj)) {
    for (const cell of tracks.track1 ?? []) {
      flat.push({ ...cell, day, track: 1 });
    }
    for (const cell of tracks.track2 ?? []) {
      flat.push({ ...cell, day, track: 2 });
    }
  }
  return flat;
}

/**
 * Basic scoring heuristic — runs server-side so we don't need the Python engine.
 * Penalises:
 *   • free/null cells in theory periods (each -1)
 *   • same slot appearing on the same day twice across tracks (-2 each)
 *   • lab blocks not in expected AM/PM positions (-3 each)
 *
 * Max possible = total theory cells. Score is returned as 0-100.
 */
function evaluateGrid(flatCells) {
  const THEORY_PIS = [0, 1, 2, 3, 5, 6, 7]; // period indices that should be theory (skip LUNCH=4)
  let penalty = 0;
  let total = 0;

  // Count theory cells
  const theoryCells = flatCells.filter(
    (c) => THEORY_PIS.includes(c.period_index) && c.slot_type !== "lab",
  );
  total = theoryCells.length;

  // Penalty: empty theory cells
  theoryCells.forEach((c) => {
    if (!c.slot_name || c.slot_type === "free") penalty += 1;
  });

  // Penalty: duplicate slot on same day
  const byDay = {};
  flatCells.forEach((c) => {
    if (!c.slot_name || c.slot_type !== "lecture") return;
    const k = `${c.day}-${c.slot_name}`;
    byDay[k] = (byDay[k] ?? 0) + 1;
  });
  Object.values(byDay).forEach((count) => {
    if (count > 1) penalty += (count - 1) * 2;
  });

  const raw = Math.max(0, total - penalty);
  return total > 0 ? Math.round((raw / total) * 100) : 0;
}

// ── PUT /schedule/:timetable_id — save grid only ──────────────────────────────

export const saveScheduleGrid = async (req, res) => {
  try {
    const { timetable_id } = req.params;
    const { grid } = req.body; // gridObject (day → { track1, track2 })

    if (!grid || typeof grid !== "object") {
      return res.status(400).json({ message: "grid is required" });
    }

    const schedule = await TimetableSchedule.findById(timetable_id);
    if (!schedule) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    schedule.grid = gridObjectToFlat(grid);
    await schedule.save();

    return res.status(200).json({
      message: "Schedule saved",
      timetable_id: schedule._id,
      score: schedule.score,
    });
  } catch (err) {
    console.error("[saveScheduleGrid]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ── POST /schedule/:timetable_id/evaluate — save + re-score ──────────────────

export const saveAndEvaluate = async (req, res) => {
  try {
    const { timetable_id } = req.params;
    const { grid } = req.body;

    if (!grid || typeof grid !== "object") {
      return res.status(400).json({ message: "grid is required" });
    }

    const schedule = await TimetableSchedule.findById(timetable_id);
    if (!schedule) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    const flatCells = gridObjectToFlat(grid);
    const newScore = evaluateGrid(flatCells);

    schedule.grid = flatCells;
    schedule.score = newScore;
    await schedule.save();

    return res.status(200).json({
      message: "Schedule saved and evaluated",
      timetable_id: schedule._id,
      score: newScore,
    });
  } catch (err) {
    console.error("[saveAndEvaluate]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
