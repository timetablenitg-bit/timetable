import express from "express";
import { authorizeRoles, protect } from "../../middleware/authMiddleware.js";
import {
  createCourse,
  createCourses,
  deleteCourse,
  editCourse,
  fetchCourses,
  fetchCoursesBySemAndDepartment,
} from "../../controllers/admin/courseController.js";

const router = express.Router();

router.use(protect);

router.get("/", fetchCourses);
router.get("/filter", fetchCoursesBySemAndDepartment);
router.post("/", authorizeRoles("admin"), createCourse);
router.post("/bulk", authorizeRoles("admin"), createCourses);
router.put("/:id", authorizeRoles("admin"), editCourse);
router.delete("/:id", authorizeRoles("admin"), deleteCourse);

export default router;
