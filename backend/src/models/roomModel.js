import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    room_code: { type: String, required: true },

    building_name: { type: String, required: true, default: "Gyan Mandir" },

    room_type: { type: String, enum: ["LECTURE", "LAB"], required: true },

    capacity: { type: Number },
  },
  { timestamps: true },
);

export const Room = mongoose.model("Room", roomSchema);
