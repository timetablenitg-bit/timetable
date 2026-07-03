import mongoose from "mongoose";

const courseAssignmentSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: true,
    },

    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    elective_slot_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },

    faculty_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },

    // 🔥 support single + combined batches
    batch_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
        required: true,
      },
    ],

    // regular / backlog / minor / OE
    assignment_type: {
      type: String,
      enum: ["regular", "backlog", "minor", "oe"],
      default: "regular",
    },

    // number of sessions per week (override credits)
    sessions_per_week: {
      type: Number,
    },

    // duration in hours (1 for lecture, 3 for lab)
    duration: {
      type: Number,
      default: 1,
    },

    // lecture / lab / tutorial
    component_type: {
      type: String,
      enum: ["lecture", "lab", "tutorial"],
      default: "lecture",
    },

    // 🔥 NEW: other courses (lab component) that share the SAME physical lab room
    // as this assignment's course. Engine should never place these on the same
    // day, or the same track-slot, for the given session.
    // Only meaningful when component_type === "lab".
    shared_lab_with: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    // 🔥 NEW: other CourseAssignment docs that must be scheduled in the
    // exact same slot as this one (admin-forced sync, independent of batches).
    // Symmetric — if A.synced_with includes B, B.synced_with should include A.
    synced_with: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CourseAssignment",
      },
    ],
  },
  { timestamps: true },
);

export const CourseAssignment = mongoose.model(
  "CourseAssignment",
  courseAssignmentSchema,
);
