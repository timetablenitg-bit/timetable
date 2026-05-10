// controllers/timetableController.js  — full file, dual-track aware
import { CourseAssignment } from "../../models/courseAssignmentModel.js";
import { TimetableSchedule } from "../../models/timetableScheduleModel.js";
import { GeneratedSlot } from "../../models/generatedSlotModel.js";
import { runTimetableEngine } from "../../engine/bridge/timetableEngine.js";
import mongoose from "mongoose";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function slotTypeFromName(name) {
  if (!name) return "free";
  if (name === "BREAK") return "break";
  if (name.startsWith("LAB")) return "lab";
  if (name === "G") return "minor";
  if (name === "H") return "oe";
  return "lecture";
}

/**
 * Flatten the dual-track timetable structure from Python into the DB grid array.
 * Python returns:
 *   { Monday: { track1: [...cells], track2: [...cells] | null }, ... }
 */
function flattenGrid(timetable) {
  const grid = [];
  for (const day of DAYS) {
    const dayData = timetable[day] ?? {};

    for (const cell of dayData.track1 ?? []) {
      grid.push({
        day,
        track: 1,
        period_index: cell.period_index,
        time_label: cell.time_label,
        slot_name: cell.slot_name,
        slot_type: slotTypeFromName(cell.slot_name),
        is_lab_anchor: !!cell.is_lab_anchor,
      });
    }

    if (dayData.track2) {
      for (const cell of dayData.track2) {
        grid.push({
          day,
          track: 2,
          period_index: cell.period_index,
          time_label: cell.time_label,
          slot_name: cell.slot_name,
          slot_type: slotTypeFromName(cell.slot_name),
          is_lab_anchor: !!cell.is_lab_anchor,
        });
      }
    }
  }
  return grid;
}

/**
 * Re-group flat grid → { day: { track1: [...], track2: [...] | null } }
 * Used when reading from DB for the frontend.
 */
function groupGrid(flatGrid) {
  const grouped = {};
  for (const day of DAYS) {
    const t1 = flatGrid
      .filter((c) => c.day === day && c.track === 1)
      .sort((a, b) => a.period_index - b.period_index);
    const t2cells = flatGrid
      .filter((c) => c.day === day && c.track === 2)
      .sort((a, b) => a.period_index - b.period_index);
    grouped[day] = {
      track1: t1,
      track2: t2cells.length > 0 ? t2cells : null,
    };
  }
  return grouped;
}

// ── POST /api/v1/admin/timetable/generate ─────────────────────────────────────

export const generateTimetable = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id)
      return res
        .status(400)
        .json({ success: false, message: "session_id is required" });

    const assignments = await CourseAssignment.find({ session_id })
      .populate("course_id")
      .populate("faculty_id")
      .populate("batch_ids");

    const result = await runTimetableEngine(assignments);
    // result = { slots, timetable, score, meta, track2_batches? }

    const generation_id = new mongoose.Types.ObjectId();

    // Persist slots
    const slotDocs = Object.entries(result.slots).map(
      ([slot_name, entries]) => ({
        session_id,
        generation_id,
        slot_name,
        slot_type: slotTypeFromName(slot_name),
        entries: entries.map((e) => ({
          assignment_id: e.assignment_id,
          course_code: e.course,
          faculty_code: e.faculty,
          faculty_id: e.faculty_id,
          batch_names: e.batches,
          batch_ids: e.batch_ids ?? [],
          component_type: e.component_type ?? "lecture",
        })),
      }),
    );
    await GeneratedSlot.insertMany(slotDocs);

    // Deactivate previous
    await TimetableSchedule.updateMany({ session_id }, { is_active: false });

    // Build and persist flat grid
    const grid = flattenGrid(result.timetable);

    const saved = await TimetableSchedule.create({
      session_id,
      generation_id,
      score: result.score,
      is_active: true,
      track2_batches: result.track2_batches ?? [],
      grid,
      meta: result.meta,
    });

    res.status(200).json({
      success: true,
      data: {
        timetable_id: saved._id,
        generation_id,
        score: result.score,
        timetable: result.timetable, // dual-track shape
        slots: result.slots,
        track2_batches: result.track2_batches ?? [],
        meta: result.meta,
      },
    });
  } catch (error) {
    console.error("Timetable generation error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate timetable" });
  }
};

// ── GET /api/v1/admin/timetable/schedule ──────────────────────────────────────

export const getActiveSchedule = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id)
      return res
        .status(400)
        .json({ success: false, message: "session_id is required" });

    const schedule = await TimetableSchedule.findOne({
      session_id,
      is_active: true,
    });
    if (!schedule)
      return res
        .status(404)
        .json({ success: false, message: "No active timetable found" });

    res.status(200).json({
      success: true,
      data: {
        timetable_id: schedule._id,
        generation_id: schedule.generation_id,
        score: schedule.score,
        meta: schedule.meta,
        generated_at: schedule.createdAt,
        track2_batches: schedule.track2_batches ?? [],
        grid: groupGrid(schedule.grid), // dual-track shape
      },
    });
  } catch (error) {
    console.error("Fetch schedule error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch schedule" });
  }
};

// ── GET /api/v1/admin/timetable/slots ─────────────────────────────────────────

export const getGeneratedSlots = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id)
      return res
        .status(400)
        .json({ success: false, message: "session_id is required" });

    const activeSchedule = await TimetableSchedule.findOne({
      session_id,
      is_active: true,
    }).select("generation_id score meta createdAt track2_batches");

    if (!activeSchedule)
      return res
        .status(404)
        .json({ success: false, message: "No active timetable found" });

    const slots = await GeneratedSlot.find({
      session_id,
      generation_id: activeSchedule.generation_id,
    }).sort({ slot_name: 1 });

    res.status(200).json({
      success: true,
      data: {
        generation_id: activeSchedule.generation_id,
        score: activeSchedule.score,
        meta: activeSchedule.meta,
        generated_at: activeSchedule.createdAt,
        track2_batches: activeSchedule.track2_batches ?? [],
        slots,
      },
    });
  } catch (error) {
    console.error("Fetch slots error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch slots" });
  }
};

// ── POST /api/v1/admin/timetable/evaluate ────────────────────────────────────

export const evaluateTimetable = async (req, res) => {
  try {
    const { timetable, slots, timetable_id } = req.body;
    if (!timetable || !slots)
      return res
        .status(400)
        .json({ success: false, message: "timetable and slots are required" });

    const result = await runTimetableEngine({
      mode: "evaluate",
      timetable,
      slots,
    });

    if (timetable_id) {
      const grid = flattenGrid(timetable);
      await TimetableSchedule.findByIdAndUpdate(timetable_id, {
        grid,
        score: result.score,
      });
    }

    res.status(200).json({ success: true, data: { score: result.score } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Evaluation failed" });
  }
};

// ── POST /api/v1/admin/timetable/rework ───────────────────────────────────────

export const reworkTimetable = async (req, res) => {
  try {
    const { session_id, timetable_id, timetable, slots, locked_cells } =
      req.body;

    if (!session_id || !timetable || !slots)
      return res.status(400).json({
        success: false,
        message: "session_id, timetable, and slots are required",
      });

    const result = await runTimetableEngine({
      mode: "rework",
      timetable,
      slots,
      locked_cells: locked_cells ?? [],
      session_id,
    });

    await TimetableSchedule.updateMany({ session_id }, { is_active: false });

    const srcSchedule = timetable_id
      ? await TimetableSchedule.findById(timetable_id).select(
          "generation_id track2_batches",
        )
      : null;

    const generation_id =
      srcSchedule?.generation_id ?? new mongoose.Types.ObjectId();
    const track2_batches = srcSchedule?.track2_batches ?? [];

    const grid = flattenGrid(result.timetable);

    const saved = await TimetableSchedule.create({
      session_id,
      generation_id,
      score: result.score,
      is_active: true,
      track2_batches,
      grid,
      meta: result.meta,
    });

    res.status(200).json({
      success: true,
      data: {
        timetable_id: saved._id,
        generation_id,
        score: result.score,
        timetable: result.timetable,
        slots,
        track2_batches,
        meta: result.meta,
      },
    });
  } catch (error) {
    console.error("Rework timetable error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to rework timetable" });
  }
};
