import express from "express";
import {
  createFaculties,
  createFaculty,
  deleteFaculty,
  fetchFaculties,
  fetchFacultyById,
  updateFaculty,
} from "../../controllers/admin/facultyController.js";
import { authorizeRoles, protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", fetchFaculties);

router.post("/", authorizeRoles("admin"), createFaculty);

router.post("/bulk", authorizeRoles("admin"), createFaculties);

router.get("/:id", fetchFacultyById);

router.put("/:id", authorizeRoles("admin"), updateFaculty);

router.delete("/:id", authorizeRoles("admin"), deleteFaculty);

export default router;
