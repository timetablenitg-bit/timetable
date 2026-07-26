import mongoose from "mongoose";
import { Faculty } from "../../models/facultyModel.js";
import User from "../../models/userModel.js";

export const fetchFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: faculties,
    });
  } catch (error) {
    console.error("Fetch faculties error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch faculties",
    });
  }
};

export const createFaculty = async (req, res) => {
  try {
    const { faculty_code, name, department, email } = req.body;

    if (!faculty_code || !name || !department) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const faculty = await Faculty.create({
      faculty_code,
      name,
      department,
      ...(email && { email }),
    });

    await provisionFacultyAccount(faculty);

    res.status(201).json({
      success: true,
      message: "Faculty created successfully",
      data: faculty,
    });
  } catch (error) {
    console.error("Create faculty error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Faculty with this code or email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create faculty",
    });
  }
};

export const fetchFacultyById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid faculty ID",
      });
    }

    const faculty = await Faculty.findOne({
      _id: id,
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    res.status(200).json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    console.error("Fetch faculty error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch faculty",
    });
  }
};

export const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid faculty ID",
      });
    }

    const allowedUpdates = ["faculty_code", "name", "department", "email"];
    const updates = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedFaculty = await Faculty.findOneAndUpdate(
      { _id: id },
      updates,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!updatedFaculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    await provisionFacultyAccount(updatedFaculty);

    res.status(200).json({
      success: true,
      message: "Faculty updated successfully",
      data: updatedFaculty,
    });
  } catch (error) {
    console.error("Update faculty error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Faculty with this code or email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update faculty",
    });
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid faculty ID",
      });
    }

    const deletedFaculty = await Faculty.findOneAndDelete({
      _id: id,
    });

    if (!deletedFaculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    if (deletedFaculty.email) {
      await User.deleteOne({
        email: deletedFaculty.email,
        role: "faculty",
        invite_status: { $ne: "accepted" },
      });
    }

    res.status(200).json({
      success: true,
      message: "Faculty deleted successfully",
    });
  } catch (error) {
    console.error("Delete faculty error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete faculty",
    });
  }
};

export const createFaculties = async (req, res) => {
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
      const { faculty_code, name, department, is_active, email } = row;

      if (!faculty_code || !name) {
        errors.push({
          row: index + 1,
          faculty_code: faculty_code || null,
          message: "faculty_code and name are required",
        });
        return;
      }

      validDocs.push({
        faculty_code: String(faculty_code).trim(),
        name: String(name).trim(),
        department: department || null,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
        ...(email && { email: String(email).trim() }),
      });
    });
    // console.log(validDocs);

    if (validDocs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid faculty rows found",
        errors,
      });
    }

    let insertedDocs = [];

    try {
      insertedDocs = await Faculty.insertMany(validDocs, {
        ordered: false, // continue on duplicate errors
      });
    } catch (err) {
      // Mongo still inserts valid docs
      insertedDocs = err.insertedDocs || [];
    }
    // console.log("Inserted docs:", insertedDocs);
    await Promise.all(insertedDocs.map((f) => provisionFacultyAccount(f)));

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
    console.error("Bulk faculty upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk upload faculties",
    });
  }
};
// Silently provisions/refreshes the login account for a faculty member
// once they have an email on file — no invite email needed. The account
// stays "pending" until they actually sign in with Google, at which point
// googleLogin() (unchanged) flips it to "accepted".
async function provisionFacultyAccount(faculty) {
  if (!faculty.email) return;

  const existing = await User.findOne({ email: faculty.email });

  if (!existing) {
    await User.create({
      username: faculty.name,
      email: faculty.email,
      role: "faculty",
      faculty_code: faculty.faculty_code,
      department: faculty.department,
      authProvider: "google",
      invite_status: "pending",
    });
    return;
  }

  // Only touch accounts that are already faculty-shaped, so we never
  // clobber some unrelated student/admin account that happens to share
  // this email, and never reset someone who has already joined.
  if (existing.role === "faculty" && existing.invite_status !== "accepted") {
    existing.faculty_code = faculty.faculty_code;
    existing.department = faculty.department;
    existing.invite_status = "pending";
    await existing.save();
  }
}
