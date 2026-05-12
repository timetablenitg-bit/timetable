// controllers/timetable/publicTimetableController.js

import { TimetableSchedule } from "../models/timetableScheduleModel.js";
import { GeneratedSlot } from "../models/generatedSlotModel.js";
import { AcademicSession } from "../models/academicSessionModel.js";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

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

// ── GET /api/v1/timetable/active-session ─────────────────────────────────────
export const getActiveTimetableSession = async (req, res) => {
  try {
    // Schema uses `isActive` (camelCase), not `is_active`
    const session = await AcademicSession.findOne({ isActive: true })
      .select("_id term academic_year isActive")
      .lean();

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "No active academic session found." });
    }

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    console.error("getActiveTimetableSession error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── GET /api/v1/timetable/schedule?session_id=... ────────────────────────────
export const getPublicSchedule = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id)
      return res
        .status(400)
        .json({ success: false, message: "session_id is required." });

    const schedule = await TimetableSchedule.findOne({
      session_id,
      is_active: true,
    });

    if (!schedule)
      return res
        .status(404)
        .json({ success: false, message: "No active timetable found." });

    res.status(200).json({
      success: true,
      data: {
        timetable_id: schedule._id,
        generation_id: schedule.generation_id,
        score: schedule.score,
        meta: schedule.meta,
        generated_at: schedule.createdAt,
        track2_batches: schedule.track2_batches ?? [],
        grid: groupGrid(schedule.grid),
      },
    });
  } catch (error) {
    console.error("getPublicSchedule error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch schedule." });
  }
};

// ── GET /api/v1/timetable/slots?session_id=... ───────────────────────────────
export const getPublicSlots = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id)
      return res
        .status(400)
        .json({ success: false, message: "session_id is required." });

    const activeSchedule = await TimetableSchedule.findOne({
      session_id,
      is_active: true,
    }).select("generation_id score meta createdAt track2_batches");

    if (!activeSchedule)
      return res
        .status(404)
        .json({ success: false, message: "No active timetable found." });

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
    console.error("getPublicSlots error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch slots." });
  }
};
