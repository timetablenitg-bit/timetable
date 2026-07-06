import React from "react";
import { AlertCircle, Trash2, BookOpen, ArrowRight } from "lucide-react";

const RegistrationSummary = ({ selectedCourses, onRemove, disabled }) => {
  const getRowColor = (registrationType) =>
    registrationType === "backlog"
      ? "bg-red-50/50 dark:bg-red-500/5"
      : "hover:bg-slate-50/50 dark:hover:bg-slate-800/50";

  const getBadgeColor = (registrationType) =>
    registrationType === "backlog"
      ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  if (selectedCourses.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">
          No Courses Selected
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-3">
          Add courses from the list to build your registration.
        </p>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full">
          <span>Browse courses</span>
          <ArrowRight size={14} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <table className="w-full text-left border-collapse table-fixed">
        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
          <tr className="text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-widest">
            <th className="px-4 py-3 w-24">Code</th>
            <th className="px-4 py-3">Subject</th>
            <th className="px-4 py-3 text-center w-16">Credits</th>
            <th className="px-4 py-3 text-center w-20">Type</th>
            {!disabled && <th className="px-4 py-3 text-right w-14">—</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {selectedCourses.map((course) => (
            <tr
              key={course._id || course.code}
              className={`transition-colors ${getRowColor(course.registrationType)}`}
            >
              <td
                className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400 text-sm truncate"
                title={course.code}
              >
                {course.code}
              </td>
              <td
                className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 truncate"
                title={course.name}
              >
                {course.name}
              </td>
              <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white">
                {course.credits}
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getBadgeColor(course.registrationType)}`}
                >
                  {course.registrationType === "backlog" && (
                    <AlertCircle size={11} />
                  )}
                  {course.registrationType === "backlog"
                    ? "Backlog"
                    : "Regular"}
                </span>
              </td>
              {!disabled && (
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onRemove(course.code)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    title="Remove course"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RegistrationSummary;
