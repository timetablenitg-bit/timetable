// controllers/skeletonController.js
//
// CRUD for TimetableSkeleton, plus activation. The active skeleton for a
// session is what generation reads from (via getSlotOccurrenceCount /
// getAdjacencyMap in utils/skeletonDerivation.js) and what gets stamped
// into the final grid shape.

import mongoose from "mongoose";
import { TimetableSkeleton } from "../../models/timetableSkeletonModel.js";
import { buildDefaultSkeletonCells } from "../../utils/defaultSkeletonCells.js";

// ── GET /api/v1/admin/timetable/skeleton?session_id= ───────────────────────
// Returns the active skeleton for a session. If none exists yet, seeds one
// from the legacy default layout so nothing breaks mid-migration.
export const getSkeleton = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res
        .status(400)
        .json({ success: false, message: "session_id is required" });
    }

    let skeleton = await TimetableSkeleton.findOne({
      session_id,
      is_active: true,
    });

    if (!skeleton) {
      skeleton = await TimetableSkeleton.create({
        session_id,
        is_active: true,
        cells: buildDefaultSkeletonCells(),
      });
    }

    return res.status(200).json({ success: true, data: skeleton });
  } catch (error) {
    console.error("[getSkeleton]", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch skeleton" });
  }
};

// ── POST /api/v1/admin/timetable/skeleton ───────────────────────────────────
// Body: { session_id, cells: [...] }
// Creates a new (inactive) skeleton version. Admin must call /activate
// separately to make it live — keeps edits from clobbering a working
// timetable mid-review.
export const createOrUpdateSkeleton = async (req, res) => {
  try {
    const { session_id, cells, skeleton_id } = req.body;

    if (!session_id || !Array.isArray(cells)) {
      return res.status(400).json({
        success: false,
        message: "session_id and cells[] are required",
      });
    }

    for (const c of cells) {
      if (!c.day || c.period_index === undefined || !c.track) {
        return res.status(400).json({
          success: false,
          message: "Each cell needs day, track, and period_index",
        });
      }
    }

    // Editing an existing draft
    if (skeleton_id) {
      const skeleton = await TimetableSkeleton.findOne({
        _id: skeleton_id,
        session_id,
      });
      if (!skeleton) {
        return res
          .status(404)
          .json({ success: false, message: "Skeleton not found" });
      }
      skeleton.cells = cells;
      await skeleton.save();
      return res.status(200).json({ success: true, data: skeleton });
    }

    // New draft version, not yet active
    const skeleton = await TimetableSkeleton.create({
      session_id,
      is_active: false,
      cells,
    });

    return res.status(201).json({ success: true, data: skeleton });
  } catch (error) {
    console.error("[createOrUpdateSkeleton]", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to save skeleton" });
  }
};

// ── PATCH /api/v1/admin/timetable/skeleton/:id/activate ────────────────────
export const activateSkeleton = async (req, res) => {
  try {
    const { id } = req.params;
    const skeleton = await TimetableSkeleton.findById(id);
    if (!skeleton) {
      return res
        .status(404)
        .json({ success: false, message: "Skeleton not found" });
    }

    await TimetableSkeleton.updateMany(
      { session_id: skeleton.session_id, is_active: true },
      { is_active: false },
    );
    skeleton.is_active = true;
    await skeleton.save();

    return res.status(200).json({ success: true, data: skeleton });
  } catch (error) {
    console.error("[activateSkeleton]", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to activate skeleton" });
  }
};
