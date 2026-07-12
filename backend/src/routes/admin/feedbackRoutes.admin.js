import express from "express";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";
import {
  getAllFeedback,
  updateFeedbackStatus,
  deleteFeedback,
} from "../../controllers/admin/feedbackController.Admin.js";

const router = express.Router();

router.use(protect, authorizeRoles("admin"));

router.get("/", getAllFeedback);
router.patch("/:id/status", updateFeedbackStatus);
router.delete("/:id", deleteFeedback);

export default router;
