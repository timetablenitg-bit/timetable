import express from "express";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";
import {
  getMyRegistration,
  saveCourses,
  startRegistration,
  submitRegistration,
} from "../../controllers/student/courseRegistrationController.student.js";

const router = express.Router();

router.use(protect, authorizeRoles("student"));

router.get("/my-registration/:id", getMyRegistration);

router.post("/start", startRegistration);

router.put("/save", saveCourses);

router.post("/submit", submitRegistration);

export default router;
