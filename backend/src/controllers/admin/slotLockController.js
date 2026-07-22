// controllers/slotLockController.js
//
// Routes (add to your admin timetable router):
//   GET    /api/v1/admin/timetable/locks?session_id=            — list all locks
//   POST   /api/v1/admin/timetable/locks/course                 — lock a course to a slot
//   POST   /api/v1/admin/timetable/locks/empty                  — lock a slot empty for batches
//   DELETE /api/v1/admin/timetable/locks/:lock_id                — remove one lock
//   DELETE /api/v1/admin/timetable/locks?session_id=             — clear all locks for a session
//
// Locks are read by timetableController.js::generateTimetable at the start
// of every generation run and threaded into the Python engine payload — see
// that file's diff and slot_generator.py v8 for how they're applied.

import { SlotLock } from "../../models/slotLockModel.js";
import { CourseAssignment } from "../../models/courseAssignmentModel.js";
import { TimetableSkeleton } from "../../models/timetableSkeletonModel.js";

// ── helpers ───────────────────────────────────────────────────────────────

// Expands the active skeleton's slot_labels into the concrete set of names a
// lock can target — "LAB" placeholder cells expand into the three concrete
// LAB_<DAY> names, matching how slot_generator.py names lab buckets.
async function activeSkeletonLabels(session_id) {
  const skeleton = await TimetableSkeleton.findOne({
    session_id,
    is_active: true,
  }).lean();
  if (!skeleton) return null; // no skeleton yet — caller should skip validation

  const labels = new Set();
  for (const c of skeleton.cells) {
    if (!c.slot_label) continue;
    if (c.slot_label === "LAB") {
      labels.add("LAB_MONDAY");
      labels.add("LAB_TUESDAY");
      labels.add("LAB_THURSDAY");
    } else {
      labels.add(c.slot_label);
    }
  }
  return labels;
}

// ── GET /api/v1/admin/timetable/locks?session_id= ──────────────────────────

export const getLocks = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res
        .status(400)
        .json({ success: false, message: "session_id is required" });
    }

    ```
    const locks = await SlotLock.find({ session_id })
      .populate({
        path: "assignment_id",
        populate: ["course_id", "faculty_id", "batch_ids"],
      })
      .populate("batch_ids")
      .sort({ slot_name: 1 });
    
    return res.status(200).json({ success: true, data: locks });
    ```;
  } catch (err) {
    console.error("[getLocks]", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch locks" });
  }
};

// ── POST /api/v1/admin/timetable/locks/course ──────────────────────────────
// Body: { session_id, assignment_id, slot_name }
// Upsert — an assignment locked twice just moves to the new slot_name.

export const lockCourseToSlot = async (req, res) => {
  try {
    const { session_id, assignment_id, slot_name } = req.body;
    if (!session_id || !assignment_id || !slot_name) {
      return res.status(400).json({
        success: false,
        message: "session_id, assignment_id, and slot_name are required",
      });
    }

    const assignment = await CourseAssignment.findOne({
      _id: assignment_id,
      session_id,
    });
    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, message: "Course assignment not found" });
    }

    const validLabels = await activeSkeletonLabels(session_id);
    if (validLabels && !validLabels.has(slot_name)) {
      return res.status(400).json({
        success: false,
        message: `'${slot_name}' isn't a label on the active skeleton`,
      });
    }

    const lock = await SlotLock.findOneAndUpdate(
      { session_id, assignment_id, lock_type: "course" },
      {
        session_id,
        assignment_id,
        lock_type: "course",
        slot_name,
        batch_ids: assignment.batch_ids,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return res.status(200).json({ success: true, data: lock });
  } catch (err) {
    console.error("[lockCourseToSlot]", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to lock course to slot" });
  }
};

// ── POST /api/v1/admin/timetable/locks/empty ────────────────────────────────
// Body: { session_id, slot_name, batch_ids: [...] }

export const lockSlotEmpty = async (req, res) => {
  try {
    const { session_id, slot_name, batch_ids } = req.body;
    if (
      !session_id ||
      !slot_name ||
      !Array.isArray(batch_ids) ||
      !batch_ids.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "session_id, slot_name, and a non-empty batch_ids[] are required",
      });
    }

    const validLabels = await activeSkeletonLabels(session_id);
    if (validLabels && !validLabels.has(slot_name)) {
      return res.status(400).json({
        success: false,
        message: `'${slot_name}' isn't a label on the active skeleton`,
      });
    }

    // Avoid duplicate empty-locks for the exact same (slot, batch) set.
    const existing = await SlotLock.findOne({
      session_id,
      lock_type: "empty",
      slot_name,
      batch_ids: { $all: batch_ids, $size: batch_ids.length },
    });
    if (existing) {
      return res.status(200).json({ success: true, data: existing });
    }

    const lock = await SlotLock.create({
      session_id,
      lock_type: "empty",
      slot_name,
      batch_ids,
    });

    return res.status(201).json({ success: true, data: lock });
  } catch (err) {
    console.error("[lockSlotEmpty]", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to lock slot empty" });
  }
};

// ── DELETE /api/v1/admin/timetable/locks/:lock_id ───────────────────────────

export const deleteLock = async (req, res) => {
  try {
    const { lock_id } = req.params;
    const result = await SlotLock.deleteOne({ _id: lock_id });
    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Lock not found" });
    }
    return res.status(200).json({ success: true, message: "Lock removed" });
  } catch (err) {
    console.error("[deleteLock]", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete lock" });
  }
};

// ── DELETE /api/v1/admin/timetable/locks?session_id= ────────────────────────
// Clears every lock for a session — handy "start over" escape hatch for the
// admin, exposed as a separate button in the UI (not called automatically).

export const clearLocks = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res
        .status(400)
        .json({ success: false, message: "session_id is required" });
    }
    await SlotLock.deleteMany({ session_id });
    return res
      .status(200)
      .json({ success: true, message: "All locks cleared" });
  } catch (err) {
    console.error("[clearLocks]", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to clear locks" });
  }
};
