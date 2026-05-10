// timetableRoutes.js
import express from "express";
import {
  generateTimetable,
  evaluateTimetable,
  getGeneratedSlots,
  getActiveSchedule,
  reworkTimetable,
} from "../../controllers/admin/timetableController.js";
import {
  bulkUpdateSlots,
  createSlot,
  deleteSlot,
  patchSlot,
} from "../../controllers/admin/slotController.js";
import {
  saveAndEvaluate,
  saveScheduleGrid,
} from "../../controllers/admin/scheduleController.js";

const router = express.Router();

router.get("/generate", generateTimetable);
router.post("/evaluate", evaluateTimetable);
router.get("/slots", getGeneratedSlots); // ← new
router.get("/schedule", getActiveSchedule); // ← new
router.post("/rework", reworkTimetable); // ← new

// Bulk replace all (non-LAB) slots for a session
router.put("/slots/:session_id", bulkUpdateSlots);

// Create a new slot
router.post("/slots/:session_id", createSlot);

// Patch a single slot (rename, update entries, change type)
router.patch("/slots/:session_id/:slot_name", patchSlot);

// Delete a single slot
router.delete("/slots/:session_id/:slot_name", deleteSlot);

// Save grid only (no re-scoring)
router.put("/schedule/:timetable_id", saveScheduleGrid);

// Save grid + re-evaluate score
router.post("/schedule/:timetable_id/evaluate", saveAndEvaluate);

export default router;
