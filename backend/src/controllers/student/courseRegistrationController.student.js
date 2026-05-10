import mongoose from "mongoose";
import CourseRegistration from "../../models/courseRegistrationModel.js";
import { AcademicSession } from "../../models/academicSessionModel.js";

export const getMyRegistration = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params; // session = ObjectId string
    // console.log(studentId, id);

    const registration = await CourseRegistration.findOne({
      student: studentId,
      session: id, // Mongoose casts string → ObjectId automatically
    })
      .populate("regularCourses.course")
      .populate("backlogCourses.course");

    if (!registration) {
      return res.status(404).json({ message: "No registration found" });
    }
    // console.log("Found registration:", registration);
    res.status(200).json({ data: registration });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const startRegistration = async (req, res) => {
  try {
    const student = req.user; // has current_sem, department, student_code
    const { sessionId, batchId } = req.body;

    const sessionDoc = await AcademicSession.findById(sessionId);
    if (!sessionDoc?.isActive) {
      return res.status(400).json({ message: "Session is not active" });
    }

    // Return existing instead of erroring
    const existing = await CourseRegistration.findOne({
      student: student.id,
      session: sessionId,
      batch: batchId,
    });
    if (existing) {
      return res.status(200).json({ data: existing, alreadyExists: true });
    }

    const registration = await CourseRegistration.create({
      student: student.id,
      session: sessionId,
      batch: batchId,
      status: "IN_PROGRESS",
    });

    res.status(201).json({ data: registration, alreadyExists: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const saveCourses = async (req, res) => {
  // console.log("saving autosave");
  try {
    const studentId = req.user.id;
    const { session, regularCourses, backlogCourses } = req.body;

    const registration = await CourseRegistration.findOne({
      student: studentId,
      session,
    });

    if (!registration) {
      return res.status(404).json({
        message: "Start registration first",
      });
    }

    // 🔒 Block if already submitted
    if (registration.status === "COMPLETED") {
      return res.status(403).json({
        message: "Registration already submitted. Cannot modify.",
      });
    }

    // 🔄 Update courses
    registration.regularCourses = regularCourses || [];
    registration.backlogCourses = backlogCourses || [];

    await registration.save();
    // console.log("Courses saved for registration:", registration._id);
    const populated = await CourseRegistration.findById(registration._id)
      .populate("regularCourses.course")
      .populate("backlogCourses.course");
    res.status(200).json({
      message: "Courses saved successfully",
      registration: populated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const submitRegistration = async (req, res) => {
  console.log("submitting registration");
  try {
    const studentId = req.user.id;
    const { session } = req.body;

    const registration = await CourseRegistration.findOne({
      student: studentId,
      session,
    });

    if (!registration) {
      return res.status(404).json({
        message: "Registration not found",
      });
    }

    // 🔒 Already submitted
    if (registration.status === "COMPLETED") {
      return res.status(400).json({
        message: "Already submitted",
      });
    }

    // ⚠️ Optional validation
    if (
      (!registration.regularCourses ||
        registration.regularCourses.length === 0) &&
      (!registration.backlogCourses || registration.backlogCourses.length === 0)
    ) {
      return res.status(400).json({
        message: "Select at least one course before submitting",
      });
    }

    // 🔥 LOCK IT
    registration.status = "COMPLETED";
    registration.submittedAt = new Date();

    await registration.save();

    res.status(200).json({
      message: "Course registration submitted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
