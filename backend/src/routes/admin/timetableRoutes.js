// timetableRoutes.js
import express from "express";
import {
  generateTimetable,
  evaluateTimetable,
  getGeneratedSlots,
  getActiveSchedule,
  reworkTimetable,
} from "../../controllers/admin/timetableController.js";

const router = express.Router();

router.get("/generate", generateTimetable);
router.post("/evaluate", evaluateTimetable);
router.get("/slots", getGeneratedSlots); // ← new
router.get("/schedule", getActiveSchedule); // ← new
router.post("/rework", reworkTimetable); // ← new

export default router;
