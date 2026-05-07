import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    department: { type: String, required: true },

    year: { type: Number, required: true },

    semester: { type: Number, required: true },

    batch_name: { type: String, required: true },

    lecture_room_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
  },
  { timestamps: true },
);

export const Batch = mongoose.model("Batch", batchSchema);
