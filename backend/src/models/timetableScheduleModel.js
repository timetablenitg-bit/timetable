// models/timetableScheduleModel.js
//
// Stores the final flattened grid per generation run.
//
// IMPORTANT: "track" on a grid cell describes the skeleton ARRANGEMENT
// (lab-first vs classes-first) for that day, not a batch-permanent fact.
// Which arrangement a given batch actually follows on a given day is a
// separate, admin-controlled projection — see track_assignments below
// and utils/resolveBatchTrack.js. The engine no longer decides this at
// generation time (no more lab_count >= 3 heuristic, no track2_batches).

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
  },
  { _id: false },
);

// A per-day, per-batch admin choice of which arrangement (track) that
// batch should be viewed/printed under. Only meaningful for Monday /
// Tuesday / Thursday, since those are the only days with a track 2.
// Purely a display projection — it never triggers regeneration or
// rescoring (decision #6).
const trackAssignmentSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Thursday"],
      required: true,
    },
    batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    track: { type: Number, enum: [1, 2], default: 1 },
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

    // Flat list of ALL cells (both tracks, all days).
    grid: [gridCellSchema],

    // Admin-controlled per-batch track projection. Defaults to track 1
    // for any (day, batch) not present here — see resolveBatchTrack.
    track_assignments: [trackAssignmentSchema],

    // What the engine suggested at generation time, purely informational.
    // Never auto-applied to track_assignments.
    suggested_track_assignments: [trackAssignmentSchema],

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
