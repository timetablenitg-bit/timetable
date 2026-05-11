import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "faculty", "student"],
      default: "student",
    },

    // ---- FACULTY-ONLY FIELDS ----
    faculty_code: {
      type: String,
      unique: true,
      sparse: true,
    },

    // ---- STUDENT-ONLY FIELDS ----
    student_code: {
      type: String,
      unique: true,
      sparse: true,
    },

    current_sem: {
      type: Number,
      min: 1,
      max: 8,
    },

    year: {
      type: Number,
      min: 1,
      max: 4,
    },

    // selected_courses: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Course",
    //   },
    // ],

    department: {
      type: String,
      enum: ["CSE", "ECE", "EEE", "MCE", "APS", "HSS"],
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // ---- INVITE FLOW ----
    invite_status: {
      type: String,
      enum: ["uninvited", "pending", "accepted"],
      default: "uninvited",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    profilePicture: {
      type: String,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
