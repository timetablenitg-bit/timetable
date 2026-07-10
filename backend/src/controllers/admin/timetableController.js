// controllers/timetableController.js
//
// Consolidated from the old duplicate timetableController.js /
// engineController.js (they were identical). Handles generation and
// read endpoints. Rework/save-edit endpoints live in
// scheduleEditController.js. Track toggling lives in trackController.js.

import mongoose from "mongoose";
import { CourseAssignment } from "../../models/courseAssignmentModel.js";
import { TimetableSchedule } from "../../models/timetableScheduleModel.js";
import { GeneratedSlot } from "../../models/generatedSlotModel.js";
import { TimetableSkeleton } from "../../models/timetableSkeletonModel.js";
import { ManualReviewItem } from "../../models/manualReviewModel.js";
import { runTimetableEngine } from "../../engine/bridge/timetableEngine.js";
import { buildDefaultSkeletonCells } from "../../utils/defaultSkeletonCells.js";
import {
  getSlotOccurrenceCount,
  getAdjacencyMap,
  getSkeletonDaysByLabel,
  serializeAdjacencyMap,
} from "../../utils/skeletonDerivation.js";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// ── helpers ───────────────────────────────────────────────────────────────

function slotTypeFromName(name) {
  if (!name) return "free";
  if (name === "BREAK" || name === "LUNCH") return "break";
  if (name.startsWith("LAB")) return "lab";
  if (name === "G") return "minor";
  if (name === "H") return "oe";
  if (name === "TUT") return "tutorial";
  if (name === "1-CREDIT") return "lecture"; // match _slot_type() in timetable_generator.py
  return "lecture";
}

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
        slot_type: cell.slot_type ?? slotTypeFromName(cell.slot_name),
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
          slot_type: cell.slot_type ?? slotTypeFromName(cell.slot_name),
          is_lab_anchor: !!cell.is_lab_anchor,
        });
      }
    }
  }
  return grid;
}

function groupGrid(flatGrid) {
  const grouped = {};
  for (const day of DAYS) {
    const t1 = flatGrid
      .filter((c) => c.day === day && c.track === 1)
      .sort((a, b) => a.period_index - b.period_index);
    const t2 = flatGrid
      .filter((c) => c.day === day && c.track === 2)
      .sort((a, b) => a.period_index - b.period_index);
    grouped[day] = { track1: t1, track2: t2.length > 0 ? t2 : null };
  }
  return grouped;
}

async function getActiveSkeletonOrSeed(session_id) {
  let skeleton = await TimetableSkeleton.findOne({
    session_id,
    is_active: true,
  });
  if (!skeleton) {
    skeleton = await TimetableSkeleton.create({
      session_id,
      is_active: true,
      cells: buildDefaultSkeletonCells(),
    });
  }
  return skeleton;
}

// ── POST /api/v1/admin/timetable/generate ───────────────────────────────────

export const generateTimetable = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res
        .status(400)
        .json({ success: false, message: "session_id is required" });
    }

    const assignments = await CourseAssignment.find({ session_id })
      .populate("course_id")
      .populate("faculty_id")
      .populate("batch_ids");

    const skeleton = await getActiveSkeletonOrSeed(session_id);

    const occurrence_counts = getSlotOccurrenceCount(skeleton);
    const adjacency_map = serializeAdjacencyMap(getAdjacencyMap(skeleton));
    const skeleton_days_by_label = getSkeletonDaysByLabel(skeleton);

    const result = await runTimetableEngine({
      assignments,
      skeleton_cells: skeleton.cells,
      occurrence_counts,
      adjacency_map,
      skeleton_days_by_label,
    });
    // result = { slots, timetable, score, manual_review_items,
    //            suggested_track_assignments, meta }

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
    if (slotDocs.length) await GeneratedSlot.insertMany(slotDocs);

    // Persist manual review items
    const reviewDocs = (result.manual_review_items ?? []).map((item) => ({
      session_id,
      generation_id,
      assignment_id: item.assignment_id,
      kind: item.kind,
      status: "pending",
      sessions_needed: item.sessions_needed ?? 0,
      anchor_label: item.anchor_label ?? null,
      available_days: item.available_days ?? [],
      sessions_to_choose: item.sessions_to_choose ?? 0,
      reason: item.reason ?? "",
    }));
    if (reviewDocs.length) await ManualReviewItem.insertMany(reviewDocs);

    // Deactivate previous schedule, save new one
    await TimetableSchedule.updateMany({ session_id }, { is_active: false });

    const grid = flattenGrid(result.timetable);

    const saved = await TimetableSchedule.create({
      session_id,
      generation_id,
      score: result.score,
      is_active: true,
      grid,
      track_assignments: [], // admin hasn't made any choices yet
      suggested_track_assignments: result.suggested_track_assignments ?? [],
      meta: result.meta,
    });

    res.status(200).json({
      success: true,
      data: {
        timetable_id: saved._id,
        generation_id,
        score: result.score,
        timetable: result.timetable,
        slots: result.slots,
        manual_review_count: reviewDocs.length,
        suggested_track_assignments: result.suggested_track_assignments ?? [],
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

// ── GET /api/v1/admin/timetable/schedule ─────────────────────────────────────

export const getActiveSchedule = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res
        .status(400)
        .json({ success: false, message: "session_id is required" });
    }

    const schedule = await TimetableSchedule.findOne({
      session_id,
      is_active: true,
    });
    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, message: "No active timetable found" });
    }

    res.status(200).json({
      success: true,
      data: {
        timetable_id: schedule._id,
        generation_id: schedule.generation_id,
        score: schedule.score,
        meta: schedule.meta,
        generated_at: schedule.createdAt,
        track_assignments: schedule.track_assignments ?? [],
        suggested_track_assignments: schedule.suggested_track_assignments ?? [],
        grid: groupGrid(schedule.grid),
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
    if (!session_id) {
      return res
        .status(400)
        .json({ success: false, message: "session_id is required" });
    }

    const activeSchedule = await TimetableSchedule.findOne({
      session_id,
      is_active: true,
    }).select("generation_id score meta createdAt");

    if (!activeSchedule) {
      return res
        .status(404)
        .json({ success: false, message: "No active timetable found" });
    }

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
        slots,
      },
    });
  } catch (error) {
    console.error("Fetch slots error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch slots" });
  }
};
