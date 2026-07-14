import User from "../../models/userModel.js";
import { AdminLog } from "../../models/adminLogModel.js";
import { logAdminAction } from "../../utils/adminLog.js";

// GET /api/admin/search-faculty?q=
export const searchFacultyForAdmin = async (req, res) => {
  try {
    const { q = "" } = req.query;
    const regex = new RegExp(q, "i");

    const faculties = await User.find({
      role: "faculty",
      invite_status: "accepted",
      email: { $exists: true, $ne: null, $regex: /@nitgoa\.ac\.in$/i },
      $or: [{ username: regex }, { email: regex }, { faculty_code: regex }],
    }).select("username email faculty_code department invite_status");

    res.status(200).json({ success: true, faculties });
  } catch (err) {
    console.error("searchFacultyForAdmin error:", err);
    res.status(500).json({ success: false, message: "Search failed" });
  }
};

// GET /api/admin/list
export const listAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select(
      "username email faculty_code department createdAt",
    );
    res.status(200).json({ success: true, admins });
  } catch (err) {
    console.error("listAdmins error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch admins" });
  }
};

// POST /api/admin/promote  Body: { userId }
export const promoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    const adminId = req.user.id;

    const target = await User.findById(userId);
    if (!target) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (target.role !== "faculty") {
      return res.status(400).json({
        success: false,
        message: "Only faculty accounts can be promoted to admin",
      });
    }

    if (!target.email?.toLowerCase().endsWith("@nitgoa.ac.in")) {
      return res.status(400).json({
        success: false,
        message: "Faculty email must be a valid nitgoa.ac.in address",
      });
    }

    target.role = "admin";
    await target.save();

    await logAdminAction({
      admin: adminId,
      action: "PROMOTE_TO_ADMIN",
      target: target._id,
      details: { previousRole: "faculty", email: target.email },
    });

    res.status(200).json({
      success: true,
      message: "Faculty promoted to admin",
      user: target,
    });
  } catch (err) {
    console.error("promoteToAdmin error:", err);
    res.status(500).json({ success: false, message: "Promotion failed" });
  }
};

// POST /api/admin/demote  Body: { userId }
export const demoteAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    const adminId = req.user.id;

    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        message: "You cannot remove your own admin access",
      });
    }

    const target = await User.findById(userId);
    if (!target || target.role !== "admin") {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove the last remaining admin",
      });
    }

    target.role = "faculty"; // they were faculty before being promoted
    await target.save();

    await logAdminAction({
      admin: adminId,
      action: "DEMOTE_ADMIN",
      target: target._id,
      details: { newRole: "faculty", email: target.email },
    });

    res
      .status(200)
      .json({ success: true, message: "Admin access removed", user: target });
  } catch (err) {
    console.error("demoteAdmin error:", err);
    res.status(500).json({ success: false, message: "Demotion failed" });
  }
};

// GET /api/admin/:adminId/logs
export const getAdminLogs = async (req, res) => {
  try {
    const { adminId } = req.params;
    const logs = await AdminLog.find({ admin: adminId })
      .sort({ createdAt: -1 })
      .populate("target", "username email")
      .limit(100);

    res.status(200).json({ success: true, logs });
  } catch (err) {
    console.error("getAdminLogs error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch logs" });
  }
};
