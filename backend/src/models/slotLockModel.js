// models/slotLockModel.js
//
// A lock is an admin decision made in the slot editor that survives a
// "Regenerate Timetable" click. Two kinds:
//
//   "course" — pin one CourseAssignment (all its batches, together) to a
//               specific slot label. e.g. lock MA150/Section A to slot "B".
//               An assignment can only be locked to one slot at a time.
//
//   "empty"  — keep a slot label clear of specific batches. Nothing for
//               those batches will be auto-placed there on regeneration.
//               Not tied to any one assignment.
//
// Locks are NOT scoped to a generation_id on purpose — they're meant to
// persist across regenerations. They only get consumed/read at generation
// time (see timetableController.js::generateTimetable) and are otherwise
// independent of whatever GeneratedSlot/TimetableSchedule docs currently
// exist.

import mongoose from "mongoose";

const slotLockSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: true,
    },

    lock_type: {
      type: String,
      enum: ["course", "empty"],
      required: true,
    },

    // Required for "course" locks. Null for "empty" locks.
    assignment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseAssignment",
      default: null,
    },

    // Target skeleton label, e.g. "A".."H", "TUT", "1-CREDIT",
    // or "LAB_MONDAY" / "LAB_TUESDAY" / "LAB_THURSDAY" for lab locks.
    slot_name: { type: String, required: true },

    // "course" lock: cached copy of the assignment's batch_ids at lock time
    //   (informational — lets the UI render without populating).
    // "empty" lock: the batches this slot must stay clear of. Required.
    batch_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Batch" }],
  },
  { timestamps: true },
);

// One active course-lock per assignment.
slotLockSchema.index(
  { session_id: 1, assignment_id: 1 },
  { unique: true, partialFilterExpression: { lock_type: "course" } },
);

slotLockSchema.index({ session_id: 1, lock_type: 1, slot_name: 1 });

export const SlotLock = mongoose.model("SlotLock", slotLockSchema);
