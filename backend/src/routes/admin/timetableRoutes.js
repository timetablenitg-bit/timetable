// routes/timetableRoutes.js
import express from "express";

import {
  generateTimetable,
  getActiveSchedule,
  getGeneratedSlots,
} from "../../controllers/admin/timetableController.js";

import { saveAndEvaluateSchedule } from "../../controllers/admin/scheduleEditController.js";
import { setBatchTrack } from "../../controllers/admin/trackController.js";

import {
  getSkeleton,
  createOrUpdateSkeleton,
  activateSkeleton,
} from "../../controllers/admin/skeletonController.js";

import {
  getPendingReviewItems,
  resolveOverflowItem,
  resolveChooseOccurrencesItem,
  getItemAvailability,
  getMinorOeAvailability,
  resolveUnplacedItem,
} from "../../controllers/admin/manualReviewController.js";

import {
  bulkUpdateSlots,
  patchSlot,
  createSlot,
  deleteSlot,
} from "../../controllers/admin/slotEditController.js";
import { saveBatchWeek } from "../../controllers/admin/batchWeekController.js";
// import { editBatchCell } from "../../controllers/admin/batchCellEditController.js";

const router = express.Router();

// Skeleton
router.get("/skeleton", getSkeleton);
router.post("/skeleton", createOrUpdateSkeleton);
router.patch("/skeleton/:id/activate", activateSkeleton);

// Generation + reads
router.post("/generate", generateTimetable);
router.get("/schedule", getActiveSchedule);
router.get("/slots", getGeneratedSlots);

// Rework (manual grid edit + rescore, no engine spawn)
router.post("/schedule/:timetable_id/save", saveAndEvaluateSchedule);

// Track toggle (post-hoc, per-day-per-batch, no regeneration)
router.patch("/schedule/:id/track", setBatchTrack);

// Manual review queue
router.get("/manual-review", getPendingReviewItems);
router.get("/manual-review/:item_id/availability", getItemAvailability);
router.patch("/manual-review/:item_id/overflow", resolveOverflowItem);
router.patch(
  "/manual-review/:item_id/choose-occurrences",
  resolveChooseOccurrencesItem,
);
router.get(
  "/manual-review/:item_id/minor-oe-availability",
  getMinorOeAvailability,
);
router.patch("/manual-review/:item_id/unplaced", resolveUnplacedItem);

// Slot editing (unchanged)
router.put("/slots/:session_id", bulkUpdateSlots);
router.patch("/slots/:session_id/:slot_name", patchSlot);
router.post("/slots/:session_id", createSlot);
router.delete("/slots/:session_id/:slot_name", deleteSlot);

// router.patch("/schedule/:timetable_id/batch-cell", editBatchCell);
router.patch("/schedule/:timetable_id/batch-week", saveBatchWeek);

export default router;
