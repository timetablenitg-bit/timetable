import mongoose from "mongoose";

const labAssignmentSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
    },

    course_id: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },

    faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },

    batch_id: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },

    lab_room_id: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },

    lab_group: { type: String, required: true }, // A1, A2

    duration_slots: { type: Number, required: true },
  },
  { timestamps: true },
);

export const LabAssignment = mongoose.model(
  "LabAssignment",
  labAssignmentSchema,
);
