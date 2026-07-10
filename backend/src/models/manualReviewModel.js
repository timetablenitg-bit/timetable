// models/manualReviewModel.js
//
// Holds anything slot_generator.py couldn't place automatically:
//
//  - "overflow": a course (or the excess portion of a synced_with group)
//    needs MORE sessions/week than any single skeleton label can offer.
//    Admin manually assigns each excess session to a specific day/period.
//
//  - "choose_occurrences": a course (or a synced_with group member with
//    a shortfall) needs FEWER occurrences than the label it landed in
//    provides. Admin picks which N of the label's M days to actually use.
//
// One document per generation run per assignment (a single
// CourseAssignment could in principle have both an overflow portion and
// a choose_occurrences portion if it's a sync-group member, so review
// items are scoped per assignment_id + kind, not one per assignment).

import mongoose from "mongoose";

const manualReviewItemSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: true,
    },
    generation_id: { type: mongoose.Schema.Types.ObjectId, required: true },

    assignment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseAssignment",
      required: true,
    },

    kind: {
      type: String,
      enum: ["overflow", "choose_occurrences"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },

    // For "overflow": how many extra sessions need manual placement.
    sessions_needed: { type: Number, default: 0 },

    // For "choose_occurrences": the anchor label's available days, and
    // how many of them should actually be used.
    anchor_label: { type: String, default: null },
    available_days: [{ type: String }], // e.g. ["Monday", "Tuesday", "Thursday"]
    sessions_to_choose: { type: Number, default: 0 },

    // Filled in once the admin resolves the item.
    resolution: {
      // overflow: [{ day, period_index, track }]
      placements: [
        {
          day: String,
          period_index: Number,
          track: { type: Number, default: 1 },
        },
      ],
      // choose_occurrences: which of available_days were kept
      chosen_days: [{ type: String }],
    },

    // Human-readable context for the admin UI, filled by the engine.
    reason: { type: String, default: "" },
  },
  { timestamps: true },
);

export const ManualReviewItem = mongoose.model(
  "ManualReviewItem",
  manualReviewItemSchema,
);
