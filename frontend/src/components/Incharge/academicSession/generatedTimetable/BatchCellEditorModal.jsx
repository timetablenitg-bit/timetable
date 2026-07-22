// BatchCellEditorModal.jsx
//
// Popover for hand-editing a single (day, period(s), track) cell for ONE
// batch — used by InstituteView's per-batch edit mode. Writes only via
// editBatchCell (schedule.grid manual_entries / hidden_assignment_ids)
// — never touches GeneratedSlot or the skeleton.
//
// CHANGED — now has two tabs, mirroring PickCourseModal in
// EditableSlotsView: "Unplaced courses" (primary flow — pick a course
// that still needs placing, auto-fills faculty/component) and "Enter
// manually" (fallback). Also accepts `isLab` + `periodCount` so the modal
// can label itself correctly and default component_type to "lab" when
// it's editing a lab block (fixed AM/PM or an admin-added extra lab).
import React, { useMemo, useState } from "react";
import { X, Trash2, Loader2, Search } from "lucide-react";

const FIELD_LABEL =
  "text-[10px] font-medium text-gray-400 dark:text-gray-500 tracking-wide";
const FIELD_INPUT =
  "mt-1 w-full text-[13px] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors";

const COMPONENT_TYPES = ["lecture", "tutorial", "minor", "oe", "lab"];

const BatchCellEditorModal = ({
  batchName,
  day,
  periodIndex,
  timeLabel,
  currentEntry, // { course_code, faculty_code, component_type } | null
  isSaving,
  isLab = false, // NEW
  periodCount = 1, // NEW — 1 or 3, just for the header label
  unplaced = [], // NEW — unplacedAssignments from the store
  isFetchingUnplaced = false, // NEW
  onSave, // (entryOrNull) => void
  onClose,
}) => {
  const [mode, setMode] = useState(currentEntry ? "manual" : "pick"); // NEW
  const [search, setSearch] = useState(""); // NEW
  const [courseCode, setCourseCode] = useState(currentEntry?.course_code ?? "");
  const [facultyCode, setFacultyCode] = useState(
    currentEntry?.faculty_code ?? "",
  );
  const [componentType, setComponentType] = useState(
    currentEntry?.component_type ?? (isLab ? "lab" : "lecture"),
  );

  // NEW — only offer unplaced items for THIS batch, so the admin isn't
  // hunting through the whole institute's backlog.
  const filteredUnplaced = useMemo(() => {
    let list = unplaced.filter((a) =>
      (a.batch_names ?? []).includes(batchName),
    );
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.course_code?.toLowerCase().includes(q) ||
          a.course_name?.toLowerCase().includes(q) ||
          a.faculty_code?.toLowerCase().includes(q),
      );
    }
    // Lab cells surface lab-needing courses first, but don't hide the rest —
    // sometimes an "extra lab" slot ends up hosting a tutorial etc.
    return [...list].sort((a, b) => {
      if (isLab) {
        const aLab = a.component_type === "lab" ? 0 : 1;
        const bLab = b.component_type === "lab" ? 0 : 1;
        if (aLab !== bLab) return aLab - bLab;
      }
      return 0;
    });
  }, [unplaced, batchName, search, isLab]);

  const handlePick = (assignment) => {
    onSave({
      assignment_id: assignment.assignment_id,
      course_code: assignment.course_code,
      faculty_code: assignment.faculty_code,
      component_type: assignment.component_type || (isLab ? "lab" : "lecture"),
    });
  };

  const handleManualSave = () => {
    if (!courseCode.trim() || !facultyCode.trim()) return;
    onSave({
      course_code: courseCode.trim(),
      faculty_code: facultyCode.trim(),
      component_type: componentType,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 w-80 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[13px] font-medium text-gray-800 dark:text-gray-100">
              {batchName}
            </h3>
            <p className="text-[10px] text-gray-400">
              {day} · {timeLabel ?? `Period ${periodIndex}`}
              {periodCount === 3 ? " · Lab (3 periods)" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-400"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex gap-1 mb-3 text-[11px]">
          <button
            onClick={() => setMode("pick")}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              mode === "pick"
                ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            Unplaced courses
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              mode === "manual"
                ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            Enter manually
          </button>
        </div>

        {mode === "pick" ? (
          <>
            <div className="relative mb-3">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search course or faculty…"
                className={`${FIELD_INPUT} pl-7`}
              />
            </div>

            <div className="max-h-64 overflow-y-auto -mx-1 px-1 space-y-1.5 min-h-[100px]">
              {isFetchingUnplaced ? (
                <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-[12px]">
                  <Loader2 size={14} className="animate-spin" />
                  Loading unplaced courses…
                </div>
              ) : filteredUnplaced.length === 0 ? (
                <p className="text-[12px] text-gray-400 text-center py-8">
                  No unplaced course for {batchName}.
                  <br />
                  Try "Enter manually" instead.
                </p>
              ) : (
                filteredUnplaced.map((a) => (
                  <button
                    key={a.assignment_id}
                    onClick={() => handlePick(a)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-100">
                        {a.course_code}
                      </span>
                      <span className="text-[9px] uppercase tracking-wide text-gray-400">
                        {a.component_type}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 truncate">
                      {a.course_name}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {a.faculty_code}
                    </p>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className={FIELD_LABEL}>Course code</span>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="CS301"
                className={FIELD_INPUT}
              />
            </label>

            <label className="block">
              <span className={FIELD_LABEL}>Faculty code</span>
              <input
                type="text"
                value={facultyCode}
                onChange={(e) => setFacultyCode(e.target.value)}
                placeholder="JDO"
                className={FIELD_INPUT}
              />
            </label>

            <label className="block">
              <span className={FIELD_LABEL}>Component</span>
              <select
                value={componentType}
                onChange={(e) => setComponentType(e.target.value)}
                className={`${FIELD_INPUT} cursor-pointer`}
              >
                {COMPONENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="flex gap-2 mt-6">
          {currentEntry && (
            <button
              onClick={() => onSave(null)}
              disabled={isSaving}
              title="Clear this cell"
              className="flex items-center justify-center px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 text-[12px] px-3 py-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
          {mode === "manual" && (
            <button
              onClick={handleManualSave}
              disabled={isSaving || !courseCode.trim() || !facultyCode.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 text-[12px] px-3 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 hover:bg-gray-700 dark:hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-white dark:text-gray-900 font-medium transition-colors"
            >
              {isSaving && <Loader2 size={11} className="animate-spin" />}
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchCellEditorModal;
