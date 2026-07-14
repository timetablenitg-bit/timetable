import { AdminLog } from "../models/adminLogModel.js";

export const logAdminAction = async ({
  admin,
  action,
  target = null,
  details = {},
}) => {
  try {
    await AdminLog.create({ admin, action, target, details });
  } catch (err) {
    // Never let logging failures break the actual admin action
    console.error("Failed to write admin log:", err);
  }
};
