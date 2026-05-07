import mongoose from "mongoose";
import { TimeSlot } from "../../models/timeslotModel.js";

export const fetchTimeSlots = async (req, res) => {
  try {
    const slots = await TimeSlot.find().sort({ day: 1, start_time: 1 });

    res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error) {
    console.error("Fetch time slots error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch time slots",
    });
  }
};

export const createTimeSlot = async (req, res) => {
  try {
    const { day, start_time, end_time } = req.body;

    if (!day || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: "day, start_time and end_time are required",
      });
    }

    // Optional: basic sanity check
    if (start_time >= end_time) {
      return res.status(400).json({
        success: false,
        message: "start_time must be before end_time",
      });
    }

    const slot = await TimeSlot.create({
      day,
      start_time,
      end_time,
    });

    res.status(201).json({
      success: true,
      message: "Time slot created successfully",
      data: slot,
    });
  } catch (error) {
    console.error("Create time slot error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This time slot already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create time slot",
    });
  }
};

export const updateTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time slot ID",
      });
    }

    const allowedUpdates = ["day", "start_time", "end_time"];
    const updates = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (
      updates.start_time &&
      updates.end_time &&
      updates.start_time >= updates.end_time
    ) {
      return res.status(400).json({
        success: false,
        message: "start_time must be before end_time",
      });
    }

    const updatedSlot = await TimeSlot.findOneAndUpdate({ _id: id }, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedSlot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Time slot updated successfully",
      data: updatedSlot,
    });
  } catch (error) {
    console.error("Update time slot error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This time slot already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update time slot",
    });
  }
};

export const deleteTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time slot ID",
      });
    }

    const deletedSlot = await TimeSlot.findOneAndDelete({
      _id: id,
    });

    if (!deletedSlot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Time slot deleted successfully",
    });
  } catch (error) {
    console.error("Delete time slot error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete time slot",
    });
  }
};

export const createTimeSlots = async (req, res) => {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "rows must be a non-empty array",
      });
    }

    const validDocs = [];
    const errors = [];

    rows.forEach((row, index) => {
      const { day, start_time, end_time } = row;

      // Required fields
      if (!day || !start_time || !end_time) {
        errors.push({
          row: index + 1,
          message: "day, start_time and end_time are required",
        });
        return;
      }

      // Enum validation
      if (!["MON", "TUE", "WED", "THU", "FRI", "SAT"].includes(day)) {
        errors.push({
          row: index + 1,
          message: "Invalid day value",
        });
        return;
      }

      // Time sanity check
      if (start_time >= end_time) {
        errors.push({
          row: index + 1,
          message: "start_time must be before end_time",
        });
        return;
      }

      validDocs.push({
        day,
        start_time,
        end_time,
      });
    });

    if (validDocs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid time slot rows found",
        errors,
      });
    }

    let insertedDocs = [];

    try {
      insertedDocs = await TimeSlot.insertMany(validDocs, {
        ordered: false, // continue even if duplicates exist
      });
    } catch (err) {
      // Mongo still inserts valid docs
      insertedDocs = err.insertedDocs || [];
    }

    res.status(201).json({
      success: true,
      summary: {
        total_received: rows.length,
        inserted: insertedDocs.length,
        skipped: rows.length - insertedDocs.length,
        errors: errors.length,
      },
      errors,
      data: insertedDocs,
    });
  } catch (error) {
    console.error("Bulk time slot upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk upload time slots",
    });
  }
};
