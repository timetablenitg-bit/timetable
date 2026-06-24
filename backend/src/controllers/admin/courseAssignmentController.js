import mongoose from "mongoose";
import { CourseAssignment } from "../../models/courseAssignmentModel.js";

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
      is_combined,
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
      is_combined,
    });

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
      "is_combined",
    ];

    const updates = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedAssignment = await CourseAssignment.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true },
    );

    if (!updatedAssignment) {
      return res.status(404).json({
        success: false,
        message: "Course assignment not found",
      });
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
        is_combined,
        elective_slot_id,
      } = item;

      if (
        !session_id ||
        !(course_id || elective_slot_id) ||
        !faculty_id ||
        !batch_ids?.length
      ) {
        throw new Error("Missing required fields in one of the assignments");
      }

      // Prefer _id-based match; fall back to logical key
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
              is_combined,
              elective_slot_id: elective_slot_id ?? null,
            },
          },
          upsert: true,
        },
      };
    });

    const result = await CourseAssignment.bulkWrite(operations, {
      ordered: false,
    });

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
