// models/timetableSkeletonModel.js
//
// Replaces the hardcoded TEMPLATE dict that used to live in
// python_engine/timetable_generator.py. The skeleton is now DB-backed,
// editable via skeletonController, and the *active* one is what gets
// passed into the Python engine on every generation run.
//
// track 2 only exists for Monday / Tuesday / Thursday (lab days). It is
// a second possible *arrangement* for the same day, not a second day.
// Wednesday / Friday only ever have track 1.

import mongoose from "mongoose";

const skeletonCellSchema = new mongoose.Schema(
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
    period_index: { type: Number, required: true }, // 0-7
    time_label: { type: String },

    // "A".."F", "G" (minor), "H" (oe), "TUT", "1-CREDIT", "LAB",
    // "BREAK"/"LUNCH", or null for an intentionally empty cell.
    slot_label: { type: String, default: null },
  },
  { _id: false },
);

const timetableSkeletonSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: true,
    },
    is_active: { type: Boolean, default: false },
    cells: [skeletonCellSchema],
  },
  { timestamps: true },
);

// Only one active skeleton per session at a time.
timetableSkeletonSchema.index(
  { session_id: 1, is_active: 1 },
  { unique: true, partialFilterExpression: { is_active: true } },
);

export const TimetableSkeleton = mongoose.model(
  "TimetableSkeleton",
  timetableSkeletonSchema,
);
