// export const BASE_URL = "http://localhost:5001";
// export const BASE_URL = "https://s3pmqjjg-5001.inc1.devtunnels.ms/";
export const BASE_URL = "https://timetable-vvtq.onrender.com";

export const API_PATHS = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    REGISTER: "/api/v1/auth/register",
    GOOGLE_LOGIN: "/api/v1/auth/google",
    ACCEPT_INVITE: "/api/v1/auth/accept-invite",
    SETUP: "/api/v1/auth/setupProfile",
    GETME: "/api/v1/auth/getMe",
    INVITE: "/api/v1/auth/invite-faculty",
  },

  ADMIN: {
    INVITE_FACULTY: "/api/v1/admin/invite-faculty",
    COURSE_REGISTRATION_OVERVIEW: (session_id) =>
      `/api/v1/admin/course-registration/overview/${session_id}`,
    BACKLOG_STATS: (session_id) =>
      `/api/v1/admin/course-registration/backlog-stats/${session_id}`,
  },

  USER: {
    FETCH_ALL: "api/v1/admin/users/",
    FETCH_BY_ROLE: (role) => `api/v1/admin/users/role/${role}`,
    UPDATE_ROLE: (id) => `api/v1/admin/users/${id}`,
    DELETE: (id) => `api/v1/admin/users/${id}`,
    DELETE_BY_SEMESTER: (current_sem) =>
      `api/v1/admin/users/delete/${current_sem}`,
  },

  ACADEMIC_SESSION: {
    GET: "/api/v1/admin/academicsession/",
    GETBYID: (id) => `/api/v1/admin/academicsession/${id}`,
    CREATE: "/api/v1/admin/academicsession/",
    UPDATE: (id) => `/api/v1/admin/academicsession/${id}`,
    DELETE: (id) => `/api/v1/admin/academicsession/${id}`,
  },

  BATCH: {
    GET: "/api/v1/admin/batch/",
    GETBYDEPT: (dept) => `/api/v1/admin/batch/${dept}`,
    CREATE: "/api/v1/admin/batch/",
    BULK: "/api/v1/admin/batch/bulk",
    UPDATE: (id) => `/api/v1/admin/batch/${id}`,
    DELETE: (id) => `/api/v1/admin/batch/${id}`,
  },

  COURSE: {
    GET: "/api/v1/admin/course/",
    CREATE: "/api/v1/admin/course/",
    BULK: "/api/v1/admin/course/bulk",
    UPDATE: (id) => `/api/v1/admin/course/${id}`,
    DELETE: (id) => `/api/v1/admin/course/${id}`,
    GET_BY_SEM_AND_BRANCH: (semester, department) =>
      `/api/v1/admin/course/filter?semester=${semester}&department=${department}`,
  },

  COURSE_ASSIGNMENT: {
    GET: "/api/v1/admin/courseAssignment/",
    CREATE: "/api/v1/admin/courseAssignment/",
    BULK: "/api/v1/admin/courseAssignment/bulk",
    UPDATE: (id) => `/api/v1/admin/courseAssignment/${id}`,
    DELETE: (id) => `/api/v1/admin/courseAssignment/${id}`,
  },
  FACULTY: {
    GET: "/api/v1/admin/faculty/",
    CREATE: "/api/v1/admin/faculty/",
    BULK: "/api/v1/admin/faculty/bulk",
    UPDATE: (id) => `/api/v1/admin/faculty/${id}`,
    DELETE: (id) => `/api/v1/admin/faculty/${id}`,
  },
  FACULTY_SELF: {
    PROFILE: "/api/v1/faculty/me",
    COURSES: "/api/v1/faculty/my-courses",
    COURSE_ASSIGNMENTS: "/api/v1/faculty/my-course-assignments",
    LAB_ASSIGNMENTS: "/api/v1/faculty/my-lab-assignments",
    ATTENDANCE: "/api/v1/faculty/attendance",
    CONTACT_REQUESTS: "/api/v1/faculty/contact-request",
    LEAVES: "/api/v1/faculty/leave",
    WORKLOAD: "/api/v1/faculty/workload",
  },
  LAB_ASSIGNMENT: {
    GET: "/api/v1/admin/labAssignment/",
    CREATE: "/api/v1/admin/labAssignment/",
    UPDATE: (id) => `/api/v1/admin/labAssignment/${id}`,
    DELETE: (id) => `/api/v1/admin/labAssignment/${id}`,
  },
  ROOM: {
    GET: "/api/v1/admin/room/",
    CREATE: "/api/v1/admin/room/",
    BULK: "/api/v1/admin/room/bulk",
    UPDATE: (id) => `/api/v1/admin/room/${id}`,
    DELETE: (id) => `/api/v1/admin/room/${id}`,
  },
  TIMESLOT: {
    GET: "/api/v1/admin/timeslot/",
    CREATE: "/api/v1/admin/timeslot/",
    BULK: "/api/v1/admin/timeslot/bulk",
    UPDATE: (id) => `/api/v1/admin/timeslot/${id}`,
    DELETE: (id) => `/api/v1/admin/timeslot/${id}`,
  },
  CONSTRAINT: {
    GET: "/api/v1/admin/constraint/",
    CREATE: "/api/v1/admin/constraint/",
    UPDATE: (id) => `/api/v1/admin/constraint/${id}`,
    DELETE: (id) => `/api/v1/admin/constraint/${id}`,
  },
  TIMETABLE: {
    GENERATE: "/api/v1/admin/timetable/engine/generate",
    EVALUATE: "/api/v1/admin/timetable/engine/evaluate",
    SLOTS: "/api/v1/admin/timetable/engine/slots", // ← new
    SCHEDULE: "/api/v1/admin/timetable/engine/schedule", // ← new
    REWORK: "/api/v1/admin/timetable/engine/rework", // ← new

    BULK_UPDATE: (session_id) =>
      `/api/v1/admin/timetable/engine/slots/${session_id}`, // ← new
    CREATE_SLOT: (session_id) =>
      `/api/v1/admin/timetable/engine/slots/${session_id}`, // ← new
    PATCH_SLOT: (session_id, slot_name) =>
      `/api/v1/admin/timetable/engine/slots/${session_id}/${slot_name}`, // ← new
    DELETE_SLOT: (session_id, slot_name) =>
      `/api/v1/admin/timetable/engine/slots/${session_id}/${slot_name}`, // ← new
    SAVE_SCHEDULE: (timetable_id) =>
      `/api/v1/admin/timetable/engine/schedule/${timetable_id}`,
    EVALUATE_SCHEDULE: (timetable_id) =>
      `/api/v1/admin/timetable/engine/schedule/${timetable_id}/evaluate`,
  },
  STUDENT: {
    GETMYREGISTRATION: (session_id) =>
      `/api/v1/student/course-registration/my-registration/${session_id}`,
    START_REGISTRATION: "/api/v1/student/course-registration/start",
    SAVE_COURSES: "/api/v1/student/course-registration/save",
    SUBMIT_REGISTRATION: "/api/v1/student/course-registration/submit",
    ACADEMICSESSIONS: "/api/v1/student/academicSessions",
    MY_BATCH: "/api/v1/student/my-batch",
  },
  EXPORT: {
    EXCEL: (generation_id) => `/api/v1/export/excel/${generation_id}`,
  },
  TIMETABLE_PUBLIC: {
    ACTIVE_SESSION: "/api/v1/timetable/active-session",
    SCHEDULE: "/api/v1/timetable/schedule",
    SLOTS: "/api/v1/timetable/slots",
  },
};
