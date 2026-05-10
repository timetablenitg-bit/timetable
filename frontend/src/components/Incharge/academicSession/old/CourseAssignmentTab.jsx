import React, { useEffect, useState, useRef } from "react";
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
} from "lucide-react";
import useAdminStore from "../../../../store/useAdminStore";

const EVEN_SEMS = new Set([2, 4, 6, 8]);
const ODD_SEMS = new Set([1, 3, 5, 7]);

// ── Faculty inline search cell ────────────────────────────────────────────────
const FacultyCell = ({ faculties, value, onChange }) => {
  const [query, setQuery] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync display if value cleared externally
  useEffect(() => {
    if (!value) setQuery("");
  }, [value]);

  const filtered = faculties
    .filter(
      (f) =>
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.faculty_code.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 8);

  return (
    <div ref={ref} className="relative min-w-[180px]">
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-all ${
          open
            ? "border-blue-400 ring-1 ring-blue-300 dark:ring-blue-500/40"
            : "border-gray-200 dark:border-gray-600"
        } bg-white dark:bg-gray-800/80`}
      >
        <Search size={11} className="text-gray-400 flex-none" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Assign faculty…"
          className="bg-transparent outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400 w-28 min-w-0"
        />
        {value && (
          <X
            size={11}
            className="text-gray-400 hover:text-gray-600 cursor-pointer flex-none"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange(null);
              setQuery("");
            }}
          />
        )}
      </div>

      {open && query.length > 0 && (
        <div className="absolute z-30 top-full left-0 mt-1 w-60 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-44 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-gray-400 italic">
              No faculty found
            </p>
          ) : (
            filtered.map((f) => (
              <button
                key={f._id}
                onMouseDown={() => {
                  onChange(f);
                  setQuery(f.name);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
              >
                <p className="text-xs font-medium text-gray-800 dark:text-gray-100">
                  {f.name}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {f.faculty_code} · {f.department}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const CourseAssignmentTab = ({ session }) => {
  const {
    batches = [],
    fetchBatches,
    faculties = [],
    fetchFaculties,
    courses = [],
    fetchAllCourses,
    saveCourseAssignments,
    isLoading,
    error,
  } = useAdminStore();

  // rows shape: { [batchId]: [{ rowId, course, faculty, is_backlog, isManual }] }
  const [rows, setRows] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBatches?.();
    fetchFaculties?.();
    fetchAllCourses?.();
  }, [fetchBatches, fetchFaculties, fetchAllCourses]);

  const termSems = session?.term === "EVEN" ? EVEN_SEMS : ODD_SEMS;
  const filteredBatches = batches.filter((b) => termSems.has(b.semester));

  // Auto-populate rows once data is ready — skip batches already initialised
  useEffect(() => {
    if (!filteredBatches.length || !courses.length) return;

    setRows((prev) => {
      const next = { ...prev };
      filteredBatches.forEach((batch) => {
        if (next[batch._id]) return; // preserve edits already made
        const batchCourses = courses.filter(
          (c) =>
            c.semester_offered === batch.semester &&
            c.department === batch.department,
        );
        next[batch._id] = batchCourses.map((course) => ({
          rowId: crypto.randomUUID(),
          course,
          faculty: null,
          is_backlog: false,
          isManual: false,
        }));
      });
      return next;
    });
  }, [filteredBatches, batches, courses, session?.term]);

  const toggleCollapse = (batchId) =>
    setCollapsed((prev) => ({ ...prev, [batchId]: !prev[batchId] }));

  const updateRow = (batchId, rowId, patch) =>
    setRows((prev) => ({
      ...prev,
      [batchId]: prev[batchId].map((r) =>
        r.rowId === rowId ? { ...r, ...patch } : r,
      ),
    }));

  const addRow = (batchId) =>
    setRows((prev) => ({
      ...prev,
      [batchId]: [
        ...(prev[batchId] ?? []),
        {
          rowId: crypto.randomUUID(),
          course: null,
          faculty: null,
          is_backlog: true, // default true for manually added rows
          isManual: true,
        },
      ],
    }));

  const removeRow = (batchId, rowId) =>
    setRows((prev) => ({
      ...prev,
      [batchId]: prev[batchId].filter((r) => r.rowId !== rowId),
    }));

  const handleSave = async () => {
    const payload = [];
    Object.entries(rows).forEach(([batchId, batchRows]) => {
      batchRows.forEach((r) => {
        if (!r.course || !r.faculty) return; // skip incomplete rows
        payload.push({
          session_id: session._id,
          batch_id: batchId,
          course_id: r.course._id,
          faculty_id: r.faculty._id,
          is_backlog: r.is_backlog,
        });
      });
    });

    setIsSaving(true);
    await saveCourseAssignments?.(payload);
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-blue-500" />
        <span className="ml-3 text-sm text-gray-400">Loading…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Auto-populated for the{" "}
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            {session?.term}
          </span>{" "}
          term. Assign faculty and mark backlog rows as needed.
        </p>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 hover:-translate-y-[1px]"
        >
          {isSaving && <Loader2 size={14} className="animate-spin" />}
          Save Assignments
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* ── Batch sections ── */}
      {filteredBatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 text-sm gap-2">
          <BookOpen size={36} className="opacity-20" />
          <p>No batches found for the {session?.term} term.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredBatches.map((batch) => {
            const batchRows = rows[batch._id] ?? [];
            const isCollapsed = !!collapsed[batch._id];

            // For manual row course selector — all courses of this dept (any sem, could be backlog)
            const deptCourses = courses.filter(
              (c) => c.department === batch.department,
            );

            // Faculty filtered to same dept + cross-dept (APS, HSS teach across depts)
            const relevantFaculty = faculties.filter(
              (f) =>
                f.department === batch.department ||
                f.department === "APS" ||
                f.department === "HSS",
            );

            const assignedCount = batchRows.filter((r) => r.faculty).length;

            return (
              <div
                key={batch._id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden"
              >
                {/* Batch header — clickable to collapse */}
                <button
                  onClick={() => toggleCollapse(batch._id)}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight size={16} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                        {batch.batch_name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {batch.department} · Year {batch.year} · Sem{" "}
                        {batch.semester} ·{" "}
                        <span className="text-blue-400">
                          {assignedCount}/{batchRows.length} assigned
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Pill badges */}
                  <div className="flex items-center gap-2">
                    {batchRows.some((r) => r.is_backlog) && (
                      <span className="px-2 py-0.5 text-[11px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">
                        has backlog
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-[11px] font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full">
                      {batchRows.length} courses
                    </span>
                  </div>
                </button>

                {/* Rows table */}
                {!isCollapsed && (
                  <div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-700">
                          <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 w-8">
                            #
                          </th>
                          <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400">
                            Course
                          </th>
                          <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400">
                            Faculty
                          </th>
                          <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-400">
                            Backlog
                          </th>
                          <th className="px-4 py-2.5 w-8" />
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                        {batchRows.map((row, idx) => (
                          <tr
                            key={row.rowId}
                            className={`transition-colors ${
                              row.is_backlog
                                ? "bg-amber-50/60 dark:bg-amber-900/10"
                                : "hover:bg-gray-50/70 dark:hover:bg-gray-700/20"
                            }`}
                          >
                            {/* # */}
                            <td className="px-5 py-3 text-xs text-gray-400">
                              {idx + 1}
                            </td>

                            {/* Course */}
                            <td className="px-5 py-3">
                              {row.isManual ? (
                                <select
                                  value={row.course?._id ?? ""}
                                  onChange={(e) => {
                                    const c = deptCourses.find(
                                      (c) => c._id === e.target.value,
                                    );
                                    updateRow(batch._id, row.rowId, {
                                      course: c ?? null,
                                    });
                                  }}
                                  className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-2.5 py-1.5 text-gray-700 dark:text-gray-200 outline-none focus:ring-1 focus:ring-blue-400 w-full max-w-xs"
                                >
                                  <option value="">— Select course —</option>
                                  {deptCourses.map((c) => (
                                    <option key={c._id} value={c._id}>
                                      {c.course_code} – {c.course_name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div>
                                  <p className="font-medium text-gray-800 dark:text-gray-100">
                                    {row.course?.course_name}
                                  </p>
                                  <p className="text-[11px] text-gray-400 mt-0.5">
                                    {row.course?.course_code} ·{" "}
                                    {row.course?.course_type} ·{" "}
                                    {row.course?.nature}
                                  </p>
                                </div>
                              )}
                            </td>

                            {/* Faculty search */}
                            <td className="px-5 py-3">
                              <FacultyCell
                                faculties={relevantFaculty}
                                value={row.faculty}
                                onChange={(f) =>
                                  updateRow(batch._id, row.rowId, {
                                    faculty: f,
                                  })
                                }
                              />
                            </td>

                            {/* Backlog toggle */}
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={row.is_backlog}
                                onChange={(e) =>
                                  updateRow(batch._id, row.rowId, {
                                    is_backlog: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                              />
                            </td>

                            {/* Delete (manual rows only) */}
                            <td className="px-4 py-3">
                              {row.isManual && (
                                <button
                                  onClick={() =>
                                    removeRow(batch._id, row.rowId)
                                  }
                                  className="p-1 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Add backlog row */}
                    <div className="px-5 py-3 border-t border-dashed border-gray-200 dark:border-gray-700/60">
                      <button
                        onClick={() => addRow(batch._id)}
                        className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        <Plus size={13} />
                        Add backlog row
                      </button>
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
