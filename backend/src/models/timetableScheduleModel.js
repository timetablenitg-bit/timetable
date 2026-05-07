// models/timetableScheduleModel.js  — updated for dual-track layout
import mongoose from "mongoose";

const gridCellSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      required: true,
    },
    track: {
      type: Number,
      enum: [1, 2],
      default: 1,
    },
    period_index: { type: Number, required: true },
    time_label: { type: String },

    slot_name: { type: String },
    slot_type: {
      type: String,
      enum: ["lecture", "lab", "minor", "oe", "tutorial", "break", "free"],
      default: "free",
    },

    is_lab_anchor: { type: Boolean, default: false },
    lab_group: { type: String },
  },
  { _id: false },
);

const timetableScheduleSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: true,
    },
    generation_id: { type: mongoose.Schema.Types.ObjectId, required: true },

    score: { type: Number, required: true },
    is_active: { type: Boolean, default: false },

    // Batch names that ended up on Track 2 (have 3 labs)
    track2_batches: [{ type: String }],

    // Flat list of ALL cells (both tracks, all days).
    // Filter by { track: 1 } or { track: 2 } to split.
    grid: [gridCellSchema],

    meta: {
      total_attempts: Number,
      generation_time_ms: Number,
    },
  },
  { timestamps: true },
);

timetableScheduleSchema.index(
  { session_id: 1, is_active: 1 },
  { unique: true, partialFilterExpression: { is_active: true } },
);

export const TimetableSchedule = mongoose.model(
  "TimetableSchedule",
  timetableScheduleSchema,
);
