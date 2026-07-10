// controllers/trackController.js
//
// Track is purely a per-batch DISPLAY projection chosen by the admin
// after generation (decision #2, #6) — never a placement fact, never
// decided by the engine. This endpoint just upserts into
// TimetableSchedule.track_assignments. No regeneration, no rescoring.

import { TimetableSchedule } from "../../models/timetableScheduleModel.js";

const TOGGLE_DAYS = new Set(["Monday", "Tuesday"]);

// ── PATCH /api/v1/admin/timetable/schedule/:id/track ────────────────────────
// Body: { day, batch_id, track }

export const setBatchTrack = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, batch_id, track } = req.body;

    if (!day || !batch_id || ![1, 2].includes(Number(track))) {
      return res.status(400).json({
        success: false,
        message: "day, batch_id, and track (1 or 2) are required",
      });
    }

    if (!TOGGLE_DAYS.has(day)) {
      return res.status(400).json({
        success: false,
        message: `${day} has no track 2 — only Monday, Tuesday, and Thursday can be toggled`,
      });
    }

    const schedule = await TimetableSchedule.findById(id);
    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, message: "Timetable not found" });
    }

    const existing = schedule.track_assignments.find(
      (t) => t.day === day && String(t.batch_id) === String(batch_id),
    );

    if (existing) {
      existing.track = Number(track);
    } else {
      schedule.track_assignments.push({ day, batch_id, track: Number(track) });
    }

    await schedule.save();

    return res.status(200).json({
      success: true,
      message: "Track assignment updated",
      data: { track_assignments: schedule.track_assignments },
    });
  } catch (err) {
    console.error("[setBatchTrack]", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
