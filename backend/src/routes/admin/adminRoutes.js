import express from "express";
import {
  searchFacultyForAdmin,
  listAdmins,
  promoteToAdmin,
  demoteAdmin,
  getAdminLogs,
} from "../../controllers/admin/adminController.js";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("admin"));

router.get("/search-faculty", searchFacultyForAdmin);
router.get("/list", listAdmins);
router.get("/:adminId/logs", getAdminLogs);
router.post("/promote", promoteToAdmin);
router.post("/demote", demoteAdmin);

export default router;
