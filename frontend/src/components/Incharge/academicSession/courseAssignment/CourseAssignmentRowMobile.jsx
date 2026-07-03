import React from "react";
import { Trash2, Sparkles } from "lucide-react";
import CourseCell from "./CourseCell";
import FacultySearch from "./FacultySearch";
import CompactSelect from "./CompactSelect";
import { getFacultyPoolForRow } from "./RowHelpers";
import {
  ASSIGNMENT_TYPE_OPTIONS,
  COMPONENT_TYPE_OPTIONS,
  ASSIGNMENT_TYPE_COLORS,
} from "./constants";

const CourseAssignmentRowMobile = ({
  row,
  idx,
  batch,
  batchCounts,
  courses,
  faculties,
  onUpdateRow,
  onComponentTypeChange,
  onDeleteRow,
}) => {
  const cardClasses = row.course?.is_elective_slot
    ? "bg-violet-50/40 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800/50"
    : row.assignment_type === "backlog"
      ? "bg-amber-50/60 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50"
      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";

  return (
    <div className={`rounded-lg border p-4 ${cardClasses}`}>
      {/* Card header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-500">#{idx + 1}</span>
          {row.course?.is_elective_slot && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 flex items-center gap-1">
              <Sparkles size={9} /> Elective Slot
            </span>
          )}
          <span
            className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${ASSIGNMENT_TYPE_COLORS[row.assignment_type]}`}
          >
            {
              ASSIGNMENT_TYPE_OPTIONS.find(
                (o) => o.value === row.assignment_type,
              )?.label
            }
          </span>
        </div>
        <button
          onClick={onDeleteRow}
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
        <CourseCell
          row={row}
          batch={batch}
          batchCounts={batchCounts}
          courses={courses}
          onChange={onUpdateRow}
        />
      </div>

      {/* Faculty */}
      <div className="mb-3">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
          Faculty
        </label>
        <FacultySearch
          faculties={getFacultyPoolForRow(row, batch, faculties)}
          allFaculties={faculties}
          value={row.faculty}
          onChange={(f) => onUpdateRow({ faculty: f })}
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
            onChange={(v) => onUpdateRow({ assignment_type: v })}
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
            onChange={onComponentTypeChange}
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
            <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            type="number"
            min={1}
            max={10}
            placeholder="–"
            value={row.sessions_per_week ?? ""}
            onChange={(e) =>
              onUpdateRow({
                sessions_per_week: e.target.value
                  ? Number(e.target.value)
                  : null,
              })
            }
            className="w-20 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      </div>
    </div>
  );
};

export default CourseAssignmentRowMobile;
