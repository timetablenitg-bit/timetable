import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    course_code: { type: String, required: true },

    course_name: { type: String, required: true },

    semester_offered: { type: Number, min: 1, max: 8 },

    credits: { type: Number, min: 0 },

    course_type: {
      type: String,
      enum: ["THEORY", "LAB"],
    },

    department: {
      type: String,
      enum: ["CSE", "ECE", "EEE", "CVE", "MCE", "APS", "HSS"],
      required: true,
    },

    nature: {
      type: String,
      enum: ["CORE", "MINOR", "ELECTIVE", "PROJECT", "SEMINAR"],
      required: true,
    },
    is_elective_slot: { type: Boolean, default: false },
    hours: {
      lecture: { type: Number, default: 0 },
      tutorial: { type: Number, default: 0 },
      practical: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export const Course = mongoose.model("Course", courseSchema);
