import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
      required: true,
    },

    start_time: { type: String, required: true },

    end_time: { type: String, required: true },
  },
  { timestamps: true },
);

export const TimeSlot = mongoose.model("TimeSlot", timeSlotSchema);
