import mongoose from "mongoose";
import { Room } from "../../models/roomModel.js";

export const fetchRooms = async (req, res) => {
  try {
    const { room_type } = req.query;

    const filter = {};

    if (room_type) {
      filter.room_type = room_type;
    }

    const rooms = await Room.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error("Fetch rooms error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rooms",
    });
  }
};

export const createRoom = async (req, res) => {
  try {
    const { room_code, room_type, capacity } = req.body;

    if (!room_code || !room_type) {
      return res.status(400).json({
        success: false,
        message: "room_code and room_type are required",
      });
    }

    const room = await Room.create({
      room_code,
      room_type,
      capacity,
    });

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: room,
    });
  } catch (error) {
    console.error("Create room error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Room with this code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create room",
    });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid room ID",
      });
    }

    const room = await Room.findOne({
      _id: id,
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error("Get room error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch room",
    });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid room ID",
      });
    }

    const allowedUpdates = ["room_code", "room_type", "capacity"];
    const updates = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedRoom = await Room.findOneAndUpdate({ _id: id }, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedRoom) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: updatedRoom,
    });
  } catch (error) {
    console.error("Update room error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Room with this code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update room",
    });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid room ID",
      });
    }

    const deletedRoom = await Room.findOneAndDelete({
      _id: id,
    });

    if (!deletedRoom) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("Delete room error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete room",
    });
  }
};

export const createRooms = async (req, res) => {
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
      const { room_code, room_type, capacity } = row;

      // Required fields
      if (!room_code || !room_type) {
        errors.push({
          row: index + 1,
          room_code: room_code || null,
          message: "room_code and room_type are required",
        });
        return;
      }

      // Enum validation (extra safety)
      if (!["LECTURE", "LAB"].includes(room_type)) {
        errors.push({
          row: index + 1,
          room_code,
          message: "room_type must be LECTURE or LAB",
        });
        return;
      }

      validDocs.push({
        room_code: String(room_code).trim(),
        room_type,
        capacity: capacity !== undefined ? Number(capacity) : null,
      });
    });

    if (validDocs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid room rows found",
        errors,
      });
    }

    let insertedDocs = [];

    try {
      insertedDocs = await Room.insertMany(validDocs, {
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
    console.error("Bulk room upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk upload rooms",
    });
  }
};
