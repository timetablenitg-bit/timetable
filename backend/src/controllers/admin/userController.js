import User from "../../models/userModel.js";
import mongoose from "mongoose";

// GET /api/admin/users
export const fetchUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").lean();
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

// PUT /api/admin/users/:id
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });

    const allowedRoles = ["admin", "faculty", "student"];
    if (!allowedRoles.includes(role))
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${allowedRoles.join(", ")}`,
      });

    const updated = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res
      .status(200)
      .json({ success: true, message: "User role updated", data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update role",
      error: error.message,
    });
  }
};

// POST /api/admin/users/delete/:current_sem
export const deleteUserBySemester = async (req, res) => {
  try {
    const current_sem = parseInt(req.params.current_sem);

    if (isNaN(current_sem) || current_sem < 1 || current_sem > 8)
      return res.status(400).json({
        success: false,
        message: "Semester must be a number between 1 and 8",
      });

    const result = await User.deleteMany({ current_sem, role: "student" });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} student(s) from semester ${current_sem}`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete users by semester",
      error: error.message,
    });
  }
};

// GET /api/admin/users/role/:role
export const fetchUserByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const allowedRoles = ["admin", "faculty", "student"];

    if (!allowedRoles.includes(role))
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${allowedRoles.join(", ")}`,
      });

    const users = await User.find({ role }).select("-password").lean();
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users by role",
      error: error.message,
    });
  }
};

export const deleteUsersByBatch = async (req, res) => {
  try {
    const { department, current_sem } = req.body;

    if (!department || !current_sem) {
      return res.status(400).json({
        success: false,
        message: "department and current_sem are required",
      });
    }

    const result = await User.deleteMany({
      department,
      current_sem: Number(current_sem),
      role: "student",
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} student(s) from ${department} · semester ${current_sem}`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete users by batch",
      error: error.message,
    });
  }
};
