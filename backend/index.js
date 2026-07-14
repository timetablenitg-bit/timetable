import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/initDB.js";

import authRoutes from "./src/routes/authRoutes.js";
import academicSessionRoutes from "./src/routes/admin/academicSessionRoutes.js";
import batchRoutes from "./src/routes/admin/batchRoutes.js";
import courseAssignmentRoutes from "./src/routes/admin/courseAssignmentRoutes.js";
import facultyRoutes from "./src/routes/admin/facultyRoutes.js";
import roomRoutes from "./src/routes/admin/roomRoutes.js";
import courseRoutes from "./src/routes/admin/courseRoutes.js";
import timetableRoutes from "./src/routes/admin/timetableRoutes.js";
import courseRegistrationRoutes from "./src/routes/student/courseRegistrationRoutes.student.js";
import academicSessionRoutesStudent from "./src/routes/student/academicSessionRoutes.student.js";
import batchRoutesStudent from "./src/routes/student/batchRoutes.student.js";
import courseRegistrationAdminRoutes from "./src/routes/admin/courseRegistrationRoutes.Admin.js";
import userRoutes from "./src/routes/admin/userRoutes.js";
import exportRoutes from "./src/routes/exportRoutes.js";
import studentFeedbackRoutes from "./src/routes/student/feedbackRoutes.student.js";
import adminFeedbackRoutes from "./src/routes/admin/feedbackRoutes.admin.js";
import adminRoutes from "./src/routes/admin/adminRoutes.js";

import timetablePublicRoutes from "./src/routes/Timetablepublicroutes.js"; // ← new

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/v1/auth", authRoutes);

//Admin Routes
app.use("/api/v1/admin/academicsession", academicSessionRoutes);
app.use("/api/v1/admin/batch", batchRoutes);
app.use("/api/v1/admin/course", courseRoutes);
app.use("/api/v1/admin/courseAssignment", courseAssignmentRoutes);
app.use("/api/v1/admin/faculty", facultyRoutes);
app.use("/api/v1/admin/room", roomRoutes);
app.use("/api/v1/admin/timetable/engine", timetableRoutes);
app.use("/api/v1/admin/course-registration", courseRegistrationAdminRoutes);
app.use("/api/v1/admin/users", userRoutes);
app.use("/api/v1/export", exportRoutes);

//Admin role Routes
app.use("/api/admin", adminRoutes);

//Student Routes
app.use("/api/v1/student/course-registration", courseRegistrationRoutes);
app.use("/api/v1/student/academicSessions", academicSessionRoutesStudent);
app.use("/api/v1/student/my-batch", batchRoutesStudent);

//feedback
app.use("/api/v1/student/feedback", studentFeedbackRoutes);
app.use("/api/v1/admin/feedback", adminFeedbackRoutes);

app.use("/api/v1/timetable", timetablePublicRoutes); // for public timetable endpoints (active session, schedule, slots)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
