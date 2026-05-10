// models/generatedSlotModel.js
// Stores the slot groups (A, B, C...) from one generation run
import mongoose from "mongoose";

const slotEntrySchema = new mongoose.Schema(
  {
    assignment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseAssignment",
    },
    course_code: String,
    faculty_code: String,
    faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
    batch_names: [String],
    batch_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Batch" }],
    component_type: {
      type: String,
      enum: ["lecture", "lab", "tutorial", "minor", "oe"],
      default: "lecture",
    },
  },
  { _id: false },
);

const generatedSlotSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: true,
    },

    // Groups ALL slots from one generation run together
    generation_id: { type: mongoose.Schema.Types.ObjectId, required: true },

    slot_name: { type: String, required: true }, // "A", "B", "G", "H", "LAB1"

    slot_type: {
      type: String,
      enum: ["lecture", "lab", "minor", "oe", "tutorial"],
      default: "lecture",
    },

    entries: [slotEntrySchema],
  },
  { timestamps: true },
);

export const GeneratedSlot = mongoose.model(
  "GeneratedSlot",
  generatedSlotSchema,
);
