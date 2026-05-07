import express from "express";
import {
  getBacklogCourseStats,
  getRegistrationOverview,
} from "../../controllers/admin/courseRegistrationController.Admin.js";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/overview/:sessionId",
  protect,
  authorizeRoles("admin"),
  getRegistrationOverview,
);

router.get(
  "/backlog-stats/:sessionId",
  protect,
  authorizeRoles("admin"),
  getBacklogCourseStats,
);

export default router;
