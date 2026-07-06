import mongoose from "mongoose";
import CourseRegistration from "../../models/courseRegistrationModel.js";
import { AcademicSession } from "../../models/academicSessionModel.js";

export const getMyRegistration = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;

    const registration = await CourseRegistration.findOne({
      student: studentId,
      session: id,
    }).populate("backlogCourses.course");

    if (!registration) {
      return res.status(404).json({ message: "No registration found" });
    }
    res.status(200).json({ data: registration });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const submitRegistration = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { session, batch, backlogCourses } = req.body;

    if (!session) {
      return res.status(400).json({ message: "session is required" });
    }

    if (!backlogCourses || backlogCourses.length === 0) {
      return res.status(400).json({
        message: "Select at least one course before submitting",
      });
    }

    let registration = await CourseRegistration.findOne({
      student: studentId,
      session,
    });

    // 🔒 Already submitted — cannot resubmit or modify
    if (registration?.status === "COMPLETED") {
      return res.status(400).json({
        message: "Already submitted",
      });
    }

    if (!registration) {
      if (!batch) {
        return res.status(400).json({
          message: "batch is required to start registration",
        });
      }
      registration = new CourseRegistration({
        student: studentId,
        session,
        batch,
      });
    }

    // 💾 Save selections and lock in one shot
    registration.backlogCourses = backlogCourses;
    registration.status = "COMPLETED";
    registration.submittedAt = new Date();

    await registration.save();

    const populated = await CourseRegistration.findById(
      registration._id,
    ).populate("backlogCourses.course");

    res.status(200).json({
      message: "Course registration submitted successfully",
      registration: populated,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
