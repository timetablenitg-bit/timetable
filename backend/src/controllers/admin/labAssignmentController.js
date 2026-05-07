import mongoose from "mongoose";
import { LabAssignment } from "../../models/labAssignmentModel.js";

export const fetchLabAssignments = async (req, res) => {
  try {
    const { session_id, batch_id, faculty_id } = req.query;

    const filter = {};

    if (session_id) filter.session_id = session_id;
    if (batch_id) filter.batch_id = batch_id;
    if (faculty_id) filter.faculty_id = faculty_id;

    const assignments = await LabAssignment.find(filter)
      .populate("session_id", "academic_year term")
      .populate("course_id", "course_code course_name")
      .populate("faculty_id", "name faculty_code")
      .populate("batch_id", "batch_name")
      .populate("lab_room_id", "room_name room_number")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error("Fetch lab assignments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch lab assignments",
    });
  }
};

export const createLabAssignment = async (req, res) => {
  try {
    const {
      session_id,
      course_id,
      faculty_id,
      batch_id,
      lab_room_id,
      lab_group,
      duration_slots,
    } = req.body;

    // Required fields
    if (
      !session_id ||
      !course_id ||
      !faculty_id ||
      !batch_id ||
      !lab_group ||
      !duration_slots
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const assignment = await LabAssignment.create({
      session_id,
      course_id,
      faculty_id,
      batch_id,
      lab_room_id: lab_room_id || null,
      lab_group,
      duration_slots,
    });

    res.status(201).json({
      success: true,
      message: "Lab assigned successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Create lab assignment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create lab assignment",
    });
  }
};

export const updateLabAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lab assignment ID",
      });
    }

    const allowedUpdates = [
      "faculty_id",
      "lab_room_id",
      "lab_group",
      "duration_slots",
    ];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedAssignment = await LabAssignment.findOneAndUpdate(
      { _id: id },
      updates,
      { new: true, runValidators: true },
    );

    if (!updatedAssignment) {
      return res.status(404).json({
        success: false,
        message: "Lab assignment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Lab assignment updated successfully",
      data: updatedAssignment,
    });
  } catch (error) {
    console.error("Update lab assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update lab assignment",
    });
  }
};

export const deleteLabAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lab assignment ID",
      });
    }

    const deletedAssignment = await LabAssignment.findOneAndDelete({
      _id: id,
    });

    if (!deletedAssignment) {
      return res.status(404).json({
        success: false,
        message: "Lab assignment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Lab assignment deleted successfully",
    });
  } catch (error) {
    console.error("Delete lab assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete lab assignment",
    });
  }
};
