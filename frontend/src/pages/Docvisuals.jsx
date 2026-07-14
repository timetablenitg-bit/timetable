// docVisuals.jsx
// Illustrated "toy screenshot" previews for the Admin Documentation page.
// Import { VISUALS } from "./docVisuals" in Documentation.jsx and render
// VISUALS[active.id] wherever you want the preview to show.
//
// To add a preview for a new section: build a small component using the
// Frame/Bar/Pill primitives below, then add it to the VISUALS map with a
// key matching that section's `id` in docsContent.js.

import React from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Table,
  Users,
  BookOpen,
  Layers,
  ClipboardList,
  ShieldCheck,
  ShieldAlert,
  Sun,
  Search,
  Plus,
  Star,
  Bug,
  MonitorPlay,
  GraduationCap,
  CheckSquare,
  CalendarRange,
  ChevronDown,
  Check,
  Loader2,
  ClipboardCheck,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";

/* ============================================================
   MOCKUP PRIMITIVES
   ============================================================ */
export const Frame = ({ children }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-950 p-5 overflow-hidden">
    <div className="flex items-center gap-2 mb-4 px-0.5">
      <span className="w-3 h-3 rounded-full bg-rose-300 dark:bg-rose-400/60" />
      <span className="w-3 h-3 rounded-full bg-amber-300 dark:bg-amber-400/60" />
      <span className="w-3 h-3 rounded-full bg-emerald-300 dark:bg-emerald-400/60" />
    </div>
    <div className="rounded-lg bg-white dark:bg-slate-900 p-5">{children}</div>
  </div>
);

export const Bar = ({
  w = "w-full",
  h = "h-3",
  tone = "bg-slate-200 dark:bg-slate-700",
}) => <div className={`${w} ${h} rounded-full ${tone}`} />;

export const Pill = ({ children, tone }) => (
  <span
    className={`text-[13px] font-semibold px-2.5 py-1 rounded-full ${tone}`}
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
  open: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  reviewed: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  warn: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

/* ============================================================
   Small helper: a numbered pipeline stage, used by the detailed
   Generate Timetable preview below. Keeps every stage visually
   consistent (number badge + label + connecting arrow).
   ============================================================ */
const Stage = ({ n, label, children, last }) => (
  <div className="flex flex-col">
    <div className="flex items-center gap-3 mb-2.5">
      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[13px] font-bold flex items-center justify-center shrink-0">
        {n}
      </span>
      <span className="text-[14px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {label}
      </span>
    </div>
    <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5">
      {children}
    </div>
    {!last && (
      <div className="flex justify-center py-2">
        <ChevronDown size={16} className="text-slate-300 dark:text-slate-600" />
      </div>
    )}
  </div>
);

/* ============================================================
   PER-SECTION MOCKUPS
   ============================================================ */
const GettingStartedMockup = () => (
  <Frame>
    <div className="flex gap-5">
      <div className="w-24 shrink-0 flex flex-col gap-2.5">
        {[LayoutDashboard, CalendarDays, Table, Users, BookOpen].map(
          (Icon, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 ${
                i === 0 ? "bg-slate-900 dark:bg-white" : ""
              }`}
            >
              <Icon
                size={14}
                className={
                  i === 0 ? "text-white dark:text-black" : "text-slate-400"
                }
              />
              <Bar
                w="w-9"
                h="h-2"
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
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Bar w="w-28" h="h-3.5" />
          <div className="flex items-center gap-2">
            <Sun size={15} className="text-amber-400" />
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-14 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
            />
          ))}
        </div>
        <Bar
          w="w-full"
          h="h-16"
          tone="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-md"
        />
      </div>
    </div>
  </Frame>
);

const OverviewMockup = () => (
  <Frame>
    <div className="grid grid-cols-5 gap-2.5 mb-4">
      {["Faculty", "Courses", "Batches", "Sessions", "Rooms"].map(
        (label, i) => (
          <div
            key={label}
            className="rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 flex flex-col gap-1.5"
          >
            <span className="text-[11px] text-slate-400 truncate">{label}</span>
            <span className="text-[17px] font-bold text-slate-700 dark:text-slate-200">
              {[24, 38, 12, 3, 9][i]}
            </span>
          </div>
        ),
      )}
    </div>
    <div className="grid grid-cols-2 gap-3.5">
      <div className="rounded-md border border-slate-100 dark:border-slate-700 p-3.5 flex flex-col gap-2.5">
        <Bar w="w-24" h="h-2" />
        {["Odd Sem 2026", "Even Sem 2025"].map((s, i) => (
          <div key={s} className="flex items-center justify-between">
            <span className="text-[13px] text-slate-500 dark:text-slate-400">
              {s}
            </span>
            <Pill tone={toneMap[i === 0 ? "active" : "closed"]}>
              {i === 0 ? "Active" : "Closed"}
            </Pill>
          </div>
        ))}
      </div>
      <div className="rounded-md border border-slate-100 dark:border-slate-700 p-3.5 flex flex-col gap-2.5 justify-center">
        <Bar w="w-20" h="h-2" />
        <div className="flex items-end gap-1.5 h-12">
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

/* ------------------------------------------------------------
   Generate Timetable — DETAILED PIPELINE PREVIEW
   Walks through all four workspace tabs so an admin who's stuck
   can match what's on their screen to a stage here:
     1. Create/select a session
     2. Assign courses + faculty per batch (Course Assignments tab)
     3. Generate (Finalized Assignments tab → engine run)
     4. Review the result (score, pending review items, export)
   ------------------------------------------------------------ */
const GenerateTimetableMockup = () => (
  <Frame>
    <div className="flex flex-col">
      {/* Stage 1 — Sessions list */}
      <Stage n={1} label="Create / select a session">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 w-36">
            <Search size={12} className="text-slate-400" />
            <Bar w="w-16" h="h-2" />
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-emerald-600 text-white px-2.5 py-1.5">
            <Plus size={12} />
            <span className="text-[12px] font-semibold">Add Session</span>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 px-3 py-2">
          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200">
            Odd Semester 2026
          </span>
          <Pill tone={toneMap.active}>Active</Pill>
        </div>
      </Stage>

      {/* Stage 2 — workspace tabs + course assignment row */}
      <Stage n={2} label="Assign courses & faculty per batch">
        <div className="flex items-center gap-4 mb-3 border-b border-slate-200 dark:border-slate-700 pb-1.5">
          {[
            [GraduationCap, "Registration", false],
            [BookOpen, "Assignments", true],
            [CheckSquare, "Finalized", false],
            [CalendarRange, "Timetable", false],
          ].map(([Icon, label, active]) => (
            <div
              key={label}
              className={`flex items-center gap-1.5 pb-1.5 ${
                active
                  ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "text-slate-400"
              }`}
            >
              <Icon size={13} />
              <span className="text-[12px] font-medium">{label}</span>
            </div>
          ))}
        </div>
        <div className="rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
            CSE · Sem 4
          </span>
          <div className="flex items-center gap-1.5">
            <Bar
              w="w-24"
              h="h-6"
              tone="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
            />
            <Bar
              w="w-20"
              h="h-6"
              tone="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
            />
            <Pill tone="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
              Lecture
            </Pill>
          </div>
        </div>
      </Stage>

      {/* Stage 3 — Finalized → Generate */}
      <Stage n={3} label="Finalized Assignments → Generate">
        <div className="flex items-center justify-center mb-2.5">
          <div className="flex items-center gap-1.5 rounded-md bg-emerald-600 text-white px-3 py-1.5">
            <Loader2 size={13} className="animate-spin" />
            <span className="text-[12px] font-semibold">
              Generate Timetable
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {["Fetching assignments", "Building slot map", "Running engine"].map(
            (s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <Check
                  size={12}
                  className={
                    i < 2
                      ? "text-emerald-500"
                      : "text-slate-300 dark:text-slate-600"
                  }
                />
                <span className="text-[12px] text-slate-500 dark:text-slate-400">
                  {s}…
                </span>
              </div>
            ),
          )}
        </div>
      </Stage>

      {/* Stage 4 — result */}
      <Stage n={4} label="Review result & publish" last>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <ClipboardCheck size={13} className="text-amber-500" />
            <span className="text-[12px] text-slate-500 dark:text-slate-400">
              Review
            </span>
            <span className="flex items-center justify-center min-w-[16px] h-4 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none">
              2
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Pill tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
              Score 92
            </Pill>
            <FileSpreadsheet size={14} className="text-emerald-500" />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className={`h-4 rounded-sm ${
                i % 4 === 0
                  ? "bg-slate-50 dark:bg-slate-800/60"
                  : "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800"
              }`}
            />
          ))}
        </div>
      </Stage>
    </div>
  </Frame>
);

const TimeTableMockup = () => (
  <Frame>
    <div className="grid grid-cols-6 gap-1.5">
      <div />
      {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
        <span
          key={d}
          className="text-[12px] font-semibold text-slate-400 text-center"
        >
          {d}
        </span>
      ))}
      {[1, 2, 3].map((row) => (
        <React.Fragment key={row}>
          <span className="text-[12px] text-slate-400 self-center">P{row}</span>
          {[0, 1, 2, 3, 4].map((col) => {
            const filled = (row + col) % 3 !== 0;
            return (
              <div
                key={col}
                className={`h-9 rounded-sm ${
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
    <div className="flex items-center justify-between mb-3">
      <Bar w="w-28" h="h-3" />
      <div className="flex items-center gap-1.5 rounded-md bg-emerald-600 text-white px-3 py-1.5">
        <Plus size={13} />
        <span className="text-[12px] font-semibold">Add Faculty</span>
      </div>
    </div>
    <div className="flex flex-col gap-2.5">
      {[
        ["Dr. A. Rao", "CSE", "accepted"],
        ["Dr. M. Iyer", "ECE", "pending"],
        ["Dr. S. Nair", "CSE", "uninvited"],
      ].map(([name, dept, status]) => (
        <div
          key={name}
          className="flex items-center justify-between rounded-md border border-slate-100 dark:border-slate-700 px-3 py-2.5"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700" />
            <span className="text-[13px] text-slate-600 dark:text-slate-300">
              {name}
            </span>
            <span className="text-[12px] text-slate-400">{dept}</span>
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
    <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 px-3 py-2 mb-3 text-[12px] text-amber-600 dark:text-amber-300 font-medium">
      Unsaved changes — review before saving
    </div>
    <div className="flex flex-col gap-2.5">
      {[
        ["CS301 · Data Structures", "Core", "Theory"],
        ["CS302 · DS Lab", "Core", "Lab"],
        ["CS410 · AI Elective", "Elective", "Theory"],
      ].map(([name, nature, type]) => (
        <div
          key={name}
          className="flex items-center justify-between rounded-md border border-slate-100 dark:border-slate-700 px-3 py-2.5"
        >
          <span className="text-[13px] text-slate-600 dark:text-slate-300">
            {name}
          </span>
          <div className="flex gap-1.5">
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
    <div className="grid grid-cols-3 gap-2.5">
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
          className="rounded-md border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 flex flex-col gap-1.5 items-center"
        >
          <Layers size={16} className="text-emerald-500" />
          <span className="text-[12px] text-slate-500 dark:text-slate-400 text-center">
            {b}
          </span>
        </div>
      ))}
    </div>
  </Frame>
);

const StudentFeedbackMockup = () => (
  <Frame>
    <div className="flex gap-1.5 mb-3">
      {["All", "Bug", "Suggestion"].map((f, i) => (
        <span
          key={f}
          className={`text-[12px] px-2.5 py-1 rounded-full ${i === 1 ? "bg-slate-900 text-white dark:bg-white dark:text-black" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}
        >
          {f}
        </span>
      ))}
    </div>
    <div className="flex flex-col gap-2.5">
      {[
        [Bug, "Timetable clash on Wed", "open"],
        [MonitorPlay, "Dark mode contrast", "reviewed"],
      ].map(([Icon, text, status]) => (
        <div
          key={text}
          className="rounded-md border border-slate-100 dark:border-slate-700 px-3 py-2.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon size={14} className="text-rose-400" />
              <span className="text-[13px] text-slate-600 dark:text-slate-300">
                {text}
              </span>
            </div>
            <Pill tone={toneMap[status]}>
              {status[0].toUpperCase() + status.slice(1)}
            </Pill>
          </div>
          <div className="flex gap-1 mt-1.5">
            {[0, 1, 2].map((i) => (
              <Star
                key={i}
                size={12}
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
    <div className="h-36 rounded-md border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2">
      <ClipboardList size={24} className="text-slate-300 dark:text-slate-600" />
      <span className="text-[13px] text-slate-400">Coming soon</span>
    </div>
  </Frame>
);

/* Rules & Policies — now themed around "things that break the app" rather
   than generic checkmarks, to match the actual content in docsContent.js. */
const RulesPoliciesMockup = () => (
  <Frame>
    <div className="flex flex-col gap-2.5">
      {[
        {
          icon: ShieldAlert,
          text: "Course missing department/nature",
          w: "w-full",
        },
        {
          icon: AlertTriangle,
          text: "Assignment row missing faculty",
          w: "w-5/6",
        },
        {
          icon: ShieldCheck,
          text: "Only one active session enforced",
          w: "w-3/4",
        },
      ].map(({ icon: Icon, text, w }, i) => (
        <div key={i} className="flex items-center gap-2">
          <Icon
            size={14}
            className={
              i === 2 ? "text-emerald-500 shrink-0" : "text-amber-500 shrink-0"
            }
          />
          <span className="text-[12px] text-slate-500 dark:text-slate-400 truncate">
            {text}
          </span>
        </div>
      ))}
    </div>
  </Frame>
);

export const VISUALS = {
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
   STEP-LEVEL VISUALS — one accurate mini-mockup per step in the
   "Generate Timetable" walkthrough (docsContent.js → generate-timetable
   → steps[i].visual). These are deliberately smaller/lighter than the
   top Preview panel (no window-chrome Frame) so they read as inline
   screenshots sitting next to the step text, not another full preview.
   Colors/labels are pulled from the real components (colors.js,
   constants.js, ScoreBadge.jsx, CreateSessionModal.jsx, etc.) so they
   actually match what's on screen.
   ============================================================ */
export const MiniPreview = ({ children }) => (
  <div className="mt-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
    {children}
  </div>
);

// Step 1 — Create / select a session (mirrors CreateSessionModal.jsx header
// gradient + SessionList row with Active pill)
const Step1_CreateSession = () => (
  <MiniPreview>
    <div className="rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-3 py-1.5 flex items-center justify-between">
        <span className="text-[12px] font-bold text-white">
          Create New Academic Session
        </span>
        <span className="text-white text-[13px]">×</span>
      </div>
      <div className="bg-white dark:bg-slate-900 p-3 flex flex-col gap-2.5">
        <div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Session Name *
          </span>
          <div className="mt-1 flex items-center gap-1.5 rounded border border-slate-300 dark:border-slate-600 px-2 py-1.5">
            <CalendarDays size={12} className="text-slate-400" />
            <span className="text-[12px] text-slate-400">e.g., 2026</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded border border-slate-300 dark:border-slate-600 px-2 py-1.5 w-24">
          <span className="text-[12px] text-slate-500 dark:text-slate-300">
            EVEN
          </span>
        </div>
      </div>
    </div>
    <div className="mt-2.5 flex items-center justify-between rounded-md bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5">
      <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200">
        Odd Semester 2026
      </span>
      <Pill tone={toneMap.active}>Active</Pill>
    </div>
  </MiniPreview>
);

// Step 2 — Course Registration tab (mirrors CourseRegsitrationTab.jsx stats bar)
const Step2_CourseRegistration = () => (
  <MiniPreview>
    <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-3 py-2.5 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
          CSE Sem 4 · 62 students
        </span>
        <div className="flex gap-1.5">
          <Pill tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            54 completed
          </Pill>
          <Pill tone="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            8 not started
          </Pill>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 py-2.5">
        {[
          ["62", "Total"],
          ["54", "Completed"],
          ["8", "Not Started"],
        ].map(([v, l]) => (
          <div key={l} className="flex flex-col items-center">
            <span className="text-[13px] font-bold text-slate-700 dark:text-slate-100">
              {v}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400">
              {l}
            </span>
          </div>
        ))}
      </div>
    </div>
  </MiniPreview>
);

// Step 3 — Course Assignments table row (mirrors BatchAssignmentCard.jsx
// desktop table columns: # / Course / Faculty / Type / Component / Sess-wk / Links)
const Step3_AssignmentRow = () => (
  <MiniPreview>
    <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="grid grid-cols-6 gap-1 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5">
        {["Course", "Faculty", "Type", "Comp.", "Wk", "Links"].map((h) => (
          <span
            key={h}
            className="text-[10px] font-medium text-slate-400 truncate"
          >
            {h}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-1 px-2.5 py-2.5 items-center border-t border-slate-100 dark:border-slate-800">
        <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
          CS301
        </span>
        <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
          Dr. A. Rao
        </span>
        <Pill tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          Reg
        </Pill>
        <Pill tone="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
          Lec
        </Pill>
        <span className="text-[11px] text-slate-500 text-center">3</span>
        <span className="text-[11px] text-slate-300">—</span>
      </div>
      <div className="grid grid-cols-6 gap-1 px-2.5 py-2.5 items-center border-t border-slate-100 dark:border-slate-800 bg-violet-50/40 dark:bg-violet-900/10">
        <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
          Elective Slot
        </span>
        <span className="text-[11px] text-amber-500 truncate">
          pick elective ↴
        </span>
        <Pill tone="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          OE
        </Pill>
        <Pill tone="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
          Lec
        </Pill>
        <span className="text-[11px] text-slate-500 text-center">1</span>
        <span className="text-[11px] text-slate-300">—</span>
      </div>
    </div>
  </MiniPreview>
);

// Step 4 — Shared Lab / Synced With pickers (mirrors SharedLabPicker.jsx /
// SyncedWithPicker.jsx "Links" column popovers)
const Step4_LinkPickers = () => (
  <MiniPreview>
    <div className="flex flex-col gap-2.5">
      <div className="rounded-md border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-900/10 px-3 py-2.5">
        <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
          Shared Lab
        </span>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          DS Lab · SecA ↔ DS Lab · SecB
        </p>
      </div>
      <div className="rounded-md border border-sky-200 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-900/10 px-3 py-2.5">
        <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">
          Synced With
        </span>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          AI Elective · CSE-A ↔ AI Elective · CSE-B
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-[10.5px] text-amber-600 dark:text-amber-400">
        <AlertTriangle size={12} />
        same faculty on both sides — confirm before linking
      </div>
    </div>
  </MiniPreview>
);

// Step 5 — Save assignments (mirrors BatchAssignmentCard.jsx progress bar +
// the "incomplete rows" error banner from useCourseAssignmentSave.js)
const Step5_SaveBatch = () => (
  <MiniPreview>
    <div className="flex items-center justify-between mb-2.5">
      <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
        CSE · Sem 4
      </span>
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500" style={{ width: "70%" }} />
        </div>
        <span className="text-[11px] text-slate-400">7/10</span>
      </div>
    </div>
    <div className="flex items-center gap-1.5 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-2.5 py-1.5">
      <AlertTriangle size={12} className="text-red-500 shrink-0" />
      <span className="text-[10.5px] text-red-600 dark:text-red-400">
        Fill in all course and faculty fields before saving.
      </span>
    </div>
  </MiniPreview>
);

// Step 6 — Finalized Assignments (grouped-by-batch list + Generate button)
const Step6_Finalized = () => (
  <MiniPreview>
    <div className="flex flex-col gap-1.5">
      {["CSE · Sem 4 (10 assignments)", "ECE · Sem 2 (6 assignments)"].map(
        (b) => (
          <div
            key={b}
            className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5"
          >
            <span className="text-[11px] text-slate-600 dark:text-slate-300">
              {b}
            </span>
            <ChevronDown size={12} className="text-slate-400" />
          </div>
        ),
      )}
    </div>
    <div className="flex justify-center mt-2.5">
      <div className="flex items-center gap-1.5 rounded-md bg-emerald-600 text-white px-4 py-1.5">
        <span className="text-[11px] font-semibold">Generate Timetable</span>
      </div>
    </div>
  </MiniPreview>
);

// Step 7 — Generation progress modal (mirrors the Sparkles/progress-bar modal
// in FinalizedAssignmentTab.jsx)
const Step7_GenerationModal = () => (
  <MiniPreview>
    <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 flex flex-col items-center text-center">
      <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-1.5">
        <Loader2 size={15} className="text-emerald-500 animate-spin" />
      </div>
      <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
        Generating timetable
      </span>
      <span className="text-[10.5px] text-slate-400 mb-2.5">
        Please wait — do not close this page
      </span>
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1.5">
        <div className="h-full bg-emerald-500" style={{ width: "60%" }} />
      </div>
      <span className="text-[10.5px] text-slate-400">
        Running placement engine…
      </span>
    </div>
  </MiniPreview>
);

// Step 8 — Generated Timetable sub-tabs + Score badge (mirrors
// GeneratedTimetableTab.jsx BASE_TABS + ScoreBadge.jsx color thresholds)
const Step8_ResultTabs = () => (
  <MiniPreview>
    <div className="flex items-center justify-between mb-2.5">
      <div className="flex gap-3">
        {[
          [Table, "Schedule", true],
          [LayoutDashboard, "Slots", false],
          [CalendarDays, "Institute", false],
          [ClipboardCheck, "Review", false],
        ].map(([Icon, label, active]) => (
          <div
            key={label}
            className={`flex items-center gap-1 pb-1 ${
              active
                ? "border-b-2 border-emerald-500 text-slate-700 dark:text-slate-100"
                : "text-slate-400"
            }`}
          >
            <Icon size={12} />
            <span className="text-[11px] font-medium">{label}</span>
            {label === "Review" && (
              <span className="flex items-center justify-center min-w-[14px] h-3.5 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                2
              </span>
            )}
          </div>
        ))}
      </div>
      <Pill tone="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400">
        ★ Score 92
      </Pill>
    </div>
    <div className="grid grid-cols-5 gap-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className={`h-5 rounded-sm border ${
            i % 3 === 0
              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
              : i % 3 === 1
                ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700"
                : "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600"
          }`}
        />
      ))}
    </div>
  </MiniPreview>
);

// Step 9 — Manual Review panel (mirrors ManualReviewPanel.jsx step tracker:
// Pick Occurrences → Unplaced → Overflow)
const Step9_ManualReview = () => (
  <MiniPreview>
    <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
          CSE · Sem 4
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {[
          ["Pick Occurrences", "done"],
          ["Unplaced", "active"],
          ["Overflow", "locked"],
        ].map(([label, state], i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold ${
                  state === "done"
                    ? "bg-emerald-500 text-white"
                    : state === "active"
                      ? "bg-amber-500 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                }`}
              >
                {state === "done" ? <Check size={10} /> : i + 1}
              </span>
              <span
                className={`text-[10.5px] ${state === "locked" ? "text-slate-300 dark:text-slate-600" : "text-slate-600 dark:text-slate-300"}`}
              >
                {label}
              </span>
            </div>
            {i < 2 && (
              <div className="w-4 h-px bg-slate-200 dark:bg-slate-700" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  </MiniPreview>
);

// Step 10 — Manual grid edit + EditToolbar (Cancel/Save, warnings on save)
const Step10_ManualEdit = () => (
  <MiniPreview>
    <div className="flex items-center justify-between rounded-md bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 px-3 py-2 mb-2.5">
      <span className="text-[10.5px] text-indigo-600 dark:text-indigo-300">
        Drag a cell to move it, click + to add. Local until saved.
      </span>
      <div className="flex gap-1.5 shrink-0">
        <span className="text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-500">
          Cancel
        </span>
        <span className="text-[11px] px-2 py-1 rounded bg-emerald-500 text-white font-semibold">
          Save
        </span>
      </div>
    </div>
    <div className="flex items-center gap-1.5 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2.5 py-1.5">
      <AlertTriangle size={12} className="text-amber-500 shrink-0" />
      <span className="text-[10.5px] text-amber-700 dark:text-amber-300">
        Dr. Rao is double-booked Tue P3 — review before leaving edit mode.
      </span>
    </div>
  </MiniPreview>
);

// Step 11 — Export to Excel (icon button, disabled until a generation exists)
const Step11_Export = () => (
  <MiniPreview>
    <div className="flex items-center gap-3">
      <div className="p-2.5 rounded-md border border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400">
        <FileSpreadsheet size={16} />
      </div>
      <span className="text-[11px] text-slate-500 dark:text-slate-400">
        Enabled once a generation ID exists for this session
      </span>
    </div>
  </MiniPreview>
);

export const STEP_VISUALS = {
  "gt-create-session": Step1_CreateSession,
  "gt-course-registration": Step2_CourseRegistration,
  "gt-assignment-row": Step3_AssignmentRow,
  "gt-link-pickers": Step4_LinkPickers,
  "gt-save-batch": Step5_SaveBatch,
  "gt-finalized": Step6_Finalized,
  "gt-generation-modal": Step7_GenerationModal,
  "gt-result-tabs": Step8_ResultTabs,
  "gt-manual-review": Step9_ManualReview,
  "gt-manual-edit": Step10_ManualEdit,
  "gt-export": Step11_Export,
};
