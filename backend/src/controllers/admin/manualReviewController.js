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
import { computeMinorOeAvailability } from "../../utils/computeMinorOeAvailability.js";

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

// controllers/manualReviewController.js
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

    const schedule = await TimetableSchedule.findOne({
      session_id: item.session_id,
      generation_id: item.generation_id,
    });
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found for this generation",
      });
    }

    const manualEntry = {
      assignment_id: assignment._id,
      course_code: assignment.course_id?.course_code,
      faculty_code: assignment.faculty_id?.faculty_code,
      faculty_id: assignment.faculty_id?._id,
      batch_names: (assignment.batch_ids ?? []).map((b) => b.batch_name),
      batch_ids: (assignment.batch_ids ?? []).map((b) => b._id),
      component_type: assignment.component_type ?? "lecture",
    };

    // Idempotent re-resolution: strip this assignment's manual_entries off
    // every cell first, wherever they currently sit.
    for (const cell of schedule.grid) {
      if (cell.manual_entries?.length) {
        cell.manual_entries = cell.manual_entries.filter(
          (e) => String(e.assignment_id) !== String(assignment._id),
        );
      }
    }

    // Now place fresh — directly onto the chosen cells, no slot_name touched.
    for (const { day, period_index, track = 1 } of placements) {
      const cell = schedule.grid.find(
        (c) =>
          c.day === day && c.period_index === period_index && c.track === track,
      );
      if (!cell) {
        return res.status(400).json({
          success: false,
          message: `No grid cell at ${day} P${period_index} T${track}`,
        });
      }
      cell.manual_entries.push(manualEntry);
    }

    schedule.markModified("grid");
    await schedule.save();

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
    // ...same validation as before...

    const item = await ManualReviewItem.findById(item_id).populate({
      path: "assignment_id",
      populate: ["course_id", "faculty_id", "batch_ids"],
    });
    // ...kind/count/invalid-day checks unchanged...

    const schedule = await TimetableSchedule.findOne({
      session_id: item.session_id,
      generation_id: item.generation_id,
    });

    if (schedule) {
      const daysToBlank = item.available_days.filter(
        (d) => !chosen_days.includes(d),
      );
      const assignmentId = String(item.assignment_id._id);

      for (const cell of schedule.grid) {
        if (cell.slot_name !== item.anchor_label) continue;

        if (daysToBlank.includes(cell.day)) {
          // Hide just THIS assignment on this cell — everyone else who
          // shares the label on this day is untouched.
          if (
            !cell.hidden_assignment_ids.some(
              (id) => String(id) === assignmentId,
            )
          ) {
            cell.hidden_assignment_ids.push(item.assignment_id._id);
          }
        } else if (chosen_days.includes(cell.day)) {
          // Re-resolution: un-hide if a previous save had hidden it here.
          cell.hidden_assignment_ids = cell.hidden_assignment_ids.filter(
            (id) => String(id) !== assignmentId,
          );
        }
      }
      schedule.markModified("grid");
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
      return res.status(404).json({
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
      // 🔥 NEW (case 3) — only meaningful for backlog assignments; undefined
      // for everything else, which computePlacementAvailability treats as
      // "no exemption", same as before this change.
      dropCourseAssignmentId: assignment.drop_course_id ?? undefined,
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
// ── GET /api/v1/admin/timetable/manual-review/:item_id/minor-oe-availability ──
// Returns free/blocked status for THIS item's batch(es) across every day's
// minor(G)/OE(H) column. Only meaningful for kind === "unplaced" items.

export const getMinorOeAvailability = async (req, res) => {
  try {
    const { item_id } = req.params;

    const item = await ManualReviewItem.findById(item_id).populate({
      path: "assignment_id",
      populate: ["course_id", "faculty_id", "batch_ids"],
    });
    if (!item || item.kind !== "unplaced") {
      return res
        .status(404)
        .json({ success: false, message: "Unplaced review item not found" });
    }

    const schedule = await TimetableSchedule.findOne({
      session_id: item.session_id,
      generation_id: item.generation_id,
    });
    if (!schedule) {
      return res.status(404).json({
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

    const availability = computeMinorOeAvailability({
      schedule,
      slots,
      batchIds,
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
    console.error("[getMinorOeAvailability]", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ── PATCH /api/v1/admin/timetable/manual-review/:item_id/unplaced ──────────
// Body: { placements: [{ day, slot_type }] }   // slot_type: 'minor' | 'oe'
//
// Resolves an "unplaced" item — a course/lab that got zero automatic
// placement. Each placement MUST land on an empty minor/OE cell for this
// item's batch(es); we re-verify freshness at resolve time rather than
// trusting whatever the admin's UI last fetched, since another admin
// action could have filled that slot in the meantime.

export const resolveUnplacedItem = async (req, res) => {
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
    if (!item || item.kind !== "unplaced") {
      return res
        .status(404)
        .json({ success: false, message: "Unplaced review item not found" });
    }
    if (placements.length !== item.sessions_needed) {
      return res.status(400).json({
        success: false,
        message: `Expected ${item.sessions_needed} placement(s), got ${placements.length}`,
      });
    }
    for (const p of placements) {
      if (!["minor", "oe"].includes(p.slot_type)) {
        return res.status(400).json({
          success: false,
          message: `slot_type must be 'minor' or 'oe', got '${p.slot_type}'`,
        });
      }
    }

    const assignment = item.assignment_id;
    const batchIds = (assignment.batch_ids ?? []).map((b) => String(b._id));

    const schedule = await TimetableSchedule.findOne({
      session_id: item.session_id,
      generation_id: item.generation_id,
    });
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found for this generation",
      });
    }

    const slots = await GeneratedSlot.find({
      session_id: item.session_id,
      generation_id: item.generation_id,
    });

    // Idempotent re-resolution: strip this assignment's PRIOR minor/OE
    // overrides first (but leave any plain overflow manual_entries for this
    // assignment alone — different kind of item, different data).
    for (const cell of schedule.grid) {
      if (cell.manual_entries?.length) {
        cell.manual_entries = cell.manual_entries.filter(
          (e) =>
            !(
              String(e.assignment_id) === String(assignment._id) &&
              e.is_minor_oe_override
            ),
        );
      }
    }

    const manualEntry = {
      assignment_id: assignment._id,
      course_code: assignment.course_id?.course_code,
      faculty_code: assignment.faculty_id?.faculty_code,
      faculty_id: assignment.faculty_id?._id,
      batch_names: (assignment.batch_ids ?? []).map((b) => b.batch_name),
      batch_ids: (assignment.batch_ids ?? []).map((b) => b._id),
      component_type: assignment.component_type ?? "lecture",
      is_minor_oe_override: true,
    };

    const resolvedPlacements = [];

    for (const { day, slot_type } of placements) {
      const cell = schedule.grid.find(
        (c) => c.day === day && c.slot_type === slot_type,
      );
      if (!cell) {
        return res.status(400).json({
          success: false,
          message: `No ${slot_type.toUpperCase()} period on ${day}`,
        });
      }

      // Re-verify freshness: batch must not already be in this label's
      // GeneratedSlot entries, nor already sitting in this cell's
      // manual_entries (from something other than the stale copy we just
      // stripped above).
      const slot = slots.find((s) => s.slot_name === cell.slot_name);
      const alreadyInLabel = (slot?.entries ?? []).some((e) =>
        (e.batch_ids ?? []).some((b) => batchIds.includes(String(b))),
      );
      const alreadyManual = (cell.manual_entries ?? []).some((e) =>
        (e.batch_ids ?? []).some((b) => batchIds.includes(String(b))),
      );
      if (alreadyInLabel || alreadyManual) {
        return res.status(409).json({
          success: false,
          message: `Batch already has a class in the ${slot_type.toUpperCase()} period on ${day} — that slot isn't empty anymore. Refresh and try again.`,
        });
      }

      cell.manual_entries.push(manualEntry);
      resolvedPlacements.push({
        day: cell.day,
        period_index: cell.period_index,
        track: cell.track,
        slot_type,
      });
    }

    schedule.markModified("grid");
    await schedule.save();

    item.status = "resolved";
    item.resolution = { placements: resolvedPlacements, chosen_days: [] };
    await item.save();

    return res.status(200).json({
      success: true,
      message: "Unplaced item resolved",
      data: { item },
    });
  } catch (err) {
    console.error("[resolveUnplacedItem]", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
