// docsContent.js
// Central content config for the Admin Documentation page.
// Add / edit sections here — no need to touch Documentation.jsx.
//
// Each section:
//   id        - unique key, used for nav + deep linking
//   title     - shown in sidebar + header
//   icon      - a lucide-react icon name (string), mapped in Documentation.jsx
//   visual    - key into VISUALS (docVisuals.jsx) for the illustrated preview
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
    visual: "getting-started",
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
    visual: "overview",
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
    visual: "generate-timetable",
    summary:
      "The full pipeline: create a session, assign courses, generate, then review the result.",
    whatItDoes: [
      "An academic session represents a term (e.g. Odd Semester 2026). Every generated timetable belongs to exactly one session, and generation itself happens in a dedicated workspace you open by selecting a session from the list.",
      "That workspace has four tabs that run in order: Course Registration (check what students have registered for), Course Assignments (tell the system which faculty teaches which course to which batch), Finalized Assignments (review everything, then trigger generation), and Generated Timetable (the result — view, resolve, edit, export).",
    ],
    steps: [
      {
        title: "1. Create or open a session",
        detail:
          "Click 'Add Session' and fill in the academic year and term (Odd/Even), or select an existing session from the list to open its workspace. Use the search bar to filter sessions by name.",
        visual: "gt-create-session",
      },
      {
        title: "2. Course Registration — check student registrations",
        detail:
          "This tab is read-only. It's grouped by batch, and shows how many students have completed registering their electives/backlog courses for the term versus how many haven't started. Use it to sanity-check before assigning courses — assigning against a batch with a lot of 'Not Started' students usually means it's too early to finalize.",
        visual: "gt-course-registration",
      },
      {
        title: "3. Course Assignments — assign faculty to courses",
        detail:
          "Expand a batch card and add a row per course the batch takes: pick the course, pick the faculty (the faculty list is automatically filtered to the course's department), and pick the component type (Lecture / Lab / Tutorial). For elective slots, you must additionally pick the actual elective being taught — the slot itself isn't enough. Filter/sort batches by department or year using the toolbar above the list.",
        visual: "gt-assignment-row",
      },
      {
        title: "4. Linking shared or synced sessions",
        detail:
          "If two batches share one physical lab room at the same time, link the two rows using 'Shared Lab'. If a lecture is genuinely delivered once to two different batches at once (a combined slot), use 'Synced With' — this only works between two already-saved assignments in different batches, not two courses inside the same batch.",
        visual: "gt-link-pickers",
      },
      {
        title: "5. Save assignments",
        detail:
          "Click Save on a batch card once its rows are complete. A row won't save until it has both a course and a faculty (and, for elective slots, the elective itself); an empty batch with zero rows can't be saved either.",
        visual: "gt-save-batch",
      },
      {
        title: "6. Finalized Assignments — trigger generation",
        detail:
          "Open the Finalized Assignments tab to review everything that's been saved across all batches, then click 'Generate Timetable'. This is the step that actually runs the placement engine — editing Course Assignments afterwards does not update an already-generated timetable until you generate again.",
        visual: "gt-finalized",
      },
      {
        title: "7. Watch generation run",
        detail:
          "A progress modal walks through the engine's stages — fetching assignments, building the slot map, running the placement engine, scoring the result, and finalizing. This typically takes a few seconds; leave the tab open until it completes.",
        visual: "gt-generation-modal",
      },
      {
        title: "8. Generated Timetable — review the result",
        detail:
          "Once generation finishes, the Generated Timetable tab shows a quality Score badge and four sub-tabs: Schedule (the day/period grid), Slots (the raw slot list), Institute (a combined institute-wide view), and Review. Check the Review tab first — its badge shows how many items the engine couldn't place automatically (overflow sessions or elective 'choose one occurrence' conflicts) and need a manual decision.",
        visual: "gt-result-tabs",
      },
      {
        title: "9. Resolve manual review items",
        detail:
          "Each Review item lets you pick where an unplaced session should go. Items unlock in order — Pick Occurrences, then Unplaced, then Overflow — so later items only appear once earlier ones for that batch are cleared. Resolving an item edits the saved schedule directly; Schedule and Institute views refresh to reflect it.",
        visual: "gt-manual-review",
      },
      {
        title: "10. Manual edits (optional)",
        detail:
          "In Schedule or Slots view, click 'Edit' to drag-and-drop or click-to-reassign cells. Saving an edit always re-validates and rescores the timetable; if the edit introduces a clash (e.g. double-booking a faculty member), you'll see warnings and stay in edit mode until you either fix or accept them.",
        visual: "gt-manual-edit",
      },
      {
        title: "11. Export",
        detail:
          "Use the Excel icon in the header to export the current generated schedule once it has a generation ID (i.e. after at least one successful generation).",
        visual: "gt-export",
      },
    ],
    notes: [
      "Marking a session Active immediately changes what students see under Time Table — the system automatically deactivates whichever session was previously active, and it won't let you deactivate the only active session without activating another one first.",
      "Deleting a session does not automatically delete its generated timetable data — double check before deleting.",
      "If the Generated Timetable tab says 'No timetable generated yet', it means Finalized Assignments → Generate Timetable hasn't been run for this session — Course Assignments alone won't produce a schedule.",
      "A non-zero pending count on the Review tab means some sessions are missing from the published schedule until you resolve them.",
    ],
  },
  {
    id: "time-table",
    title: "Time Table",
    icon: "Table",
    visual: "time-table",
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
      "If the timetable looks empty here but you know you generated one, check that the correct session is marked Active under Generate Timetable → session list.",
    ],
  },
  {
    id: "faculty-directory",
    title: "Faculty Directory",
    icon: "Users",
    visual: "faculty-directory",
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
    notes: [
      "A faculty member's department determines which courses they'll show up as eligible for in Course Assignments — double check it's correct before assigning them to anything.",
    ],
  },
  {
    id: "course-management",
    title: "Course Management",
    icon: "BookOpen",
    visual: "course-management",
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
    notes: [
      "Set weekly hours (lecture/tutorial/practical) accurately for each course — a course saved with 0 hours for a component can be assigned in Course Assignments without error, but the timetable engine has nothing to schedule for it and it will silently be missing from the generated timetable.",
    ],
  },
  {
    id: "batch-management",
    title: "Batch Management",
    icon: "Layers",
    visual: "batch-management",
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
    visual: "student-feedback",
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
    visual: "pending-requests",
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
    visual: "rules-policies",
    summary: "Things that can break the app — read before you edit data.",
    whatItDoes:
      "These are hard constraints baked into the system, not suggestions. Most 'the timetable looks wrong / empty / half-missing' problems trace back to one of these being skipped.",
    steps: [],
    notes: [],
    rules: [
      "Every course needs department and nature filled in — these are required fields; the course simply won't save without them.",
      "Set a course's weekly hours (lecture/tutorial/practical) honestly. Hours default to 0, and a course with 0 hours for the component you assigned can still be added in Course Assignments — it will then be silently absent from the generated timetable instead of throwing an error.",
      "A Course Assignment row needs both a course and a faculty to save. For elective slot rows, you also need to pick the actual elective — selecting only the slot itself leaves the row incomplete and it will be rejected on save.",
      "You can't save a batch with zero assignment rows — 'assign at least one course' is enforced before the save call goes out.",
      "The faculty picker for a row is filtered to the course's own department (plus the batch's department for semesters above 2). If the faculty you need doesn't appear, check their department in Faculty Directory before assuming Course Assignments is broken.",
      "'Synced With' only links two DIFFERENT batches sharing one slot — it's not for combining two courses inside the same batch, and only works between assignments that have already been saved (not pending rows).",
      "Only one academic session can be Active at a time. Activating a session automatically deactivates whatever was previously active, and you cannot deactivate the only active session without activating a replacement — this is enforced by the backend, not just the UI.",
      "Generating a timetable reads from Finalized Assignments, not live edits. Changing Course Assignments after a timetable has been generated has no effect on the published schedule until you generate again.",
      "Deleting an academic session does NOT delete its generated timetable data. Don't rely on deleting a session as a way to clear out a bad generation — archive or regenerate instead.",
      "A generated timetable can have unresolved items in the Review tab (courses the engine couldn't place automatically). These are missing from the schedule students see until an admin resolves them — a non-zero Review badge is not cosmetic.",
      "Manual grid edits (drag/drop or click-to-assign in Schedule/Slots edit mode) are re-validated and rescored on save. If Save returns warnings (e.g. a faculty double-booking), the edit stays open so you can see and fix it — don't assume a save with warnings is safe to walk away from.",
      "Excel export requires a completed generation. The export button stays disabled until a generation ID exists for the session.",
    ],
  },
];
