import mongoose from "mongoose";
import { CourseAssignment } from "../../models/courseAssignmentModel.js";
import { Course } from "../../models/courseModel.js";

export const fetchCourseAssignments = async (req, res) => {
  try {
    const { session_id, batch_id, faculty_id } = req.query;

    const filter = {};

    if (session_id) filter.session_id = session_id;

    // 🔥 batch filter now works on array
    if (batch_id) filter.batch_ids = { $in: [batch_id] };

    if (faculty_id) filter.faculty_id = faculty_id;

    const assignments = await CourseAssignment.find(filter)
      .populate("session_id", "academic_year term")
      .populate("course_id", "course_code course_name credits")
      .populate("faculty_id", "name email faculty_code")
      .populate("batch_ids", "batch_name")
      .populate("elective_slot_id", "course_code course_name")
      .populate("shared_lab_with", "course_code course_name")
      .populate({
        path: "synced_with",
        select: "course_id batch_ids",
        populate: [
          { path: "course_id", select: "course_code course_name" },
          { path: "batch_ids", select: "batch_name" },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error("Fetch course assignments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch course assignments",
    });
  }
};

export const createCourseAssignment = async (req, res) => {
  try {
    const {
      session_id,
      course_id,
      faculty_id,
      batch_ids,
      assignment_type,
      sessions_per_week,
      duration,
      component_type,
      shared_lab_with,
      synced_with,
    } = req.body;

    // ✅ Required fields
    if (
      !session_id ||
      !course_id ||
      !faculty_id ||
      !batch_ids ||
      batch_ids.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // 🔥 shared_lab_with only makes sense for labs
    if (shared_lab_with?.length && component_type !== "lab") {
      return res.status(400).json({
        success: false,
        message: "shared_lab_with can only be set on lab components",
      });
    }

    let finalSessionsPerWeek = sessions_per_week;

    if (finalSessionsPerWeek === undefined || finalSessionsPerWeek === null) {
      const course = await Course.findById(course_id);
      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }
      finalSessionsPerWeek = course.credits; // Default to credits
    }

    const assignment = await CourseAssignment.create({
      session_id,
      course_id,
      faculty_id,
      batch_ids,
      assignment_type,
      sessions_per_week: finalSessionsPerWeek,
      duration,
      component_type,
      shared_lab_with: shared_lab_with || [],
      synced_with: synced_with || [],
    });

    // 🔥 keep synced_with symmetric — back-link this assignment on its peers
    if (synced_with?.length) {
      await CourseAssignment.updateMany(
        { _id: { $in: synced_with } },
        { $addToSet: { synced_with: assignment._id } },
      );
    }

    res.status(201).json({
      success: true,
      message: "Course assigned successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Create course assignment error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate course assignment",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create course assignment",
    });
  }
};

export const updateCourseAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    // 🔥 allow updating all relevant scheduling fields
    const allowedUpdates = [
      "faculty_id",
      "batch_ids",
      "assignment_type",
      "sessions_per_week",
      "duration",
      "component_type",
      "shared_lab_with",
      "synced_with",
    ];

    const updates = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const existing = await CourseAssignment.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Course assignment not found",
      });
    }

    if (
      updates.shared_lab_with?.length &&
      (updates.component_type ?? existing.component_type) !== "lab"
    ) {
      return res.status(400).json({
        success: false,
        message: "shared_lab_with can only be set on lab components",
      });
    }

    const updatedAssignment = await CourseAssignment.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true },
    );

    // 🔥 reconcile symmetric synced_with links if that field changed
    if (updates.synced_with !== undefined) {
      const before = existing.synced_with.map((x) => String(x));
      const after = updates.synced_with.map((x) => String(x));

      const removed = before.filter((x) => !after.includes(x));
      const added = after.filter((x) => !before.includes(x));

      if (removed.length) {
        await CourseAssignment.updateMany(
          { _id: { $in: removed } },
          { $pull: { synced_with: id } },
        );
      }
      if (added.length) {
        await CourseAssignment.updateMany(
          { _id: { $in: added } },
          { $addToSet: { synced_with: id } },
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Course assignment updated successfully",
      data: updatedAssignment,
    });
  } catch (error) {
    console.error("Update course assignment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update course assignment",
    });
  }
};

export const deleteCourseAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const deletedAssignment = await CourseAssignment.findByIdAndDelete(id);

    if (!deletedAssignment) {
      return res.status(404).json({
        success: false,
        message: "Course assignment not found",
      });
    }

    // 🔥 clean up any symmetric synced_with links pointing at the deleted doc
    await CourseAssignment.updateMany(
      { synced_with: id },
      { $pull: { synced_with: id } },
    );

    res.status(200).json({
      success: true,
      message: "Course assignment deleted successfully",
    });
  } catch (error) {
    console.error("Delete course assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete course assignment",
    });
  }
};

export const bulkUpsertCourseAssignments = async (req, res) => {
  try {
    const { assignments } = req.body;

    if (
      !assignments ||
      !Array.isArray(assignments) ||
      assignments.length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Assignments array is required" });
    }

    // 🔥 snapshot existing synced_with for anything being updated, so we can
    // diff before/after and keep symmetric back-links in sync
    const existingIds = assignments.filter((a) => a._id).map((a) => a._id);
    const existingDocs = existingIds.length
      ? await CourseAssignment.find(
          { _id: { $in: existingIds } },
          "synced_with",
        )
      : [];
    const beforeSyncMap = new Map(
      existingDocs.map((d) => [String(d._id), d.synced_with.map(String)]),
    );

    const operations = assignments.map((item) => {
      const {
        _id,
        session_id,
        course_id,
        faculty_id,
        batch_ids,
        assignment_type,
        sessions_per_week,
        duration,
        component_type,
        elective_slot_id,
        shared_lab_with,
        synced_with,
      } = item;

      if (
        !session_id ||
        !(course_id || elective_slot_id) ||
        !faculty_id ||
        !batch_ids?.length
      ) {
        throw new Error("Missing required fields in one of the assignments");
      }

      const filter = _id
        ? { _id }
        : {
            session_id,
            course_id,
            batch_ids: { $all: batch_ids, $size: batch_ids.length },
          };

      return {
        updateOne: {
          filter,
          update: {
            $set: {
              session_id,
              course_id,
              faculty_id,
              batch_ids,
              assignment_type,
              ...(sessions_per_week != null ? { sessions_per_week } : {}),
              duration,
              component_type,
              elective_slot_id: elective_slot_id ?? null,
              shared_lab_with: shared_lab_with || [],
              synced_with: synced_with || [],
            },
          },
          upsert: true,
        },
      };
    });

    const result = await CourseAssignment.bulkWrite(operations, {
      ordered: false,
    });

    // 🔥 reconcile symmetric synced_with back-links. Only rows that already had
    // an _id can carry synced_with from the UI (the picker is disabled until a
    // row is saved once), so this covers every case that matters.
    for (const item of assignments) {
      if (!item._id || item.synced_with === undefined) continue;

      const before = beforeSyncMap.get(String(item._id)) || [];
      const after = (item.synced_with || []).map(String);

      const removed = before.filter((x) => !after.includes(x));
      const added = after.filter((x) => !before.includes(x));

      if (removed.length) {
        await CourseAssignment.updateMany(
          { _id: { $in: removed } },
          { $pull: { synced_with: item._id } },
        );
      }
      if (added.length) {
        await CourseAssignment.updateMany(
          { _id: { $in: added } },
          { $addToSet: { synced_with: item._id } },
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Bulk upsert completed",
      data: {
        inserted: result.upsertedCount,
        modified: result.modifiedCount,
        matched: result.matchedCount,
      },
    });
  } catch (error) {
    console.error("Bulk upsert error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process bulk assignments",
    });
  }
};
