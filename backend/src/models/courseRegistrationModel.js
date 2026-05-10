import mongoose from "mongoose";

const courseRegistrationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
      required: true,
    },

    regularCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
        courseCode: String, // optional but useful snapshot
      },
    ],

    backlogCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
        courseCode: String,
      },
    ],

    status: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"],
      default: "NOT_STARTED",
    },

    submittedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Prevent duplicate registration for same student + session
courseRegistrationSchema.index({ student: 1, session: 1 }, { unique: true });

export default mongoose.model("CourseRegistration", courseRegistrationSchema);
