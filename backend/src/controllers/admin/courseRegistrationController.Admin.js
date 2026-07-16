import CourseRegistration from "../../models/courseRegistrationModel.js";
import { Batch } from "../../models/batchModel.js";
import { AcademicSession } from "../../models/academicSessionModel.js";
import User from "../../models/userModel.js";

export const getRegistrationOverview = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await AcademicSession.findById(sessionId).lean();
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Academic session not found" });
    }

    if (!session.isActive) {
      return res
        .status(400)
        .json({ success: false, message: "This session isn't active" });
    }

    // ODD term -> semesters 1,3,5,7 | EVEN term -> semesters 2,4,6,8
    const semesterParity = session.term === "ODD" ? 1 : 0;

    const registrations = await CourseRegistration.find({ session: sessionId })
      .populate("backlogCourses.course")
      .lean();

    const regMap = new Map(registrations.map((r) => [r.student.toString(), r]));

    // Batches are derived from the session's term parity, NOT from existing
    // registrations. This ensures batches with zero registrations still show up.
    const batches = await Batch.find({
      $expr: { $eq: [{ $mod: ["$semester", 2] }, semesterParity] },
    }).lean();

    const overview = await Promise.all(
      batches.map(async (batch) => {
        // isActive filter removed: registered/inactive students were being
        // silently dropped. All accounts for this department+semester should
        // appear, regardless of active status.
        const students = await User.find({
          role: "student",
          department: batch.department,
          current_sem: batch.semester,
        })
          .select("username email student_code department current_sem")
          .lean();

        return {
          batch: {
            _id: batch._id,
            batch_name: batch.batch_name,
            department: batch.department,
            year: batch.year,
            semester: batch.semester,
          },
          students: students.map((student) => ({
            student: {
              _id: student._id,
              fullName: student.username,
              rollNo: student.student_code,
              email: student.email,
              department: student.department,
            },
            registration: regMap.get(student._id.toString()) ?? null,
          })),
        };
      }),
    );

    // Only return batches that actually have at least one student.
    const result = overview.filter((entry) => entry.students.length > 0);

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("getRegistrationOverview error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getBacklogCourseStats = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const registrations = await CourseRegistration.find({ session: sessionId })
      .populate("backlogCourses.course")
      .lean();

    const countMap = new Map();
    for (const reg of registrations) {
      for (const entry of reg.backlogCourses) {
        const course = entry.course;
        if (!course?._id) continue;
        const id = course._id.toString();
        if (!countMap.has(id)) {
          countMap.set(id, { course, count: 0 });
        }
        countMap.get(id).count++;
      }
    }

    res.status(200).json({
      success: true,
      data: [...countMap.values()],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
