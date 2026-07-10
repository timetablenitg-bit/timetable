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

    batch_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
        required: true,
      },
    ],

    assignment_type: {
      type: String,
      enum: ["regular", "backlog", "minor", "oe"],
      default: "regular",
    },

    sessions_per_week: {
      type: Number,
    },

    duration: {
      type: Number,
      default: 1,
    },

    component_type: {
      type: String,
      enum: ["lecture", "lab", "tutorial"],
      default: "lecture",
    },

    // No room_id anywhere (decision #1) — this only governs whether two
    // lab entries are ALLOWED to occupy the same lab block together.
    shared_lab_with: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CourseAssignment",
      },
    ],

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
