// DocumentationWithVisuals.jsx
// Drop-in upgrade of your Documentation.jsx that adds a "Preview" panel
// (a small illustrated mockup of the actual screen) above "What it does"
// for every section. Everything else — sidebar, search, notes, rules,
// dark mode — is unchanged from your version.
//
// HOW TO WIRE THIS INTO YOUR REAL FILES:
//   1. Add a `visual: "overview"` (etc) key to each entry in docsContent.js
//      pointing at one of the keys in the VISUALS map below.
//   2. Copy the mockup components + VISUALS map into a new file,
//      e.g. `docVisuals.jsx`, and import { VISUALS } from "./docVisuals"
//      in Documentation.jsx.
//   3. Render <Preview sectionId={active.id} /> where shown below.
// This file is self-contained so you can preview it directly.

import React, { useState, useMemo } from "react";
import {
  Menu,
  X,
  Search,
  ChevronRight,
  Compass,
  LayoutDashboard,
  CalendarDays,
  Table,
  Users,
  BookOpen,
  Layers,
  MessageSquare,
  ClipboardList,
  ShieldCheck,
  Info,
  Lightbulb,
  Sun,
  Moon,
  Plus,
  Star,
  Bug,
  MonitorPlay,
} from "lucide-react";

/* ============================================================
   CONTENT (trimmed copy of your docsContent.js for this demo)
   ============================================================ */
const docSections = [
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
          "Use the left sidebar to switch between tools. On mobile, tap the floating menu button in the bottom-right corner.",
      },
      {
        title: "Theme & profile",
        detail:
          "Use the sun/moon icon to switch light/dark mode. Click your name or avatar to view/edit your profile.",
      },
    ],
    notes: [
      "This guide reflects the tools currently available in your sidebar.",
    ],
  },
  {
    id: "overview",
    title: "Overview",
    icon: "LayoutDashboard",
    summary: "Your at-a-glance dashboard of the whole department.",
    whatItDoes:
      "The Overview tab is a read-only dashboard. It summarizes faculty, courses, batches, academic sessions, and rooms so you can quickly check the health of the department's data.",
    steps: [
      {
        title: "Reading the stat cards",
        detail:
          "Top row shows total counts — Faculties, Courses, Batches, Sessions, Rooms.",
      },
      {
        title: "Academic Sessions panel",
        detail: "Lists recent sessions with a status pill (Active / Closed).",
      },
      {
        title: "Faculty panel",
        detail:
          "Shows invite status breakdown and a department-wise distribution chart.",
      },
    ],
    notes: ["This tab doesn't let you edit anything directly."],
  },
  {
    id: "generate-timetable",
    title: "Generate Timetable",
    icon: "CalendarDays",
    summary:
      "Create and manage academic sessions, then generate a timetable for one.",
    whatItDoes:
      "An academic session represents a term (e.g. Odd Semester 2026). Timetables are generated per session. Only one session should typically be marked active at a time.",
    steps: [
      {
        title: "Create a session",
        detail:
          "Click 'Add Session', fill in the academic year and term, and save.",
      },
      {
        title: "Search existing sessions",
        detail: "Use the search bar to filter sessions by name.",
      },
      {
        title: "Generate the timetable",
        detail:
          "Select a session to move into the workspace and assign courses, faculty, rooms to slots.",
      },
    ],
    notes: [
      "Marking a new session active changes what students see immediately.",
    ],
  },
  {
    id: "time-table",
    title: "Time Table",
    icon: "Table",
    summary: "View the published timetable for the active academic session.",
    whatItDoes:
      "This is a read view of the timetable currently generated for the active session — the same view students see for their batch.",
    steps: [
      {
        title: "Viewing the schedule",
        detail:
          "The page automatically loads the active session's schedule and slot data.",
      },
    ],
    notes: [
      "If it looks empty, check that a session is marked Active under Generate Timetable.",
    ],
  },
  {
    id: "faculty-directory",
    title: "Faculty Directory",
    icon: "Users",
    summary: "Manage the list of faculty members and their invite status.",
    whatItDoes:
      "This is the master list of faculty in the department. Faculty must exist here before they can be assigned to courses or slots.",
    steps: [
      {
        title: "Add a single faculty member",
        detail:
          "Click 'Add Faculty', enter their ID, name, department, then save.",
      },
      {
        title: "Understanding invite status",
        detail:
          "Accepted / Pending / Uninvited — tracks whether they've set up their account.",
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
      "Courses are defined with a code, nature (Core / Minor / Elective / Project / Seminar), and type (Theory / Lab).",
    steps: [
      {
        title: "Add courses",
        detail: "Click 'Add Course' — one at a time or in bulk.",
      },
      {
        title: "Review before saving",
        detail: "New courses show an 'Unsaved Changes' banner until confirmed.",
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
      "A batch represents a group of students in a specific department and semester (e.g. CSE Semester 4).",
    steps: [
      {
        title: "Add a batch",
        detail: "Click 'Add Batch' and provide name, department, semester.",
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
      "Students can submit bug reports, suggestions, or general feedback, optionally with a star rating.",
    steps: [
      {
        title: "Filter feedback",
        detail: "Use the Type and Status filters to narrow the list.",
      },
      {
        title: "Update status",
        detail: "Open → Reviewed → Resolved, as you triage.",
      },
    ],
    notes: [],
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
      "This section holds access, data-handling, and process rules for admins.",
    steps: [],
    notes: [],
    rules: [],
  },
];

const ICONS = {
  Compass,
  LayoutDashboard,
  CalendarDays,
  Table,
  Users,
  BookOpen,
  Layers,
  MessageSquare,
  ClipboardList,
  ShieldCheck,
};

/* ============================================================
   MOCKUP PRIMITIVES
   Small building blocks used across the fake-UI previews so they
   all feel like one consistent "toy screenshot" system.
   ============================================================ */
const Frame = ({ children }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-950 p-3 overflow-hidden">
    {/* fake window chrome */}
    <div className="flex items-center gap-1.5 mb-2.5 px-0.5">
      <span className="w-2 h-2 rounded-full bg-rose-300 dark:bg-rose-400/60" />
      <span className="w-2 h-2 rounded-full bg-amber-300 dark:bg-amber-400/60" />
      <span className="w-2 h-2 rounded-full bg-emerald-300 dark:bg-emerald-400/60" />
    </div>
    <div className="rounded-lg bg-white dark:bg-slate-900 p-3">{children}</div>
  </div>
);

const Bar = ({
  w = "w-full",
  h = "h-2",
  tone = "bg-slate-200 dark:bg-slate-700",
}) => <div className={`${w} ${h} rounded-full ${tone}`} />;

const Pill = ({ children, tone }) => (
  <span
    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${tone}`}
  >
    {children}
  </span>
);

const toneMap = {
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  closed: "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
  accepted:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  uninvited:
    "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
  bug: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  suggestion: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  open: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  reviewed: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
};

/* ============================================================
   PER-SECTION MOCKUPS
   ============================================================ */
const GettingStartedMockup = () => (
  <Frame>
    <div className="flex gap-3">
      <div className="w-16 shrink-0 flex flex-col gap-1.5">
        {[LayoutDashboard, CalendarDays, Table, Users, BookOpen].map(
          (Icon, i) => (
            <div
              key={i}
              className={`flex items-center gap-1 rounded-md px-1.5 py-1 ${
                i === 0 ? "bg-slate-900 dark:bg-white" : ""
              }`}
            >
              <Icon
                size={10}
                className={
                  i === 0 ? "text-white dark:text-black" : "text-slate-400"
                }
              />
              <Bar
                w="w-6"
                h="h-1.5"
                tone={
                  i === 0
                    ? "bg-white/60 dark:bg-black/40"
                    : "bg-slate-200 dark:bg-slate-700"
                }
              />
            </div>
          ),
        )}
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Bar w="w-20" h="h-2.5" />
          <div className="flex items-center gap-1.5">
            <Sun size={11} className="text-amber-400" />
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-9 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
            />
          ))}
        </div>
        <Bar
          w="w-full"
          h="h-10"
          tone="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-md"
        />
      </div>
    </div>
  </Frame>
);

const OverviewMockup = () => (
  <Frame>
    <div className="grid grid-cols-5 gap-1.5 mb-2.5">
      {["Faculty", "Courses", "Batches", "Sessions", "Rooms"].map(
        (label, i) => (
          <div
            key={label}
            className="rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1.5 flex flex-col gap-1"
          >
            <span className="text-[8px] text-slate-400 truncate">{label}</span>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
              {[24, 38, 12, 3, 9][i]}
            </span>
          </div>
        ),
      )}
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-md border border-slate-100 dark:border-slate-700 p-2 flex flex-col gap-1.5">
        <Bar w="w-16" h="h-1.5" />
        {["Odd Sem 2026", "Even Sem 2025"].map((s, i) => (
          <div key={s} className="flex items-center justify-between">
            <span className="text-[9px] text-slate-500 dark:text-slate-400">
              {s}
            </span>
            <Pill tone={toneMap[i === 0 ? "active" : "closed"]}>
              {i === 0 ? "Active" : "Closed"}
            </Pill>
          </div>
        ))}
      </div>
      <div className="rounded-md border border-slate-100 dark:border-slate-700 p-2 flex flex-col gap-1.5 justify-center">
        <Bar w="w-14" h="h-1.5" />
        <div className="flex items-end gap-1 h-8">
          {[60, 90, 40, 75, 55].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-emerald-300 dark:bg-emerald-600/60 rounded-sm"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  </Frame>
);

const GenerateTimetableMockup = () => (
  <Frame>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1 rounded-md bg-slate-50 dark:bg-slate-800 px-1.5 py-1 w-28">
        <Search size={9} className="text-slate-400" />
        <Bar w="w-16" h="h-1.5" />
      </div>
      <div className="flex items-center gap-1 rounded-md bg-emerald-600 text-white px-2 py-1">
        <Plus size={9} />
        <span className="text-[9px] font-semibold">Add Session</span>
      </div>
    </div>
    <div className="flex flex-col gap-1.5">
      {[
        ["Odd Semester 2026", "active"],
        ["Even Semester 2025", "closed"],
        ["Odd Semester 2025", "closed"],
      ].map(([name, status]) => (
        <div
          key={name}
          className="flex items-center justify-between rounded-md border border-slate-100 dark:border-slate-700 px-2 py-1.5"
        >
          <span className="text-[9px] text-slate-600 dark:text-slate-300">
            {name}
          </span>
          <Pill tone={toneMap[status]}>
            {status === "active" ? "Active" : "Closed"}
          </Pill>
        </div>
      ))}
    </div>
  </Frame>
);

const TimeTableMockup = () => (
  <Frame>
    <div className="grid grid-cols-6 gap-1">
      <div />
      {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
        <span
          key={d}
          className="text-[8px] font-semibold text-slate-400 text-center"
        >
          {d}
        </span>
      ))}
      {[1, 2, 3].map((row) => (
        <React.Fragment key={row}>
          <span className="text-[8px] text-slate-400 self-center">P{row}</span>
          {[0, 1, 2, 3, 4].map((col) => {
            const filled = (row + col) % 3 !== 0;
            return (
              <div
                key={col}
                className={`h-6 rounded-sm ${
                  filled
                    ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800"
                    : "bg-slate-50 dark:bg-slate-800/60"
                }`}
              />
            );
          })}
        </React.Fragment>
      ))}
    </div>
  </Frame>
);

const FacultyDirectoryMockup = () => (
  <Frame>
    <div className="flex items-center justify-between mb-2">
      <Bar w="w-20" h="h-2" />
      <div className="flex items-center gap-1 rounded-md bg-emerald-600 text-white px-2 py-1">
        <Plus size={9} />
        <span className="text-[9px] font-semibold">Add Faculty</span>
      </div>
    </div>
    <div className="flex flex-col gap-1.5">
      {[
        ["Dr. A. Rao", "CSE", "accepted"],
        ["Dr. M. Iyer", "ECE", "pending"],
        ["Dr. S. Nair", "CSE", "uninvited"],
      ].map(([name, dept, status]) => (
        <div
          key={name}
          className="flex items-center justify-between rounded-md border border-slate-100 dark:border-slate-700 px-2 py-1.5"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700" />
            <span className="text-[9px] text-slate-600 dark:text-slate-300">
              {name}
            </span>
            <span className="text-[8px] text-slate-400">{dept}</span>
          </div>
          <Pill tone={toneMap[status]}>
            {status[0].toUpperCase() + status.slice(1)}
          </Pill>
        </div>
      ))}
    </div>
  </Frame>
);

const CourseManagementMockup = () => (
  <Frame>
    <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 px-2 py-1 mb-2 text-[8px] text-amber-600 dark:text-amber-300 font-medium">
      Unsaved changes — review before saving
    </div>
    <div className="flex flex-col gap-1.5">
      {[
        ["CS301 · Data Structures", "Core", "Theory"],
        ["CS302 · DS Lab", "Core", "Lab"],
        ["CS410 · AI Elective", "Elective", "Theory"],
      ].map(([name, nature, type]) => (
        <div
          key={name}
          className="flex items-center justify-between rounded-md border border-slate-100 dark:border-slate-700 px-2 py-1.5"
        >
          <span className="text-[9px] text-slate-600 dark:text-slate-300">
            {name}
          </span>
          <div className="flex gap-1">
            <Pill tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
              {nature}
            </Pill>
            <Pill tone="bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
              {type}
            </Pill>
          </div>
        </div>
      ))}
    </div>
  </Frame>
);

const BatchManagementMockup = () => (
  <Frame>
    <div className="grid grid-cols-3 gap-1.5">
      {[
        "CSE · Sem 4",
        "ECE · Sem 2",
        "CSE · Sem 6",
        "ME · Sem 4",
        "CSE · Sem 2",
        "ECE · Sem 6",
      ].map((b) => (
        <div
          key={b}
          className="rounded-md border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1.5 flex flex-col gap-1 items-center"
        >
          <Layers size={11} className="text-emerald-500" />
          <span className="text-[8px] text-slate-500 dark:text-slate-400 text-center">
            {b}
          </span>
        </div>
      ))}
    </div>
  </Frame>
);

const StudentFeedbackMockup = () => (
  <Frame>
    <div className="flex gap-1 mb-2">
      {["All", "Bug", "Suggestion"].map((f, i) => (
        <span
          key={f}
          className={`text-[8px] px-1.5 py-0.5 rounded-full ${i === 1 ? "bg-slate-900 text-white dark:bg-white dark:text-black" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}
        >
          {f}
        </span>
      ))}
    </div>
    <div className="flex flex-col gap-1.5">
      {[
        [Bug, "Timetable clash on Wed", "open"],
        [MonitorPlay, "Dark mode contrast", "reviewed"],
      ].map(([Icon, text, status]) => (
        <div
          key={text}
          className="rounded-md border border-slate-100 dark:border-slate-700 px-2 py-1.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Icon size={10} className="text-rose-400" />
              <span className="text-[9px] text-slate-600 dark:text-slate-300">
                {text}
              </span>
            </div>
            <Pill tone={toneMap[status]}>
              {status[0].toUpperCase() + status.slice(1)}
            </Pill>
          </div>
          <div className="flex gap-0.5 mt-1">
            {[0, 1, 2].map((i) => (
              <Star
                key={i}
                size={8}
                className="text-amber-400 fill-amber-400"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </Frame>
);

const PendingRequestsMockup = () => (
  <Frame>
    <div className="h-24 rounded-md border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1">
      <ClipboardList size={16} className="text-slate-300 dark:text-slate-600" />
      <span className="text-[9px] text-slate-400">Coming soon</span>
    </div>
  </Frame>
);

const RulesPoliciesMockup = () => (
  <Frame>
    <div className="flex flex-col gap-1.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-1.5">
          <ShieldCheck size={10} className="text-emerald-500 shrink-0" />
          <Bar w={i === 2 ? "w-3/4" : "w-full"} h="h-1.5" />
        </div>
      ))}
    </div>
  </Frame>
);

const VISUALS = {
  "getting-started": GettingStartedMockup,
  overview: OverviewMockup,
  "generate-timetable": GenerateTimetableMockup,
  "time-table": TimeTableMockup,
  "faculty-directory": FacultyDirectoryMockup,
  "course-management": CourseManagementMockup,
  "batch-management": BatchManagementMockup,
  "student-feedback": StudentFeedbackMockup,
  "pending-requests": PendingRequestsMockup,
  "rules-policies": RulesPoliciesMockup,
};

/* ============================================================
   MAIN PAGE
   ============================================================ */
const Documentation = () => {
  const [activeId, setActiveId] = useState(docSections[0]?.id);
  const [query, setQuery] = useState("");
  const [openSidebar, setOpenSidebar] = useState(false);
  const [dark, setDark] = useState(false);

  const filteredSections = useMemo(() => {
    if (!query.trim()) return docSections;
    const q = query.toLowerCase();
    return docSections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q),
    );
  }, [query]);

  const active = docSections.find((s) => s.id === activeId) || docSections[0];
  const ActiveIcon = ICONS[active?.icon] || Info;
  const whatItDoesParagraphs = Array.isArray(active?.whatItDoes)
    ? active.whatItDoes
    : [active?.whatItDoes].filter(Boolean);
  const VisualComponent = VISUALS[active?.id];

  return (
    <div className={dark ? "dark" : ""}>
      <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-[#020617] transition-colors duration-300">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-sm font-bold text-slate-700 dark:text-white">
            Admin Panel
          </span>
          <button
            onClick={() => setDark((d) => !d)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {dark ? (
              <Moon size={16} className="text-slate-300" />
            ) : (
              <Sun size={16} className="text-amber-400" />
            )}
          </button>
        </div>

        {openSidebar && (
          <div
            onClick={() => setOpenSidebar(false)}
            className="fixed inset-0 bg-black/40 z-50 md:hidden"
          />
        )}

        <div className="flex flex-1 w-full overflow-hidden">
          <div
            className={`fixed md:static top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 ${openSidebar ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 flex flex-col px-4 py-5`}
          >
            <div className="flex justify-end md:hidden mb-4">
              <X
                onClick={() => setOpenSidebar(false)}
                className="cursor-pointer text-slate-900 dark:text-white"
              />
            </div>
            <h1 className="text-lg font-bold text-emerald-600 dark:text-emerald-500 px-2">
              Admin Guide
            </h1>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
              Documentation
            </h2>
            <div className="relative mb-3 px-2">
              <Search
                size={14}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search topics..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 border border-transparent focus:border-emerald-400 focus:outline-none transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto">
              {filteredSections.map((s) => {
                const Icon = ICONS[s.icon] || Info;
                const isActive = s.id === activeId;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveId(s.id);
                      setOpenSidebar(false);
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-200 cursor-pointer ${isActive ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                  >
                    <Icon size={17} className="shrink-0" />
                    <span className="truncate">{s.title}</span>
                  </button>
                );
              })}
              {filteredSections.length === 0 && (
                <p className="text-xs text-slate-400 px-3 py-4 text-center">
                  No topics match "{query}"
                </p>
              )}
            </div>
            <div className="mt-auto pt-6 text-xs text-slate-400 px-2">
              Admin Dashboard v1.0
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto p-4 md:p-8">
              {active && (
                <div className="flex flex-col gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                        <ActiveIcon
                          size={16}
                          className="text-emerald-600 dark:text-emerald-400"
                        />
                      </div>
                      <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                        {active.title}
                      </h1>
                    </div>
                    <p className="text-sm text-slate-400 dark:text-slate-500">
                      {active.summary}
                    </p>
                  </div>

                  {/* NEW: Preview panel — illustrated mockup of the actual screen */}
                  {VisualComponent && (
                    <div>
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                        Preview
                      </h2>
                      <VisualComponent />
                    </div>
                  )}

                  {whatItDoesParagraphs.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-5">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                        What it does
                      </h2>
                      <div className="flex flex-col gap-2">
                        {whatItDoesParagraphs.map((p, i) => (
                          <p
                            key={i}
                            className="text-sm leading-relaxed text-slate-600 dark:text-slate-300"
                          >
                            {p}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {active.steps?.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-5">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                        How to use it
                      </h2>
                      <div className="flex flex-col">
                        {active.steps.map((step, i) => (
                          <div key={i} className="flex gap-3 relative">
                            <div className="flex flex-col items-center">
                              <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[11px] font-bold shrink-0">
                                {i + 1}
                              </div>
                              {i < active.steps.length - 1 && (
                                <div className="w-px flex-1 bg-slate-100 dark:bg-slate-800 my-1" />
                              )}
                            </div>
                            <div className="pb-5">
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                {step.title}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                {step.detail}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {active.notes?.length > 0 && (
                    <div className="bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-2xl p-5">
                      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3">
                        <Lightbulb size={13} />
                        Good to know
                      </h2>
                      <ul className="flex flex-col gap-2">
                        {active.notes.map((note, i) => (
                          <li
                            key={i}
                            className="flex gap-2 text-sm text-amber-700 dark:text-amber-300/90 leading-relaxed"
                          >
                            <ChevronRight
                              size={14}
                              className="shrink-0 mt-0.5"
                            />
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {active.rules && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-5">
                      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                        <ShieldCheck size={13} />
                        Rules
                      </h2>
                      {active.rules.length === 0 ? (
                        <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                          No rules added yet.
                        </p>
                      ) : (
                        <ul className="flex flex-col gap-2">
                          {active.rules.map((rule, i) => (
                            <li
                              key={i}
                              className="flex gap-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
                            >
                              <ChevronRight
                                size={14}
                                className="shrink-0 mt-0.5 text-emerald-500"
                              />
                              <span>{rule}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setOpenSidebar(true)}
          className="md:hidden fixed bottom-6 right-6 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:scale-105 transition z-40"
        >
          <Menu size={24} />
        </button>
      </div>
    </div>
  );
};

export default Documentation;
