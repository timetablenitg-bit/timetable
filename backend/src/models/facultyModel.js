import mongoose from "mongoose";

const facultySchema = new mongoose.Schema(
  {
    faculty_code: { type: String, required: true },

    email: {
      type: String,
      unique: true,
      sparse: true,
    },

    name: { type: String, required: true },

    department: {
      type: String,
      enum: ["CSE", "CVE", "ECE", "EEE", "MCE", "APS", "HSS"],
    },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Faculty = mongoose.model("Faculty", facultySchema);
