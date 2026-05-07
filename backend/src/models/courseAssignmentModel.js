// import mongoose from "mongoose";

// const courseAssignmentSchema = new mongoose.Schema(
//   {
//     session_id: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "AcademicSession",
//     },

//     course_id: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },

//     faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },

//     batch_id: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },

//     backlog_batch_id: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Batch",
//       },
//     ],
//   },
//   { timestamps: true },
// );

// export const CourseAssignment = mongoose.model(
//   "CourseAssignment",
//   courseAssignmentSchema,
// );

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

    faculty_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },

    // 🔥 support single + combined batches
    batch_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
        required: true,
      },
    ],

    // regular / backlog / minor / OE
    assignment_type: {
      type: String,
      enum: ["regular", "backlog", "minor", "oe"],
      default: "regular",
    },

    // number of sessions per week (override credits)
    sessions_per_week: {
      type: Number,
    },

    // duration in hours (1 for lecture, 3 for lab)
    duration: {
      type: Number,
      default: 1,
    },

    // lecture / lab / tutorial
    component_type: {
      type: String,
      enum: ["lecture", "lab", "tutorial"],
      default: "lecture",
    },

    // explicitly mark combined classes
    is_combined: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const CourseAssignment = mongoose.model(
  "CourseAssignment",
  courseAssignmentSchema,
);
