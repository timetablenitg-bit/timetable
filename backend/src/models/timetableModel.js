import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
    },

    assignment_type: {
      type: String,
      enum: ["COURSE", "LAB"],
      required: true,
    },

    assignment_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    slot_id: { type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot" },

    room_id: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },

    lab_group: String,
  },
  { timestamps: true },
);

export const Timetable = mongoose.model("Timetable", timetableSchema);
