import express from "express";
import { authorizeRoles, protect } from "../../middleware/authMiddleware.js";
import {
  createRoom,
  createRooms,
  deleteRoom,
  fetchRooms,
  getRoomById,
  updateRoom,
} from "../../controllers/admin/roomController.js";

const router = express.Router();

router.use(protect);

router.get("/", fetchRooms);
router.post("/", authorizeRoles("admin"), createRoom);
router.post("/bulk", authorizeRoles("admin"), createRooms);
router.get("/:id", getRoomById);
router.put("/:id", authorizeRoles("admin"), updateRoom);
router.delete("/:id", authorizeRoles("admin"), deleteRoom);

export default router;
