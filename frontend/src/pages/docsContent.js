// docsContent.js
// Central content config for the Admin Documentation page.
// Add / edit sections here — no need to touch Documentation.jsx.
//
// Each section:
//   id        - unique key, used for nav + deep linking
//   title     - shown in sidebar + header
//   icon      - a lucide-react icon name (string), mapped in Documentation.jsx
//   summary   - one-line description shown under the title
//   whatItDoes- short paragraph(s) — plain text or array of paragraphs
//   steps     - array of { title, detail } — the "how to use it" walkthrough
//   notes     - array of strings — tips, warnings, gotchas (optional)
//   rules     - array of strings — policy / rule bullet points (optional, fill in later)

export const docSections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "Compass",
    summary: "What the Admin Panel is and how it's laid out.",
    whatItDoes:
      "The Admin Panel is where the department Incharge manages everything related to academic scheduling — faculty, courses, batches, timetables, and student feedback. Everything is organized into a sidebar of tools; only one tool is open at a time.",
    steps: [
      {
        title: "Signing in",
        detail:
          "Log in with your admin credentials. You'll land on the Overview tab by default.",
      },
      {
        title: "Navigating the panel",
        detail:
          "Use the left sidebar to switch between tools (Overview, Generate Timetable, Time Table, Faculty Directory, Course Management, Batch Management, Student Feedback, Pending Requests). On mobile, tap the floating menu button in the bottom-right corner.",
      },
      {
        title: "Theme & profile",
        detail:
          "Use the sun/moon icon in the navbar to switch between light and dark mode. Click your name or avatar to view/edit your profile.",
      },
    ],
    notes: [
      "This guide reflects the tools currently available in your sidebar. If you don't see a tool mentioned elsewhere, it may not be enabled for your account yet.",
    ],
  },
  {
    id: "overview",
    title: "Overview",
    icon: "LayoutDashboard",
    summary: "Your at-a-glance dashboard of the whole department.",
    whatItDoes:
      "The Overview tab is a read-only dashboard. It summarizes faculty, courses, batches, academic sessions, and rooms so you can quickly check the health of the department's data without digging through each individual tool.",
    steps: [
      {
        title: "Reading the stat cards",
        detail:
          "The top row shows total counts — Faculties, Courses, Batches, Sessions, Rooms — each with a short breakdown underneath (e.g. accepted vs pending faculty invites).",
      },
      {
        title: "Academic Sessions panel",
        detail:
          "Lists recent sessions with a status pill (Active / Closed). An active session is the one currently used to generate and display timetables.",
      },
      {
        title: "Faculty panel",
        detail:
          "Shows invite status breakdown (accepted, pending, uninvited) and a department-wise distribution bar chart.",
      },
      {
        title: "Courses panel",
        detail:
          "Shows courses grouped by nature (Core, Minor, Elective, Project, Seminar) and by type (Theory vs Lab).",
      },
      {
        title: "Batch charts",
        detail:
          "Bottom section shows batch distribution by semester and by department.",
      },
    ],
    notes: [
      "This tab doesn't let you edit anything directly — use the relevant tool in the sidebar to make changes.",
    ],
  },
  {
    id: "generate-timetable",
    title: "Generate Timetable",
    icon: "CalendarDays",
    summary:
      "Create and manage academic sessions, then generate a timetable for one.",
    whatItDoes:
      "An academic session represents a term (e.g. Odd Semester 2026). Timetables are generated per session. Only one session should typically be marked active at a time — that's the one shown on the public/student-facing Time Table.",
    steps: [
      {
        title: "Create a session",
        detail:
          "Click 'Add Session', fill in the academic year and term (Odd/Even), and save.",
      },
      {
        title: "Search existing sessions",
        detail: "Use the search bar to filter sessions by name.",
      },
      {
        title: "Edit or delete a session",
        detail:
          "Open a session from the list to edit its details, or delete it if it was created by mistake. Deleting a session does not automatically delete its generated timetable data — double check before deleting.",
      },
      {
        title: "Generate the timetable",
        detail:
          "Select a session to move into the academic-session workspace, where you assign courses, faculty, and rooms to time slots.",
      },
    ],
    notes: [
      "Marking a new session active will change what students see under Time Table immediately.",
    ],
  },
  {
    id: "time-table",
    title: "Time Table",
    icon: "Table",
    summary: "View the published timetable for the active academic session.",
    whatItDoes:
      "This is a read view of the timetable currently generated for the active session — the same view students see for their batch. Use it to sanity-check the schedule after generating or editing it.",
    steps: [
      {
        title: "Viewing the schedule",
        detail:
          "The page automatically loads the active session's schedule and slot data. If no session is marked active, you'll see an empty state instead of an error.",
      },
    ],
    notes: [
      "If the timetable looks empty here but you know you generated one, check that the correct session is marked Active under Generate Timetable → Academic Sessions.",
    ],
  },
  {
    id: "faculty-directory",
    title: "Faculty Directory",
    icon: "Users",
    summary: "Manage the list of faculty members and their invite status.",
    whatItDoes:
      "This is the master list of faculty in the department. Faculty must exist here before they can be assigned to courses or timetable slots.",
    steps: [
      {
        title: "Add a single faculty member",
        detail:
          "Click 'Add Faculty', enter their Faculty ID, name, and department, then save.",
      },
      {
        title: "Bulk add faculty",
        detail:
          "Use the same 'Add Faculty' flow with multiple rows to create several faculty members at once (useful at the start of a new term).",
      },
      {
        title: "Understanding invite status",
        detail:
          "Accepted = the faculty member has logged in and set up their account. Pending = an invite was sent but not yet accepted. Uninvited = no invite has been sent yet.",
      },
    ],
    notes: [],
  },
  {
    id: "course-management",
    title: "Course Management",
    icon: "BookOpen",
    summary: "Add, edit, and organize courses offered by the department.",
    whatItDoes:
      "Courses are defined here with a course code, nature (Core / Minor / Elective / Project / Seminar), and type (Theory / Lab). Courses created here become available for assignment when generating timetables.",
    steps: [
      {
        title: "Add courses",
        detail:
          "Click 'Add Course' and fill in the course details. Courses can be added one at a time or in bulk.",
      },
      {
        title: "Review before saving",
        detail:
          "Newly added courses show an 'Unsaved Changes' banner until confirmed — review the list before it's committed.",
      },
      {
        title: "Edit a course",
        detail: "Click a course in the list to open the edit form.",
      },
      {
        title: "Delete a course",
        detail:
          "Click delete and confirm. If the course was never saved to the database (still pending), it's simply removed from the unsaved list.",
      },
    ],
    notes: [],
  },
  {
    id: "batch-management",
    title: "Batch Management",
    icon: "Layers",
    summary: "Manage student batches by department and semester.",
    whatItDoes:
      "A batch represents a group of students in a specific department and semester (e.g. CSE Semester 4). Batches are what timetable slots and rooms ultimately get assigned to.",
    steps: [
      {
        title: "Add a batch",
        detail:
          "Click 'Add Batch' and provide the batch name, department, and semester. Bulk creation is also supported.",
      },
      {
        title: "Edit a batch",
        detail: "Select a batch from the list to update its name or details.",
      },
      {
        title: "Delete a batch",
        detail: "Confirm the deletion in the prompt. This cannot be undone.",
      },
    ],
    notes: [],
  },
  {
    id: "student-feedback",
    title: "Student Feedback",
    icon: "MessageSquare",
    summary: "Review and triage feedback submitted by students.",
    whatItDoes:
      "Students can submit bug reports, suggestions, or general feedback (optionally with a star rating). This tool lets you review, filter, and update the status of each submission.",
    steps: [
      {
        title: "Filter feedback",
        detail:
          "Use the Type filter (Bug / Suggestion / General) and Status filter (Open / Reviewed / Resolved) to narrow the list.",
      },
      {
        title: "Update status",
        detail:
          "Change the status dropdown on any feedback card as you triage — Open → Reviewed → Resolved.",
      },
      {
        title: "Delete feedback",
        detail: "Use the trash icon to remove a feedback entry permanently.",
      },
    ],
    notes: [
      "Each entry shows the submitting student's username, email, and timestamp for follow-up if needed.",
    ],
  },
  {
    id: "pending-requests",
    title: "Pending Requests",
    icon: "ClipboardList",
    summary: "Requests awaiting admin approval.",
    whatItDoes:
      "Placeholder section — details to be added once this tool's functionality is finalized.",
    steps: [],
    notes: [],
  },
  {
    id: "rules-policies",
    title: "Rules & Policies",
    icon: "ShieldCheck",
    summary: "Department policies for using the admin panel.",
    whatItDoes:
      "This section will hold access, data-handling, and process rules for admins. Add entries to the `rules` array below as they're finalized.",
    steps: [],
    notes: [],
    rules: [
      // e.g. "Only department Incharges may be granted admin access.",
      // "Never delete an academic session with a generated timetable without archiving it first.",
    ],
  },
];
