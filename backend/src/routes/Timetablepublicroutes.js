// routes/timetablePublicRoutes.js
// Timetable endpoints accessible to any authenticated user (student or faculty).
// Mount this OUTSIDE the /admin prefix, e.g. in your main router:
//   app.use("/api/v1/timetable", protect, timetablePublicRoutes);

import express from "express";
import {
  getActiveTimetableSession,
  getPublicSchedule,
  getPublicSlots,
} from "../controllers/Publictimetablecontroller.js";

const router = express.Router();

// GET /api/v1/timetable/active-session
// Returns the currently active AcademicSession (_id, term, year)
router.get("/active-session", getActiveTimetableSession);

// GET /api/v1/timetable/schedule?session_id=<id>
// Returns the active schedule grid (dual-track shape)
router.get("/schedule", getPublicSchedule);

// GET /api/v1/timetable/slots?session_id=<id>
// Returns slot assignments for the active schedule
router.get("/slots", getPublicSlots);

export default router;
