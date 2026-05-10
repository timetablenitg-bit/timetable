// components/AddCourseModal/CourseCSVEntry.jsx
import React from "react";

const CourseCSVEntry = ({
  csvData,
  setCsvData,
  onAdd,
  onReview,
  courseCount,
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Paste CSV Data
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Format:{" "}
          <code className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-emerald-600 dark:text-emerald-400">
            Course Code, Course Name, Semester, Credits, Type, Department,
            Nature, L, T, P
          </code>
        </p>
        <textarea
          value={csvData}
          onChange={(e) => setCsvData(e.target.value)}
          rows={10}
          placeholder={`Example:\nCS250, Database Systems, 4, 4, Theory, CSE, CORE, 3, 1, 0\nCS255, Database Systems Lab, 4, 2, Lab, CSE, CORE, 0, 0, 3\nCS260, Operating Systems, 5, 4, Theory, CSE, CORE, 3, 1, 0`}
          className="w-full h-[290px] px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent resize-none transition-all duration-200 hover:shadow-lg"
        />
      </div>
      <div className="flex gap-3 pt-6 mt-auto">
        <button
          onClick={onAdd}
          className="cursor-pointer flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          Add to Review List
        </button>
        {courseCount > 0 && (
          <button
            onClick={onReview}
            className="px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            Review ({courseCount})
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseCSVEntry;
