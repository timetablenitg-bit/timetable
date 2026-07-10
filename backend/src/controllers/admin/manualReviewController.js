// controllers/manualReviewController.js
//
// Endpoints for the admin to work through what slot_generator.py
// couldn't auto-place: overflow sessions (4-credit-and-similar, and
// synced_with group excess) and choose_occurrences items (2-credit
// courses, and synced_with group shortfall — decision #6).
//
// Resolving an item writes the admin's placement straight into the
// active generation's GeneratedSlot / TimetableSchedule records — this
// IS how the "corrected timetable" gets saved, there's no separate
// draft/preview step.

import { ManualReviewItem } from "../../models/manualReviewModel.js";
import { GeneratedSlot } from "../../models/generatedSlotModel.js";
import { TimetableSchedule } from "../../models/timetableScheduleModel.js";
import { CourseAssignment } from "../../models/courseAssignmentModel.js";
import { computePlacementAvailability } from "../../utils/computePlacementAvailability.js";

// ── GET /api/v1/admin/timetable/manual-review?session_id= ──────────────────
// Returns pending items for the session's latest generation run.

export const getPendingReviewItems = async (req, res) => {
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
    }).select("generation_id");

    if (!activeSchedule) {
      return res
        .status(404)
        .json({ success: false, message: "No active timetable found" });
    }

    const items = await ManualReviewItem.find({
      session_id,
      generation_id: activeSchedule.generation_id,
      status: "pending",
    })
      .populate({
        path: "assignment_id",
        populate: ["course_id", "faculty_id", "batch_ids"],
      })
      .lean();

    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("[getPendingReviewItems]", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ── helper: write one entry into (or create) a GeneratedSlot's entries ─────

async function upsertSlotEntry(
  session_id,
  generation_id,
  slot_name,
  slot_type,
  assignment,
) {
  let slot = await GeneratedSlot.findOne({
    session_id,
    generation_id,
    slot_name,
  });
  const entry = {
    assignment_id: assignment._id,
    course_code: assignment.course_id?.course_code,
    faculty_code: assignment.faculty_id?.faculty_code,
    faculty_id: assignment.faculty_id?._id,
    batch_names: (assignment.batch_ids ?? []).map((b) => b.batch_name),
    batch_ids: (assignment.batch_ids ?? []).map((b) => b._id),
    component_type: assignment.component_type ?? "lecture",
  };

  if (!slot) {
    slot = await GeneratedSlot.create({
      session_id,
      generation_id,
      slot_name,
      slot_type,
      entries: [entry],
    });
  } else {
    slot.entries.push(entry);
    await slot.save();
  }
  return slot;
}

// ── PATCH /api/v1/admin/timetable/manual-review/:item_id/overflow ──────────
// Body: { placements: [{ day, period_index, track }] }
// Admin manually places each excess session. We create/extend a
// dedicated "MANUAL_<assignment_id>_<n>" slot label per placement so it
// doesn't collide with anything the engine already named, and it's
// traceable back to the review item.

export const resolveOverflowItem = async (req, res) => {
  try {
    const { item_id } = req.params;
    const { placements } = req.body;

    if (!Array.isArray(placements) || !placements.length) {
      return res
        .status(400)
        .json({ success: false, message: "placements[] is required" });
    }

    const item = await ManualReviewItem.findById(item_id).populate({
      path: "assignment_id",
      populate: ["course_id", "faculty_id", "batch_ids"],
    });
    if (!item || item.kind !== "overflow") {
      return res
        .status(404)
        .json({ success: false, message: "Overflow review item not found" });
    }
    if (placements.length !== item.sessions_needed) {
      return res.status(400).json({
        success: false,
        message: `Expected ${item.sessions_needed} placement(s), got ${placements.length}`,
      });
    }

    const assignment = item.assignment_id;
    const grid_additions = [];

    for (let i = 0; i < placements.length; i++) {
      const { day, period_index, track = 1 } = placements[i];
      if (!day || period_index === undefined) {
        return res.status(400).json({
          success: false,
          message: "Each placement needs day and period_index",
        });
      }

      const slot_name = `MANUAL_${String(assignment._id)}_${i}`;
      await upsertSlotEntry(
        item.session_id,
        item.generation_id,
        slot_name,
        "lecture",
        assignment,
      );

      grid_additions.push({
        day,
        track,
        period_index,
        slot_name,
        slot_type: "lecture",
        is_lab_anchor: false,
      });
    }

    const schedule = await TimetableSchedule.findOne({
      session_id: item.session_id,
      generation_id: item.generation_id,
    });
    if (schedule) {
      // Replace any prior manual cells for this assignment (idempotent
      // re-resolution), then add the new ones.
      schedule.grid = schedule.grid.filter(
        (c) => !c.slot_name?.startsWith(`MANUAL_${String(assignment._id)}_`),
      );
      for (const addition of grid_additions) {
        const timeLabelCell = schedule.grid.find(
          (c) =>
            c.day === addition.day &&
            c.period_index === addition.period_index &&
            c.track === addition.track,
        );
        schedule.grid.push({
          ...addition,
          time_label: timeLabelCell?.time_label ?? "",
        });
      }
      await schedule.save();
    }

    item.status = "resolved";
    item.resolution = { placements, chosen_days: [] };
    await item.save();

    return res.status(200).json({
      success: true,
      message: "Overflow item resolved",
      data: { item },
    });
  } catch (err) {
    console.error("[resolveOverflowItem]", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ── PATCH /api/v1/admin/timetable/manual-review/:item_id/choose-occurrences ─
// Body: { chosen_days: ["Monday", "Thursday"] }
// Admin picks which N of the anchor label's M available days to
// actually use. We prune the assignment out of the anchor label's
// GeneratedSlot entries on the days NOT chosen, at the grid level —
// since GeneratedSlot entries aren't day-scoped (a label's entries apply
// to every day it occurs on), pruning happens on the TimetableSchedule
// grid: we blank the assignment's slot_name on the un-chosen days'
// cells and leave the GeneratedSlot document (source of truth for
// faculty/batch/course) untouched.

export const resolveChooseOccurrencesItem = async (req, res) => {
  try {
    const { item_id } = req.params;
    const { chosen_days } = req.body;

    if (!Array.isArray(chosen_days) || !chosen_days.length) {
      return res
        .status(400)
        .json({ success: false, message: "chosen_days[] is required" });
    }

    const item = await ManualReviewItem.findById(item_id);
    if (!item || item.kind !== "choose_occurrences") {
      return res.status(404).json({
        success: false,
        message: "choose_occurrences review item not found",
      });
    }
    if (chosen_days.length !== item.sessions_to_choose) {
      return res.status(400).json({
        success: false,
        message: `Expected ${item.sessions_to_choose} day(s), got ${chosen_days.length}`,
      });
    }
    const invalid = chosen_days.filter((d) => !item.available_days.includes(d));
    if (invalid.length) {
      return res.status(400).json({
        success: false,
        message: `${invalid.join(", ")} not among available days: ${item.available_days.join(", ")}`,
      });
    }

    const schedule = await TimetableSchedule.findOne({
      session_id: item.session_id,
      generation_id: item.generation_id,
    });

    if (schedule) {
      const daysToBlank = item.available_days.filter(
        (d) => !chosen_days.includes(d),
      );
      for (const cell of schedule.grid) {
        if (
          cell.slot_name === item.anchor_label &&
          daysToBlank.includes(cell.day)
        ) {
          // NOTE: this blanks the WHOLE anchor label on that day, which
          // is correct only if this assignment is the sole occupant of
          // that label. If the label is shared with other synced
          // members who DO want that day, this needs a per-assignment
          // entries model on the grid cell rather than a single
          // slot_name string — flagging this as a known limitation of
          // the current grid shape rather than guessing at a fix.
          cell.slot_name = null;
          cell.slot_type = "free";
        }
      }
      await schedule.save();
    }

    item.status = "resolved";
    item.resolution = { placements: [], chosen_days };
    await item.save();

    return res.status(200).json({
      success: true,
      message: "choose_occurrences item resolved",
      data: { item },
    });
  } catch (err) {
    console.error("[resolveChooseOccurrencesItem]", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
// ── GET /api/v1/admin/timetable/manual-review/:item_id/availability ────────
// Returns a per-cell free/shared_ok/blocked map for THIS item's assignment,
// so the frontend can render a clickable timetable instead of raw selects.
export const getItemAvailability = async (req, res) => {
  try {
    const { item_id } = req.params;

    const item = await ManualReviewItem.findById(item_id).populate({
      path: "assignment_id",
      populate: ["course_id", "faculty_id", "batch_ids"],
    });
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Review item not found" });
    }

    const schedule = await TimetableSchedule.findOne({
      session_id: item.session_id,
      generation_id: item.generation_id,
    });
    if (!schedule) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Schedule not found for this generation",
        });
    }

    const slots = await GeneratedSlot.find({
      session_id: item.session_id,
      generation_id: item.generation_id,
    });

    const assignment = item.assignment_id;
    const batchIds = (assignment.batch_ids ?? []).map((b) => b._id);

    const availability = computePlacementAvailability({
      schedule,
      slots,
      batchIds,
      facultyId: assignment.faculty_id?._id,
      currentAssignmentId: assignment._id,
    });

    return res.status(200).json({
      success: true,
      data: {
        availability,
        batches: (assignment.batch_ids ?? []).map((b) => ({
          id: b._id,
          name: b.batch_name,
        })),
        course_code: assignment.course_id?.course_code,
        faculty_code: assignment.faculty_id?.faculty_code,
      },
    });
  } catch (err) {
    console.error("[getItemAvailability]", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
