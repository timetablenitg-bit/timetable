import CourseRegistration from "../../models/courseRegistrationModel.js";
import { Batch } from "../../models/batchModel.js";
import User from "../../models/userModel.js";

export const getRegistrationOverview = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // 1. All registrations for this session
    const registrations = await CourseRegistration.find({ session: sessionId })
      .populate("regularCourses.course")
      .populate("backlogCourses.course")
      .lean();

    // 2. Get all unique batches involved in this session's registrations
    const batchIds = [...new Set(registrations.map((r) => r.batch.toString()))];
    const batches = await Batch.find({ _id: { $in: batchIds } }).lean();

    // 3. studentId → registration lookup
    const regMap = new Map(registrations.map((r) => [r.student.toString(), r]));

    // 4. For each batch, find students by matching department + current_sem
    const result = await Promise.all(
      batches.map(async (batch) => {
        const students = await User.find({
          role: "student",
          department: batch.department,
          current_sem: batch.semester,
          isActive: true,
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

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("getRegistrationOverview error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getBacklogCourseStats = async (req, res) => {
  try {
    const { sessionId } = req.params;
    // console.log("Fetching backlog stats for session:", sessionId);
    const registrations = await CourseRegistration.find({ session: sessionId })
      .populate("backlogCourses.course")
      .lean();

    // Count students per backlog course
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
      data: [...countMap.values()], // [{ course: {...}, count: 5 }]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
