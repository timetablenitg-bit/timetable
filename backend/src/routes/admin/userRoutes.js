import express from "express";
import {
  fetchUsers,
  deleteUser,
  updateUserRole,
  deleteUserBySemester,
  deleteUsersByBatch,
  fetchUserByRole,
} from "../../controllers/admin/userController.js";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, authorizeRoles("admin"), fetchUsers);
router.get("/role/:role", protect, authorizeRoles("admin"), fetchUserByRole);
router.post(
  "/delete/:current_sem",
  protect,
  authorizeRoles("admin"),
  deleteUserBySemester,
);
router.put("/:id", protect, authorizeRoles("admin"), updateUserRole);
router.delete("/:id", protect, authorizeRoles("admin"), deleteUser);
router.post(
  "/delete-batch",
  protect,
  authorizeRoles("admin"),
  deleteUsersByBatch,
);

export default router;
