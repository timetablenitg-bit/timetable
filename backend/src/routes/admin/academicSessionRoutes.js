import express from "express";
import {
  createAcademicSession,
  deleteAcademicSession,
  fetchAcademicSessions,
  getAcademicSessionById,
  updateAcademicSession,
} from "../../controllers/admin/academicSessionController.js";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, authorizeRoles("admin"), fetchAcademicSessions);
router.get("/:id", protect, authorizeRoles("admin"), getAcademicSessionById);
router.post("/", protect, authorizeRoles("admin"), createAcademicSession);
router.put("/:id", protect, authorizeRoles("admin"), updateAcademicSession);
router.delete("/:id", protect, authorizeRoles("admin"), deleteAcademicSession);

export default router;
