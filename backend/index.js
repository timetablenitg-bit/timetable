import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/initDB.js";

import authRoutes from "./src/routes/authRoutes.js";
import academicSessionRoutes from "./src/routes/admin/academicSessionRoutes.js";
import batchRoutes from "./src/routes/admin/batchRoutes.js";
import courseAssignmentRoutes from "./src/routes/admin/courseAssignmentRoutes.js";
import facultyRoutes from "./src/routes/admin/facultyRoutes.js";
import labAssignmentRoutes from "./src/routes/admin/labAssignmentRoutes.js";
import roomRoutes from "./src/routes/admin/roomRoutes.js";
import timeslotRoutes from "./src/routes/admin/timeslotRoutes.js";
import courseRoutes from "./src/routes/admin/courseRoutes.js";
import timetableRoutes from "./src/routes/admin/timetableRoutes.js";
// import constraintRoutes from "./src/routes/admin/constraintRoutes.js";
import courseRegistrationRoutes from "./src/routes/student/courseRegistrationRoutes.student.js";
import academicSessionRoutesStudent from "./src/routes/student/academicSessionRoutes.student.js";
import batchRoutesStudent from "./src/routes/student/batchRoutes.student.js";
import courseRegistrationAdminRoutes from "./src/routes/admin/courseRegistrationRoutes.Admin.js";
import userRoutes from "./src/routes/admin/userRoutes.js";
import exportRoutes from "./src/routes/exportRoutes.js";

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
app.use("/api/v1/admin/labAssignment", labAssignmentRoutes);
app.use("/api/v1/admin/room", roomRoutes);
app.use("/api/v1/admin/timeslot", timeslotRoutes);
app.use("/api/v1/admin/timetable/engine", timetableRoutes);
// app.use("/api/v1/admin/constraint", constraintRoutes);
app.use("/api/v1/admin/course-registration", courseRegistrationAdminRoutes);
app.use("/api/v1/admin/users", userRoutes);
app.use("/api/v1/export", exportRoutes);

//Faculty Routes

//Student Routes
app.use("/api/v1/student/course-registration", courseRegistrationRoutes);
app.use("/api/v1/student/academicSessions", academicSessionRoutesStudent);
app.use("/api/v1/student/my-batch", batchRoutesStudent);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
