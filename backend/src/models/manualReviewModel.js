// models/manualReviewModel.js
//
// Holds anything slot_generator.py couldn't place automatically:
//
//  - "overflow": a course (or the excess portion of a synced_with group)
//    needs MORE sessions/week than any single skeleton label can offer, OR
//    a tutorial-classified course (rule 1, always admin-discretion).
//    Admin manually assigns each excess session to any free/shared_ok cell.
//
//  - "choose_occurrences": a course (or a synced_with group member with
//    a shortfall) needs FEWER occurrences than the label it landed in
//    provides. Admin picks which N of the label's M days to actually use.
//
//  - "unplaced" (NEW): a course (or lab) got ZERO placement — no eligible
//    skeleton label had room for it at all (typically: batch has more
//    courses than the 6 regular slots can hold). Distinct from "overflow"
//    because the admin's only real option here is to squeeze it into an
//    otherwise-empty minor(G)/OE(H) period at their discretion — see
//    resolveUnplacedItem / computeMinorOeAvailability. Resolving this does
//    NOT go through the general "place anywhere free" overflow flow.
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
      enum: ["overflow", "choose_occurrences", "unplaced"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },

    // For "overflow" and "unplaced": how many sessions need manual placement.
    // For "unplaced" this is always the assignment's FULL sessions_per_week
    // (nothing got placed at all).
    sessions_needed: { type: Number, default: 0 },

    // For "choose_occurrences": the anchor label's available days, and
    // how many of them should actually be used.
    anchor_label: { type: String, default: null },
    available_days: [{ type: String }], // e.g. ["Monday", "Tuesday", "Thursday"]
    sessions_to_choose: { type: Number, default: 0 },

    // Filled in once the admin resolves the item.
    resolution: {
      // overflow: [{ day, period_index, track }]
      // unplaced: [{ day, period_index, track, slot_type }] — slot_type is
      // 'minor' or 'oe', period_index/track are resolved server-side from
      // the skeleton cell that label sits on for that day.
      placements: [
        {
          day: String,
          period_index: Number,
          track: { type: Number, default: 1 },
          slot_type: {
            type: String,
            enum: ["minor", "oe", null],
            default: null,
          },
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
