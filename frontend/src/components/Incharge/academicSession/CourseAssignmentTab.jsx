import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Loader2,
  AlertCircle,
  Search,
  X,
  BookOpen,
  FileText,
  Link,
} from "lucide-react";
import useAdminStore from "../../../store/useAdminStore";

const EVEN_SEMS = new Set([2, 4, 6, 8]);
const ODD_SEMS = new Set([1, 3, 5, 7]);

const DURATION_MAP = { lecture: 1, tutorial: 1, lab: 3 };

const ASSIGNMENT_TYPE_OPTIONS = [
  { value: "regular", label: "Regular" },
  { value: "backlog", label: "Backlog" },
  { value: "minor", label: "Minor" },
  { value: "oe", label: "Open Elective" },
];

const COMPONENT_TYPE_OPTIONS = [
  { value: "lecture", label: "Lecture" },
  { value: "lab", label: "Lab" },
  { value: "tutorial", label: "Tutorial" },
];

const ASSIGNMENT_TYPE_COLORS = {
  regular:
    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  backlog:
    "bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-400",
  minor:
    "bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-400",
  oe: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
};

// ─── Course Search ─────────────────────────────────────────────────────────────
const CourseSearch = ({
  courses,
  allCourses = [],
  value,
  onChange,
  placeholder = "Search course...",
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value ? `${value.course_code} – ${value.course_name}` : "");
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pool = showAll ? allCourses : courses;

  const filtered = pool
    .filter(
      (c) =>
        c.course_name.toLowerCase().includes(query.toLowerCase()) ||
        c.course_code.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 8);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all w-full
          ${
            open
              ? "border-emerald-400 ring-2 ring-emerald-100 dark:ring-emerald-900/30"
              : "border-gray-200 dark:border-gray-600 hover:border-emerald-300"
          } bg-white dark:bg-gray-800`}
      >
        <Search size={14} className="text-gray-400 flex-none" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="bg-transparent outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400 min-w-0"
        />
        {/* Dept / All toggle */}
        {allCourses.length > 0 && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowAll((p) => !p);
              setOpen(true);
            }}
            title={
              showAll ? "Showing all courses" : "Showing dept. courses only"
            }
            className={`flex-none text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${
              showAll
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600"
            }`}
          >
            {showAll ? "ALL" : "DEPT"}
          </button>
        )}
        {value && (
          <X
            size={14}
            className="text-gray-400 hover:text-gray-600 cursor-pointer flex-none"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange(null);
              setQuery("");
              setOpen(false);
            }}
          />
        )}
      </div>

      {open && query.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-400 italic">
              No courses found
              {!showAll && allCourses.length > 0 && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setShowAll(true);
                  }}
                  className="ml-1 text-emerald-500 underline"
                >
                  search all departments?
                </button>
              )}
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => {
                  onChange(c);
                  setQuery(`${c.course_code} – ${c.course_name}`);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {c.course_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {c.course_code} · {c.course_type} · {c.credits} cr · Sem{" "}
                  {c.semester_offered} · {c.department}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ─── Faculty Search ────────────────────────────────────────────────────────────
const FacultySearch = ({
  faculties,
  allFaculties = [],
  value,
  onChange,
  placeholder = "Search faculty...",
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value ? value.name : "");
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pool = showAll ? allFaculties : faculties;

  const filtered = pool
    .filter(
      (f) =>
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.faculty_code.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 8);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all w-full
          ${
            open
              ? "border-emerald-400 ring-2 ring-emerald-100 dark:ring-emerald-900/30"
              : "border-gray-200 dark:border-gray-600 hover:border-emerald-300"
          } bg-white dark:bg-gray-800`}
      >
        <Search size={14} className="text-gray-400 flex-none" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="bg-transparent outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400 min-w-0"
        />
        {/* Global toggle */}
        {allFaculties.length > 0 && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowAll((p) => !p);
              setOpen(true);
            }}
            title={
              showAll ? "Showing all faculties" : "Showing dept. faculties only"
            }
            className={`flex-none text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${
              showAll
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600"
            }`}
          >
            {showAll ? "ALL" : "DEPT"}
          </button>
        )}
        {value && (
          <X
            size={14}
            className="text-gray-400 hover:text-gray-600 cursor-pointer flex-none"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange(null);
              setQuery("");
              setOpen(false);
            }}
          />
        )}
      </div>

      {open && query.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-400 italic">
              No faculty found
              {!showAll && allFaculties.length > 0 && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setShowAll(true);
                  }}
                  className="ml-1 text-emerald-500 underline"
                >
                  search all departments?
                </button>
              )}
            </div>
          ) : (
            filtered.map((f) => (
              <button
                key={f._id}
                type="button"
                onClick={() => {
                  onChange(f);
                  setQuery(f.name);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {f.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {f.faculty_code} · {f.department} · {f.designation}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ─── Compact Select ────────────────────────────────────────────────────────────
const CompactSelect = ({ value, onChange, options, className = "" }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer ${className}`}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const CourseAssignmentTab = ({ session, onSave }) => {
  const {
    batches,
    faculties,
    courses,
    courseAssignments,
    fetchBatches,
    fetchFaculties,
    fetchCourses,
    fetchCourseAssignments,
    bulkUpsertCourseAssignments,
    fetchBacklogStats,
    fetchRegistrationOverview,
  } = useAdminStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState({});
  const [expandedBatches, setExpandedBatches] = useState({});
  const [savingBatch, setSavingBatch] = useState(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [backlogStats, setBacklogStats] = useState([]);
  const [overviewData, setOverviewData] = useState({});
  const [batchErrors, setBatchErrors] = useState({});

  // ── Load all data ────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [, , , , stats, overview] = await Promise.all([
          fetchBatches(),
          fetchFaculties(),
          fetchCourses(),
          fetchCourseAssignments({ session_id: session?._id }),
          fetchBacklogStats(session?._id),
          fetchRegistrationOverview(session?._id),
        ]);
        setBacklogStats(stats ?? []);
        // Build batchId → courseId → studentCount
        const countMap = {};
        for (const { batch, students } of overview ?? []) {
          countMap[batch._id] = {};
          for (const { registration } of students) {
            if (!registration) continue;
            const allEntries = [
              ...(registration.regularCourses || []),
              ...(registration.backlogCourses || []),
            ];
            for (const entry of allEntries) {
              const courseId =
                entry.course?._id?.toString() ?? entry.course?.toString();
              if (!courseId) continue;
              countMap[batch._id][courseId] =
                (countMap[batch._id][courseId] || 0) + 1;
            }
          }
        }
        setOverviewData(countMap);
      } catch {
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };
    if (session?._id) loadData();
  }, [session?._id]);

  // ── Stable batch list for current term ─────────────────────────────────────
  const termSems = session?.term === "EVEN" ? EVEN_SEMS : ODD_SEMS;
  const filteredBatches = useMemo(
    () =>
      batches
        .filter((b) => termSems.has(b.semester))
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.batch_name.localeCompare(b.batch_name);
        }),
    [batches, session?.term],
  );

  // ── Default row factory ─────────────────────────────────────────────────────
  const makeRow = (overrides = {}) => ({
    rowId: crypto.randomUUID(),
    course: null,
    faculty: null,
    assignment_type: "regular",
    component_type: "lecture",
    sessions_per_week: null,
    duration: 1,
    is_combined: false,
    extra_batch_ids: [],
    isManual: false,
    assignmentId: undefined,
    _backlogCount: undefined,
    ...overrides,
  });

  // ── Initialise rows from fetched data ───────────────────────────────────────
  useEffect(() => {
    if (!filteredBatches.length || !courses.length) return;

    const newRows = {};

    filteredBatches.forEach((batch) => {
      const existing = courseAssignments?.filter((a) =>
        a.batch_ids?.some(
          (id) => (id?._id ?? id)?.toString() === batch._id?.toString(),
        ),
      );

      if (existing?.length) {
        newRows[batch._id] = existing.map((a) =>
          makeRow({
            course: courses.find(
              (c) =>
                c._id?.toString() ===
                (a.course_id?._id ?? a.course_id)?.toString(),
            ),
            faculty: faculties.find(
              (f) =>
                f._id?.toString() ===
                (a.faculty_id?._id ?? a.faculty_id)?.toString(),
            ),
            assignment_type: a.assignment_type ?? "regular",
            component_type: a.component_type ?? "lecture",
            sessions_per_week: a.sessions_per_week ?? null,
            duration: a.duration ?? 1,
            is_combined: a.is_combined ?? false,
            extra_batch_ids: (a.batch_ids ?? [])
              .map((id) => (id?._id ?? id)?.toString())
              .filter((id) => id !== batch._id?.toString()),
            assignmentId: a._id,
          }),
        );
      } else {
        const batchCourses = courses.filter((c) => {
          if (batch.semester === 1 || batch.semester === 2) {
            const name = batch.batch_name.toUpperCase();
            const isSecCorD = name.includes("SEC C") || name.includes("SEC D");
            const targetSem = isSecCorD
              ? batch.semester === 1
                ? 2
                : 1
              : batch.semester;
            return Number(c.semester_offered) === targetSem;
          } else {
            return (
              Number(c.semester_offered) === Number(batch.semester) &&
              c.department === batch.department
            );
          }
        });
        newRows[batch._id] = batchCourses.map((course) =>
          makeRow({
            course,
            component_type: course.course_type === "LAB" ? "lab" : "lecture",
            duration: course.course_type === "LAB" ? 3 : 1,
          }),
        );
      }
      const existingCourseIds = new Set(
        (newRows[batch._id] ?? []).map((r) => r.course?._id?.toString()),
      );

      // Only show backlog courses that at least one student from THIS batch registered
      const batchCourseIds = overviewData[batch._id] ?? {};
      const backlogRows = backlogStats
        .filter((s) => {
          const id = s.course._id?.toString();
          return (
            id && !existingCourseIds.has(id) && batchCourseIds[id] > 0 // ← must have at least 1 student from this batch
          );
        })
        .map((s) =>
          makeRow({
            course: s.course,
            assignment_type: "backlog",
            component_type: s.course.course_type === "LAB" ? "lab" : "lecture",
            duration: s.course.course_type === "LAB" ? 3 : 1,
          }),
        );
      newRows[batch._id] = [...(newRows[batch._id] ?? []), ...backlogRows];
    });

    setRows(newRows);
  }, [
    filteredBatches,
    courses,
    courseAssignments,
    faculties,
    backlogStats,
    overviewData,
  ]);

  // ── Row helpers ─────────────────────────────────────────────────────────────
  const toggleBatch = (id) =>
    setExpandedBatches((p) => ({ ...p, [id]: !p[id] }));

  const updateRow = (batchId, rowId, patch) =>
    setRows((prev) => ({
      ...prev,
      [batchId]: prev[batchId].map((r) =>
        r.rowId === rowId ? { ...r, ...patch } : r,
      ),
    }));

  const handleComponentTypeChange = (batchId, rowId, component_type) =>
    updateRow(batchId, rowId, {
      component_type,
      duration: DURATION_MAP[component_type] ?? 1,
    });

  const addRow = (batchId) =>
    setRows((prev) => ({
      ...prev,
      [batchId]: [
        ...(prev[batchId] ?? []),
        makeRow({ assignment_type: "backlog", isManual: true }),
      ],
    }));

  const deleteRow = (batchId, rowId) => {
    if (!window.confirm("Delete this course assignment?")) return;
    setRows((prev) => ({
      ...prev,
      [batchId]: prev[batchId].filter((r) => r.rowId !== rowId),
    }));
  };

  // ── Build API payload ───────────────────────────────────────────────────────
  const buildPayload = (batchId) =>
    (rows[batchId] ?? [])
      .filter((r) => r.course && r.faculty)
      .map((r) => ({
        ...(r.assignmentId ? { _id: r.assignmentId } : {}),
        session_id: session._id,
        batch_ids: [batchId, ...r.extra_batch_ids].filter(Boolean),
        course_id: r.course._id,
        faculty_id: r.faculty._id,
        assignment_type: r.assignment_type,
        component_type: r.component_type,
        duration: r.duration,
        is_combined: r.is_combined,
        ...(r.sessions_per_week != null
          ? { sessions_per_week: r.sessions_per_week }
          : {}),
      }));

  // ── Save one batch ──────────────────────────────────────────────────────────
  // const saveBatchAssignments = async (batchId) => {
  //   const incomplete = (rows[batchId] ?? []).filter(
  //     (r) => !r.course || !r.faculty,
  //   );
  //   if (incomplete.length) {
  //     setError("Fill in all course and faculty fields before saving.");
  //     setTimeout(() => setError(null), 3000);
  //     return;
  //   }
  //   const payload = buildPayload(batchId);
  //   if (!payload.length) {
  //     setError("Nothing to save — assign at least one course.");
  //     setTimeout(() => setError(null), 3000);
  //     return;
  //   }
  //   setSavingBatch(batchId);
  //   try {
  //     await bulkUpsertCourseAssignments(session._id, payload);
  //     await fetchCourseAssignments({ session_id: session._id });
  //   } catch {
  //     setError("Failed to save batch assignments.");
  //   } finally {
  //     setSavingBatch(null);
  //   }
  // };
  const saveBatchAssignments = async (batchId) => {
    const incomplete = (rows[batchId] ?? []).filter(
      (r) => !r.course || !r.faculty,
    );
    if (incomplete.length) {
      setBatchErrors((p) => ({
        ...p,
        [batchId]: "Fill in all course and faculty fields before saving.",
      }));
      return;
    }
    const payload = buildPayload(batchId);
    if (!payload.length) {
      setBatchErrors((p) => ({
        ...p,
        [batchId]: "Nothing to save — assign at least one course.",
      }));
      return;
    }
    setBatchErrors((p) => ({ ...p, [batchId]: null }));
    setSavingBatch(batchId);
    try {
      await bulkUpsertCourseAssignments(session._id, payload);
      await fetchCourseAssignments({ session_id: session._id }); // only runs on success
    } catch (e) {
      setBatchErrors((p) => ({
        ...p,
        [batchId]:
          e?.response?.data?.message ?? "Failed to save. Please try again.",
      }));
    } finally {
      setSavingBatch(null);
    }
  };

  // ── Save all batches ────────────────────────────────────────────────────────
  const saveAllAssignments = async () => {
    const allPayload = Object.keys(rows).flatMap(buildPayload);
    if (allPayload.some((p) => !p.course_id || !p.faculty_id)) {
      setError("Some assignments are incomplete.");
      return;
    }
    try {
      setIsSavingAll(true);
      await bulkUpsertCourseAssignments(session._id, allPayload);
      await fetchCourseAssignments({ session_id: session._id });
      if (onSave) onSave(allPayload);
    } catch {
      setError("Failed to save all assignments.");
    } finally {
      setIsSavingAll(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={40} className="animate-spin text-emerald-500 mb-3" />
        <p className="text-sm text-gray-500">Loading course data...</p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-800/50 rounded-xl p-4 sm:p-5 border border-emerald-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <FileText size={16} className="text-emerald-600" />
              Course Assignment Overview
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {session?.term} term · {filteredBatches.length} batches ·
              Auto-populated courses
            </p>
          </div>
          <button
            onClick={saveAllAssignments}
            disabled={isSavingAll}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg shadow-sm transition-all hover:shadow-md"
          >
            {isSavingAll && <Loader2 size={16} className="animate-spin" />}
            {isSavingAll ? "Saving All..." : "Save All Assignments"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── Batch list ── */}
      {filteredBatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
          <BookOpen size={48} className="opacity-20 mb-3" />
          <p className="text-sm">
            No batches found for the {session?.term} term.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBatches.map((batch) => {
            const batchCounts = overviewData[batch._id] ?? {};
            const batchRows = rows[batch._id] ?? [];
            const isExpanded = expandedBatches[batch._id];
            const assignedCount = batchRows.filter((r) => r.faculty).length;
            const progress = batchRows.length
              ? (assignedCount / batchRows.length) * 100
              : 0;
            const isSaving = savingBatch === batch._id;

            const deptCourses = courses.filter(
              (c) => c.department === batch.department,
            );
            const otherBatches = filteredBatches.filter(
              (b) => b._id !== batch._id,
            );

            return (
              <div
                key={batch._id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
              >
                {/* Batch header toggle */}
                <button
                  onClick={() => toggleBatch(batch._id)}
                  className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-emerald-500">
                      {isExpanded ? (
                        <ChevronDown size={18} />
                      ) : (
                        <ChevronRight size={18} />
                      )}
                    </span>
                    <div className="flex-1 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                          {batch.batch_name}
                        </h4>
                        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                          Sem {batch.semester}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {batch.department} · {batch.year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:block w-24">
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-center">
                        {assignedCount}/{batchRows.length}
                      </p>
                    </div>
                    <p className="sm:hidden text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {assignedCount}/{batchRows.length}
                    </p>
                  </div>
                </button>

                {/* Expanded rows */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700">
                    {/* ── Desktop table ── */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-10">
                              #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                              Course
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                              Faculty
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-32">
                              Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-28">
                              Component
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 w-20">
                              Sess/wk
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 w-24">
                              Combined
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 w-16"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {batchRows.map((row, idx) => (
                            <React.Fragment key={row.rowId}>
                              <tr
                                className={`transition-colors ${
                                  row.assignment_type === "backlog"
                                    ? "bg-amber-50/60 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                                }`}
                              >
                                <td className="px-4 py-3 text-xs text-gray-400">
                                  {idx + 1}
                                </td>

                                {/* Course cell */}
                                <td className="px-4 py-3">
                                  {row.isManual ? (
                                    <CourseSearch
                                      courses={deptCourses}
                                      allCourses={courses}
                                      value={row.course}
                                      onChange={(c) =>
                                        updateRow(batch._id, row.rowId, {
                                          course: c ?? null,
                                          component_type:
                                            c?.course_type === "LAB"
                                              ? "lab"
                                              : "lecture",
                                          duration:
                                            c?.course_type === "LAB" ? 3 : 1,
                                        })
                                      }
                                    />
                                  ) : (
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                                          {row.course?.course_name}
                                        </p>
                                        {row.course?._id &&
                                          batchCounts[
                                            row.course._id.toString()
                                          ] > 0 && (
                                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                                              {
                                                batchCounts[
                                                  row.course._id.toString()
                                                ]
                                              }{" "}
                                            </span>
                                          )}
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {row.course?.course_code} ·{" "}
                                        {row.course?.course_type} ·{" "}
                                        {row.course?.credits} cr
                                      </p>
                                    </div>
                                  )}
                                </td>

                                {/* Faculty */}
                                <td className="px-4 py-3">
                                  <FacultySearch
                                    faculties={(() => {
                                      const depts = new Set();
                                      if (row.course?.department)
                                        depts.add(row.course.department);
                                      if (
                                        batch.semester !== 1 &&
                                        batch.semester !== 2 &&
                                        batch.department
                                      ) {
                                        depts.add(batch.department);
                                      }
                                      return faculties.filter((f) =>
                                        depts.has(f.department),
                                      );
                                    })()}
                                    allFaculties={faculties}
                                    value={row.faculty}
                                    onChange={(f) =>
                                      updateRow(batch._id, row.rowId, {
                                        faculty: f,
                                      })
                                    }
                                  />
                                </td>

                                {/* Assignment type */}
                                <td className="px-4 py-3">
                                  <CompactSelect
                                    value={row.assignment_type}
                                    onChange={(v) =>
                                      updateRow(batch._id, row.rowId, {
                                        assignment_type: v,
                                      })
                                    }
                                    options={ASSIGNMENT_TYPE_OPTIONS}
                                    className="w-full"
                                  />
                                </td>

                                {/* Component type */}
                                <td className="px-4 py-3">
                                  <CompactSelect
                                    value={row.component_type}
                                    onChange={(v) =>
                                      handleComponentTypeChange(
                                        batch._id,
                                        row.rowId,
                                        v,
                                      )
                                    }
                                    options={COMPONENT_TYPE_OPTIONS}
                                    className="w-full"
                                  />
                                </td>

                                {/* Sessions per week */}
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    placeholder="–"
                                    value={row.sessions_per_week ?? ""}
                                    onChange={(e) =>
                                      updateRow(batch._id, row.rowId, {
                                        sessions_per_week: e.target.value
                                          ? Number(e.target.value)
                                          : null,
                                      })
                                    }
                                    className="w-14 text-center text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-400"
                                  />
                                </td>

                                {/* is_combined toggle */}
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={row.is_combined}
                                    onChange={(e) =>
                                      updateRow(batch._id, row.rowId, {
                                        is_combined: e.target.checked,
                                        extra_batch_ids: e.target.checked
                                          ? row.extra_batch_ids
                                          : [],
                                      })
                                    }
                                    className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                                  />
                                </td>

                                {/* Delete */}
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() =>
                                      deleteRow(batch._id, row.rowId)
                                    }
                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>

                              {/* Combined batch picker */}
                              {row.is_combined && (
                                <tr className="bg-blue-50/40 dark:bg-blue-900/10">
                                  <td />
                                  <td colSpan={7} className="px-5 py-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Link
                                        size={13}
                                        className="text-blue-500 flex-none"
                                      />
                                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                        Combined with:
                                      </span>
                                      {otherBatches.length === 0 ? (
                                        <span className="text-xs text-gray-400 italic">
                                          No other batches in this term
                                        </span>
                                      ) : (
                                        otherBatches.map((ob) => {
                                          const checked =
                                            row.extra_batch_ids.includes(
                                              ob._id?.toString(),
                                            );
                                          return (
                                            <label
                                              key={ob._id}
                                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer border transition-colors select-none ${
                                                checked
                                                  ? "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                                                  : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(e) => {
                                                  const id = ob._id?.toString();
                                                  const next = e.target.checked
                                                    ? [
                                                        ...row.extra_batch_ids,
                                                        id,
                                                      ]
                                                    : row.extra_batch_ids.filter(
                                                        (x) => x !== id,
                                                      );
                                                  updateRow(
                                                    batch._id,
                                                    row.rowId,
                                                    { extra_batch_ids: next },
                                                  );
                                                }}
                                                className="sr-only"
                                              />
                                              {ob.batch_name}
                                            </label>
                                          );
                                        })
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* ── Mobile cards ── */}
                    <div className="lg:hidden p-4 space-y-3">
                      {batchRows.map((row, idx) => (
                        <div
                          key={row.rowId}
                          className={`rounded-lg border p-4 ${
                            row.assignment_type === "backlog"
                              ? "bg-amber-50/60 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50"
                              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          {/* Card header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-500">
                                #{idx + 1}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                                  ASSIGNMENT_TYPE_COLORS[row.assignment_type]
                                }`}
                              >
                                {
                                  ASSIGNMENT_TYPE_OPTIONS.find(
                                    (o) => o.value === row.assignment_type,
                                  )?.label
                                }
                              </span>
                              {row.is_combined && (
                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                  Combined
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => deleteRow(batch._id, row.rowId)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Course */}
                          <div className="mb-3">
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                              Course
                            </label>
                            {row.isManual ? (
                              <CourseSearch
                                courses={deptCourses}
                                allCourses={courses}
                                value={row.course}
                                onChange={(c) =>
                                  updateRow(batch._id, row.rowId, {
                                    course: c ?? null,
                                    component_type:
                                      c?.course_type === "LAB"
                                        ? "lab"
                                        : "lecture",
                                    duration: c?.course_type === "LAB" ? 3 : 1,
                                  })
                                }
                              />
                            ) : (
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                                    {row.course?.course_name}
                                  </p>
                                  {row.course?._id &&
                                    batchCounts[row.course._id.toString()] >
                                      0 && (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                                        {batchCounts[row.course._id.toString()]}{" "}
                                        students
                                      </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {row.course?.course_code} ·{" "}
                                  {row.course?.course_type} ·{" "}
                                  {row.course?.credits} cr
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Faculty */}
                          <div className="mb-3">
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                              Faculty
                            </label>
                            <FacultySearch
                              faculties={(() => {
                                const depts = new Set();
                                if (row.course?.department)
                                  depts.add(row.course.department);
                                if (
                                  batch.semester !== 1 &&
                                  batch.semester !== 2 &&
                                  batch.department
                                ) {
                                  depts.add(batch.department);
                                }
                                return faculties.filter((f) =>
                                  depts.has(f.department),
                                );
                              })()}
                              allFaculties={faculties}
                              value={row.faculty}
                              onChange={(f) =>
                                updateRow(batch._id, row.rowId, { faculty: f })
                              }
                            />
                          </div>

                          {/* Type + Component */}
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                Assignment Type
                              </label>
                              <CompactSelect
                                value={row.assignment_type}
                                onChange={(v) =>
                                  updateRow(batch._id, row.rowId, {
                                    assignment_type: v,
                                  })
                                }
                                options={ASSIGNMENT_TYPE_OPTIONS}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                Component
                              </label>
                              <CompactSelect
                                value={row.component_type}
                                onChange={(v) =>
                                  handleComponentTypeChange(
                                    batch._id,
                                    row.rowId,
                                    v,
                                  )
                                }
                                options={COMPONENT_TYPE_OPTIONS}
                                className="w-full"
                              />
                            </div>
                          </div>

                          {/* Sessions/wk + Combined */}
                          <div className="flex items-end gap-6">
                            <div>
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                Sessions/wk{" "}
                                <span className="font-normal text-gray-400">
                                  (optional)
                                </span>
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                placeholder="–"
                                value={row.sessions_per_week ?? ""}
                                onChange={(e) =>
                                  updateRow(batch._id, row.rowId, {
                                    sessions_per_week: e.target.value
                                      ? Number(e.target.value)
                                      : null,
                                  })
                                }
                                className="w-20 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-400"
                              />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer pb-1">
                              <input
                                type="checkbox"
                                checked={row.is_combined}
                                onChange={(e) =>
                                  updateRow(batch._id, row.rowId, {
                                    is_combined: e.target.checked,
                                    extra_batch_ids: e.target.checked
                                      ? row.extra_batch_ids
                                      : [],
                                  })
                                }
                                className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-400"
                              />
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Combined class
                              </span>
                            </label>
                          </div>

                          {/* Combined batch picker */}
                          {row.is_combined && (
                            <div className="mt-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
                              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                                <Link size={12} /> Combined with:
                              </p>
                              {otherBatches.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">
                                  No other batches in this term
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {otherBatches.map((ob) => {
                                    const checked =
                                      row.extra_batch_ids.includes(
                                        ob._id?.toString(),
                                      );
                                    return (
                                      <label
                                        key={ob._id}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer border transition-colors select-none ${
                                          checked
                                            ? "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                                            : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={(e) => {
                                            const id = ob._id?.toString();
                                            const next = e.target.checked
                                              ? [...row.extra_batch_ids, id]
                                              : row.extra_batch_ids.filter(
                                                  (x) => x !== id,
                                                );
                                            updateRow(batch._id, row.rowId, {
                                              extra_batch_ids: next,
                                            });
                                          }}
                                          className="sr-only"
                                        />
                                        {ob.batch_name}
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Action bar */}
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col sm:flex-row gap-3 justify-between items-center">
                      <button
                        onClick={() => addRow(batch._id)}
                        className="flex items-center justify-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium transition-colors"
                      >
                        <Plus size={16} /> Add Course
                      </button>
                      <div className="flex items-center gap-3">
                        {batchErrors[batch._id] && (
                          <span className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle size={13} /> {batchErrors[batch._id]}
                          </span>
                        )}
                        <button
                          onClick={() => saveBatchAssignments(batch._id)}
                          disabled={isSaving}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all"
                        >
                          {isSaving && (
                            <Loader2 size={16} className="animate-spin" />
                          )}
                          {isSaving ? "Saving…" : "Save Batch"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourseAssignmentTab;
