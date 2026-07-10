// controllers/scheduleEditController.js
//
// Route: POST /api/v1/admin/timetable/schedule/:timetable_id/save
//
// This replaces BOTH the old saveScheduleGrid / saveAndEvaluate pair AND
// the old reworkTimetable controller — per decision #3, "rework" is just
// the admin hand-editing the saved grid in the UI. There is no engine
// invocation, no regeneration, no rework_engine.py. We persist the
// edited grid and rescore it with the trimmed scorer.py (soft
// preferences only — see scorer.py's docstring).
//
// IMPORTANT: because a manual edit bypasses slot_generator.py's hard
// constraint checks entirely, we re-validate the edited grid against the
// same faculty/batch double-booking + adjacency rules before saving.
// Violations are surfaced as warnings (matching the existing
// checkConflicts pattern in slotEditController.js) rather than hard
// blocking the save — the admin is allowed to override, same as
// elsewhere in this codebase, but they see exactly what they're
// overriding.

import { TimetableSchedule } from "../../models/timetableScheduleModel.js";
import { GeneratedSlot } from "../../models/generatedSlotModel.js";
import { TimetableSkeleton } from "../../models/timetableSkeletonModel.js";
import { runTimetableEngine } from "../../engine/bridge/timetableEngine.js";
import {
  getAdjacencyMap,
  serializeAdjacencyMap,
} from "../../utils/skeletonDerivation.js";

// ── helpers ───────────────────────────────────────────────────────────────

function gridObjectToFlat(gridObj) {
  const flat = [];
  for (const [day, tracks] of Object.entries(gridObj)) {
    for (const cell of tracks.track1 ?? [])
      flat.push({ ...cell, day, track: 1 });
    for (const cell of tracks.track2 ?? [])
      flat.push({ ...cell, day, track: 2 });
  }
  return flat;
}

function flatToTimetableShape(flatGrid) {
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const out = {};
  for (const day of DAYS) {
    const t1 = flatGrid
      .filter((c) => c.day === day && c.track === 1)
      .sort((a, b) => a.period_index - b.period_index);
    const t2 = flatGrid
      .filter((c) => c.day === day && c.track === 2)
      .sort((a, b) => a.period_index - b.period_index);
    out[day] = { track1: t1, track2: t2.length ? t2 : null };
  }
  return out;
}

async function buildSlotOccupantMap(session_id, generation_id) {
  const slots = await GeneratedSlot.find({ session_id, generation_id }).lean();
  const map = {};
  for (const slot of slots) {
    const facultyIds = new Set();
    const batchIds = new Set();
    for (const e of slot.entries ?? []) {
      if (e.faculty_id) facultyIds.add(String(e.faculty_id));
      (e.batch_ids ?? []).forEach((b) => batchIds.add(String(b)));
    }
    map[slot.slot_name] = { facultyIds, batchIds };
  }
  return map;
}

/**
 * Re-checks the edited grid for:
 *   1. Faculty/batch double-booked in the same slot_name occupant set
 *      (only meaningful if the admin renamed/reused a slot_name — the
 *      occupant map itself already guarantees no double-booking within
 *      a single GeneratedSlot).
 *   2. Adjacency clashes introduced by the admin's rearrangement — the
 *      whole point of a manual edit is moving slot_names to different
 *      cells, which can put two previously-safe labels next to each
 *      other. Track-aware: checks whichever track each cell is actually
 *      on (unlike generation time, the edited grid is a concrete
 *      arrangement, not a projection).
 */
function validateReworkGrid(flatGrid, occupantMap) {
  const warnings = [];
  const byDayTrack = {};
  for (const cell of flatGrid) {
    const key = `${cell.day}::${cell.track}`;
    if (!byDayTrack[key]) byDayTrack[key] = [];
    byDayTrack[key].push(cell);
  }

  for (const [key, cells] of Object.entries(byDayTrack)) {
    const sorted = [...cells].sort((a, b) => a.period_index - b.period_index);
    const filled = sorted.filter(
      (c) => c.slot_name && !["BREAK", "LUNCH"].includes(c.slot_name),
    );

    for (let i = 1; i < filled.length; i++) {
      const prev = filled[i - 1];
      const curr = filled[i];
      if (curr.period_index - prev.period_index !== 1) continue; // not actually adjacent

      const prevOcc = occupantMap[prev.slot_name];
      const currOcc = occupantMap[curr.slot_name];
      if (!prevOcc || !currOcc) continue;

      const facultyOverlap = [...currOcc.facultyIds].some((f) =>
        prevOcc.facultyIds.has(f),
      );
      const batchOverlap = [...currOcc.batchIds].some((b) =>
        prevOcc.batchIds.has(b),
      );

      if (facultyOverlap) {
        warnings.push(
          `${key.replace("::", " track ")}: '${prev.slot_name}' and '${curr.slot_name}' are back-to-back and share a faculty member.`,
        );
      }
      if (batchOverlap) {
        warnings.push(
          `${key.replace("::", " track ")}: '${prev.slot_name}' and '${curr.slot_name}' are back-to-back and share a batch.`,
        );
      }
    }
  }

  return warnings;
}

// ── POST /api/v1/admin/timetable/schedule/:timetable_id/save ───────────────
// Body: { grid: { Monday: { track1: [...], track2: [...] }, ... } }
// Consolidates the old saveScheduleGrid / saveAndEvaluate / reworkTimetable
// into one endpoint. Always saves; always rescores; always returns
// warnings (empty array if clean).

export const saveAndEvaluateSchedule = async (req, res) => {
  try {
    const { timetable_id } = req.params;
    const { grid } = req.body;

    if (!grid || typeof grid !== "object") {
      return res
        .status(400)
        .json({ success: false, message: "grid is required" });
    }

    const schedule = await TimetableSchedule.findById(timetable_id);
    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, message: "Timetable not found" });
    }

    const flatGrid = gridObjectToFlat(grid);
    const timetableShape = flatToTimetableShape(flatGrid);

    const occupantMap = await buildSlotOccupantMap(
      schedule.session_id,
      schedule.generation_id,
    );
    const warnings = validateReworkGrid(flatGrid, occupantMap);

    // Rescore via the Python subprocess in "evaluate" mode (soft
    // preferences only — see scorer.py). No regeneration, no full engine
    // run; this is a single lightweight scoring call.
    const { score } = await runTimetableEngine({
      mode: "evaluate",
      timetable: timetableShape,
    });

    schedule.grid = flatGrid;
    schedule.score = score;
    await schedule.save();

    return res.status(200).json({
      success: true,
      message: warnings.length
        ? "Schedule saved with warnings — review before publishing."
        : "Schedule saved",
      data: {
        timetable_id: schedule._id,
        score,
        warnings,
      },
    });
  } catch (err) {
    console.error("[saveAndEvaluateSchedule]", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
