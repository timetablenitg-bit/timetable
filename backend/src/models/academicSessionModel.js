import mongoose from "mongoose";

const academicSessionSchema = new mongoose.Schema(
  {
    academic_year: { type: String, required: true },

    term: {
      type: String,
      enum: ["ODD", "EVEN"],
      required: true,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const AcademicSession = mongoose.model(
  "AcademicSession",
  academicSessionSchema,
);
