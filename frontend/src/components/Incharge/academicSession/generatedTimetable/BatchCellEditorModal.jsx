// BatchCellEditorModal.jsx
//
// Popover for hand-editing a single (day, period, track) cell for ONE
// batch — used by InstituteView's per-batch edit mode. Writes only via
// editBatchCell (schedule.grid manual_entries / hidden_assignment_ids)
// — never touches GeneratedSlot or the skeleton.
import React, { useState } from "react";
import { X, Trash2, Loader2 } from "lucide-react";

const FIELD_LABEL =
  "text-[10px] font-medium text-gray-400 dark:text-gray-500 tracking-wide";
const FIELD_INPUT =
  "mt-1 w-full text-[13px] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors";

const COMPONENT_TYPES = ["lecture", "tutorial", "minor", "oe"];

const BatchCellEditorModal = ({
  batchName,
  day,
  periodIndex,
  timeLabel,
  currentEntry, // { course_code, faculty_code, component_type } | null
  isSaving,
  onSave, // (entryOrNull) => void
  onClose,
}) => {
  const [courseCode, setCourseCode] = useState(currentEntry?.course_code ?? "");
  const [facultyCode, setFacultyCode] = useState(
    currentEntry?.faculty_code ?? "",
  );
  const [componentType, setComponentType] = useState(
    currentEntry?.component_type ?? "lecture",
  );

  const handleSave = () => {
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
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-400"
          >
            <X size={14} />
          </button>
        </div>

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
          <button
            onClick={handleSave}
            disabled={isSaving || !courseCode.trim() || !facultyCode.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 text-[12px] px-3 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 hover:bg-gray-700 dark:hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-white dark:text-gray-900 font-medium transition-colors"
          >
            {isSaving && <Loader2 size={11} className="animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchCellEditorModal;
