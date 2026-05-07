import express from "express";
import { authorizeRoles, protect } from "../../middleware/authMiddleware.js";
import {
  createTimeSlot,
  createTimeSlots,
  deleteTimeSlot,
  fetchTimeSlots,
  updateTimeSlot,
} from "../../controllers/admin/timeslotController.js";

const router = express.Router();

router.use(protect);

router.get("/", fetchTimeSlots);
router.post("/", authorizeRoles("admin"), createTimeSlot);
router.post("/bulk", authorizeRoles("admin"), createTimeSlots);
router.put("/:id", authorizeRoles("admin"), updateTimeSlot);
router.delete("/:id", authorizeRoles("admin"), deleteTimeSlot);

export default router;
