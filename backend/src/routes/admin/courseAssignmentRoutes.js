import express from "express";
import {
  bulkUpsertCourseAssignments,
  createCourseAssignment,
  deleteCourseAssignment,
  fetchCourseAssignments,
  updateCourseAssignment,
} from "../../controllers/admin/courseAssignmentController.js";
import { authorizeRoles, protect } from "../../middleware/authMiddleware.js";
const router = express.Router();

router.use(protect);

router.get("/", fetchCourseAssignments);
router.post("/", authorizeRoles("admin"), createCourseAssignment);
router.post(
  "/bulk",
  protect,
  authorizeRoles("admin"),
  bulkUpsertCourseAssignments,
);
router.put("/:id", authorizeRoles("admin"), updateCourseAssignment);
router.delete("/:id", authorizeRoles("admin"), deleteCourseAssignment);

export default router;
