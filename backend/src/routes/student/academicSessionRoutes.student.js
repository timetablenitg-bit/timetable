import express from "express";
import { fetchAcademicSessions } from "../../controllers/admin/academicSessionController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, fetchAcademicSessions);

export default router;
