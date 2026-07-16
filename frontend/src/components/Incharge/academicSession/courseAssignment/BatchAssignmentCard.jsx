import React from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import CourseAssignmentRow from "./CourseAssignmentRow";
import CourseAssignmentRowMobile from "./CourseAssignmentRowMobile";

const BatchAssignmentCard = ({
  batch,
  batchRows,
  batchCounts,
  courses,
  faculties,
  otherBatches,
  allAssignments,
  isExpanded,
  onToggle,
  onUpdateRow, // (rowId, patch) => void
  onComponentTypeChange, // (rowId, component_type) => void
  onSyncedWithChange, // (rowId, nextSyncedWithIds) => void
  onDeleteRow, // (rowId) => void
  deletingRowId, // 🔥 NEW — rowId currently being deleted server-side, or null
  onAddRow, // () => void
  onSaveBatch, // () => void
  isSaving,
  error,
}) => {
  // Progress: slot rows count as assigned only if elective_course is also picked
  const assignedCount = batchRows.filter((r) =>
    r.course?.is_elective_slot ? r.elective_course && r.faculty : r.faculty,
  ).length;
  const progress = batchRows.length
    ? (assignedCount / batchRows.length) * 100
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
      {/* Batch header toggle */}
      <button
        onClick={onToggle}
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
            <table className="w-full table-auto">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-10">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Course
                  </th>
                  {/* 🔥 widened to match the row cell so full faculty names
                      aren't clipped and header/body stay aligned */}
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-44">
                    Faculty
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-28">
                    Type
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-24">
                    Component
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 w-16">
                    Sess/wk
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 w-20">
                    Links
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 w-14" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {batchRows.map((row, idx) => (
                  <CourseAssignmentRow
                    key={row.rowId}
                    row={row}
                    idx={idx}
                    batch={batch}
                    batchCounts={batchCounts}
                    courses={courses}
                    faculties={faculties}
                    otherBatches={otherBatches}
                    allAssignments={allAssignments}
                    onUpdateRow={(patch) => onUpdateRow(row.rowId, patch)}
                    onComponentTypeChange={(v) =>
                      onComponentTypeChange(row.rowId, v)
                    }
                    onSyncedWithChange={(next) =>
                      onSyncedWithChange(row.rowId, next)
                    }
                    onDeleteRow={() => onDeleteRow(row.rowId)}
                    isDeleting={deletingRowId === row.rowId} // 🔥 NEW
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="lg:hidden p-4 space-y-3">
            {batchRows.map((row, idx) => (
              <CourseAssignmentRowMobile
                key={row.rowId}
                row={row}
                idx={idx}
                batch={batch}
                batchCounts={batchCounts}
                courses={courses}
                faculties={faculties}
                otherBatches={otherBatches}
                allAssignments={allAssignments}
                onUpdateRow={(patch) => onUpdateRow(row.rowId, patch)}
                onComponentTypeChange={(v) =>
                  onComponentTypeChange(row.rowId, v)
                }
                onDeleteRow={() => onDeleteRow(row.rowId)}
                isDeleting={deletingRowId === row.rowId} // 🔥 NEW
              />
            ))}
          </div>

          {/* Action bar */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <button
              onClick={onAddRow}
              className="flex items-center justify-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium transition-colors"
            >
              <Plus size={16} /> Add Course
            </button>
            <div className="flex items-center gap-3">
              {error && (
                <span className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle size={13} /> {error}
                </span>
              )}
              <button
                onClick={onSaveBatch}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all"
              >
                {isSaving && <Loader2 size={16} className="animate-spin" />}
                {isSaving ? "Saving…" : "Save Batch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchAssignmentCard;
