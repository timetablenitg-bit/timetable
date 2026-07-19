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

    // 🔥 NEW — case 3 (drop). Carried straight through from the engine's
    // per-entry drop_course_id (see slot_generator.py _make_entry). When
    // set, this entry's batch is understood to have dropped the
    // CourseAssignment this id points at, which is WHY the two entries are
    // allowed to sit in the same bucket together. Without persisting this,
    // the frontend had no way to tell "co-located on purpose because of an
    // explicit drop" apart from any other reason two entries might land in
    // the same slot_name, so it silently picked one and hid the other.
    drop_course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseAssignment",
      default: null,
    },

    // 🔥 NEW — case 4 (parallel). One id shared by every entry the engine
    // placed together as a single parallel_with unit (see
    // slot_generator.py _place_parallel_unit). Entries with the same
    // parallel_group_id landed in this slot_name together deliberately —
    // same reasoning as drop_course_id above: needed so the frontend can
    // render them as a shared cell instead of picking just one.
    parallel_group_id: {
      type: String,
      default: null,
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

    slot_name: { type: String, required: true }, // "A", "B", "G", "H", "LAB_MONDAY"

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
