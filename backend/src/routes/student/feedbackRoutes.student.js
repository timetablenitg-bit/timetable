import express from "express";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";
import {
  submitFeedback,
  getMyFeedback,
} from "../../controllers/student/feedbackController.student.js";

const router = express.Router();

router.use(protect, authorizeRoles("student"));

router.post("/", submitFeedback);
router.get("/my-feedback", getMyFeedback);

export default router;
