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

    // 🔥 NEW — case 3 (>2 backlogs, student has to drop a current-sem
    // course). Points at the batch's OWN current-sem CourseAssignment that
    // these backlog students are expected to drop. One-directional by
    // design: many backlog rows can point at the same dropped course, so
    // there's no single back-link slot to store on the dropped side. The
    // frontend computes the reverse view by filtering allAssignments for
    // drop_course_id === thisId. Only meaningful when
    // assignment_type === "backlog".
    drop_course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseAssignment",
      default: null,
    },

    // 🔥 NEW — case 4 (disjoint backlog groups sharing a slot, e.g. Maths
    // backlog + Chem backlog run at the same time because no student has
    // both). Symmetric like synced_with, but semantically different:
    // synced_with COMBINES two sessions into one class; parallel_with keeps
    // them as separate sessions/faculty that are just allowed to occupy the
    // SAME timeslot. Only meaningful when assignment_type === "backlog".
    parallel_with: [
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
