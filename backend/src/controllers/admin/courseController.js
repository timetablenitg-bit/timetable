import mongoose from "mongoose";
import { Course } from "../../models/courseModel.js";

export const fetchCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({
      department: 1,
      semester_offered: 1,
      course_code: 1,
    });

    // Flatten hours for frontend table
    const formattedCourses = courses.map((course) => ({
      _id: course._id,
      course_code: course.course_code,
      course_name: course.course_name,
      semester_offered: course.semester_offered,
      credits: course.credits,
      course_type: course.course_type,
      department: course.department,
      nature: course.nature,
      is_elective_slot: course.is_elective_slot ?? false,

      // LTP (flattened)
      lecture: course.hours?.lecture ?? 0,
      tutorial: course.hours?.tutorial ?? 0,
      practical: course.hours?.practical ?? 0,
    }));

    res.status(200).json({
      success: true,
      data: formattedCourses,
    });
  } catch (error) {
    console.error("Fetch courses error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
    });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const deletedCourse = await Course.findOneAndDelete({
      _id: id,
    });

    if (!deletedCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete course",
    });
  }
};

export const createCourse = async (req, res) => {
  try {
    const {
      course_code,
      course_name,
      semester_offered,
      credits,
      course_type,
      department,
      nature,
      lecture,
      tutorial,
      practical,
    } = req.body;

    // Required fields
    if (
      !course_code ||
      !course_name ||
      !course_type ||
      !department ||
      !nature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "course_code, course_name, course_type, department and nature are required",
      });
    }

    // Normalize LTP
    const L = Number(lecture) || 0;
    const T = Number(tutorial) || 0;
    const P = Number(practical) || 0;

    // Validate LTP vs course_type
    if (course_type === "THEORY" && (L + T === 0 || P > 0)) {
      return res.status(400).json({
        success: false,
        message:
          "THEORY course must have lecture/tutorial hours and no practical hours",
      });
    }

    if (course_type === "LAB" && (P === 0 || L > 0 || T > 0)) {
      return res.status(400).json({
        success: false,
        message:
          "LAB course must have practical hours only (no lecture/tutorial)",
      });
    }

    const course = await Course.create({
      course_code: course_code.trim(),
      course_name: course_name.trim(),
      semester_offered,
      credits,
      course_type,
      department,
      nature,
      hours: {
        lecture: L,
        tutorial: T,
        practical: P,
      },
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    console.error("Create course error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Course with this code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create course",
    });
  }
};

export const editCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const existing = await Course.findOne({
      _id: id,
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const {
      course_code,
      course_name,
      semester_offered,
      credits,
      course_type,
      department,
      nature,
      lecture,
      tutorial,
      practical,
    } = req.body;

    const type = course_type || existing.course_type;

    const L = lecture !== undefined ? Number(lecture) : existing.hours.lecture;
    const T =
      tutorial !== undefined ? Number(tutorial) : existing.hours.tutorial;
    const P =
      practical !== undefined ? Number(practical) : existing.hours.practical;

    // Validate LTP again
    if (type === "THEORY" && (L + T === 0 || P > 0)) {
      return res.status(400).json({
        success: false,
        message:
          "THEORY course must have lecture/tutorial hours and no practical hours",
      });
    }

    if (type === "LAB" && (P === 0 || L > 0 || T > 0)) {
      return res.status(400).json({
        success: false,
        message:
          "LAB course must have practical hours only (no lecture/tutorial)",
      });
    }

    const updatedCourse = await Course.findOneAndUpdate(
      { _id: id },
      {
        ...(course_code && { course_code }),
        ...(course_name && { course_name }),
        ...(semester_offered !== undefined && { semester_offered }),
        ...(credits !== undefined && { credits }),
        ...(course_type && { course_type }),
        ...(department && { department }),
        ...(nature && { nature }),
        hours: { lecture: L, tutorial: T, practical: P },
      },
      { returnDocument: "after", runValidators: true },
    );

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Edit course error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Course with this code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update course",
    });
  }
};

export const createCourses = async (req, res) => {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "rows must be a non-empty array",
      });
    }
    // console.log(rows);

    const validDocs = [];
    const errors = [];

    rows.forEach((row, index) => {
      const {
        course_code,
        course_name,
        semester_offered,
        credits,
        course_type,
        department,
        nature,
        lecture,
        tutorial,
        practical,
      } = row;

      const normalizedCourseType = course_type?.toUpperCase();
      const normalizedDepartment = department?.toUpperCase();
      const normalizedNature = nature?.toUpperCase();

      // ---- REQUIRED FIELD CHECK ----
      if (
        !course_code ||
        !course_name ||
        !normalizedCourseType ||
        !normalizedDepartment ||
        !normalizedNature
      ) {
        errors.push({
          row: index + 1,
          course_code: course_code || null,
          message: "Missing required fields",
        });
        return;
      }

      // ---- SAFE NUMBER CASTING ----
      const L = Number(lecture) || 0;
      const T = Number(tutorial) || 0;
      const P = Number(practical) || 0;

      validDocs.push({
        course_code: course_code.trim(),
        course_name: course_name.trim(),
        semester_offered: semester_offered ? Number(semester_offered) : null,
        credits: Number(credits) || 0,
        course_type: normalizedCourseType,
        department: normalizedDepartment,
        nature: normalizedNature,
        hours: {
          lecture: L,
          tutorial: T,
          practical: P,
        },
      });
    });

    // console.log("Valid Docs:", validDocs);

    let insertedDocs = [];

    try {
      insertedDocs = await Course.insertMany(validDocs, { ordered: false });
      // console.log(insertedDocs);
    } catch (err) {
      console.error("Bulk insert error:", err.message);
      // Partial insert support
      if (err?.writeErrors) {
        err.writeErrors.forEach((we) => {
          errors.push({
            row: we.index + 1,
            course_code: validDocs[we.index]?.course_code || null,
            message: we.errmsg,
          });
        });
      }
      insertedDocs = err.insertedDocs || [];
    }

    return res.status(201).json({
      success: true,
      summary: {
        total_received: rows.length,
        inserted: insertedDocs.length,
        skipped: rows.length - insertedDocs.length,
        errors: errors.length,
      },
      errors,
      data: insertedDocs,
    });
  } catch (error) {
    console.error("Bulk course upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to bulk upload courses",
    });
  }
};

export const fetchCoursesBySemAndDepartment = async (req, res) => {
  try {
    const { semester, department } = req.query;
    // console.log("Filter params:", { semester, department });

    if (!semester || !department) {
      return res.status(400).json({
        success: false,
        message: "semester and department are required",
      });
    }

    const courses = await Course.find({
      semester_offered: Number(semester),
      department,
    });

    res.status(200).json({ success: true, courses });
  } catch (err) {
    console.error("Fetch courses by sem/dept error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch courses" });
  }
};
