import express from "express";
import { authorizeRoles, protect } from "../../middleware/authMiddleware.js";
import {
  createLabAssignment,
  deleteLabAssignment,
  fetchLabAssignments,
  updateLabAssignment,
} from "../../controllers/admin/labAssignmentController.js";

const router = express.Router();

router.use(protect);

router.get("/", fetchLabAssignments);
router.post("/", authorizeRoles("admin"), createLabAssignment);
router.put("/:id", authorizeRoles("admin"), updateLabAssignment);
router.delete("/:id", authorizeRoles("admin"), deleteLabAssignment);

export default router;
