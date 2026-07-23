// controllers/timetableController.js
//
// CHANGES FOR SLOT LOCKING (v3):
//   * generateTimetable now loads every SlotLock for the session and
//     converts them into the {course: {assignment_id: slot_name}, empty:
//     {slot_name: [batch_id,...]}} shape slot_generator.py v8 expects, and
//     threads it through the engine payload as `locks`.
//   * Locks are NOT cleared after generation — they're meant to persist
//     across repeated regenerations until the admin explicitly removes them
//     (see slotLockController.js).
//   * The engine's `lock_warnings` (non-fatal clash notices for forced
//     placements) are surfaced in the response alongside the existing
//     manual_review_count, so the admin can see if a lock landed on top of
//     something.
//
// NOTE: this assumes engine.py's run(data) reads data["locks"] and passes it
// through to slot_generator.build_slots(..., locks=data.get("locks")), and
// that run() includes whatever build_slots returns as result["lock_warnings"]
// in its output dict. I don't have engine.py's source, so this one wire-up
// needs a matching one-line change on your end — everything else here is
// self-contained.

import mongoose from "mongoose";
import { CourseAssignment } from "../../models/courseAssignmentModel.js";
import { TimetableSchedule } from "../../models/timetableScheduleModel.js";
import { GeneratedSlot } from "../../models/generatedSlotModel.js";
import { TimetableSkeleton } from "../../models/timetableSkeletonModel.js";
import { ManualReviewItem } from "../../models/manualReviewModel.js";
import { SlotLock } from "../../models/slotLockModel.js";
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

// NEW — loads every SlotLock for the session and reshapes it into the
// {course: {...}, empty: {...}} payload slot_generator.py v8 consumes.
async function buildLocksPayload(session_id) {
  const locks = await SlotLock.find({ session_id }).lean();

  const course = {};
  const empty = {};

  for (const l of locks) {
    if (l.lock_type === "course" && l.assignment_id) {
      course[String(l.assignment_id)] = l.slot_name;
    } else if (l.lock_type === "empty") {
      empty[l.slot_name] = empty[l.slot_name] ?? [];
      empty[l.slot_name].push(...l.batch_ids.map(String));
    }
  }

  return { course, empty };
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

    // NEW — admin locks, applied by the engine before its normal placement
    // pass. See slot_generator.py v8 for how "course" and "empty" locks are
    // honored.
    const locks = await buildLocksPayload(session_id);

    const result = await runTimetableEngine({
      assignments,
      skeleton_cells: skeleton.cells,
      occurrence_counts,
      adjacency_map,
      skeleton_days_by_label,
      locks,
    });
    // result = { slots, timetable, score, manual_review_items,
    //            suggested_track_assignments, lock_warnings, meta }

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
        // NEW — non-fatal notices when a lock landed on top of a clash.
        // Never blocks generation; purely informational for the admin.
        lock_warnings: result.lock_warnings ?? [],
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
        is_published: schedule.is_published, // add
        published_at: schedule.published_at, // add
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

export const publishSchedule = async (req, res) => {
  try {
    const { timetable_id } = req.params;

    const schedule = await TimetableSchedule.findById(timetable_id);
    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, message: "Timetable not found" });
    }

    // Toggle: if this schedule is already the published one, unpublish it.
    if (schedule.is_published) {
      schedule.is_published = false;
      schedule.published_at = null;
      await schedule.save();

      return res.status(200).json({
        success: true,
        message: "Timetable unpublished — hidden from students and faculty.",
        data: {
          timetable_id: schedule._id,
          is_published: false,
          published_at: null,
        },
      });
    }

    // Otherwise, publish this one and unpublish any other published
    // schedule for the same session (only one can be live at a time).
    await TimetableSchedule.updateMany(
      { session_id: schedule.session_id, is_published: true },
      { is_published: false, published_at: null },
    );

    schedule.is_published = true;
    schedule.published_at = new Date();
    await schedule.save();

    return res.status(200).json({
      success: true,
      message: "Timetable published — now visible to students and faculty.",
      data: {
        timetable_id: schedule._id,
        is_published: true,
        published_at: schedule.published_at,
      },
    });
  } catch (error) {
    console.error("[publishSchedule]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to publish/unpublish timetable",
    });
  }
};
