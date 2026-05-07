import React from "react";
import {
  PlusCircle,
  CheckCircle2,
  BookOpen,
  Clock,
  Award,
  Microscope,
} from "lucide-react";

const CourseSearchList = ({
  courses = [],
  searchTerm = "",
  onAdd,
  selectedCodes = [],
}) => {
  // Safety check for filter
  const filtered = Array.isArray(courses)
    ? courses.filter(
        (c) =>
          c.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.course_code.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  return (
    // h-full ensures it takes up the 600px defined in the parent
    // overflow-hidden prevents the whole component from growing
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-3 custom-scrollbar">
        {filtered.length > 0 ? (
          filtered.map((course) => {
            const isSelected = selectedCodes.includes(course.course_code);

            return (
              <div
                key={course.course_code}
                className={`group relative p-4 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm hover:shadow-md"
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    {/* Top Row: Badges */}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-md tracking-wider">
                        {course.course_code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          course.course_type === "Theory"
                            ? "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                            : "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        }`}
                      >
                        {course.course_type.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white leading-tight">
                      {course.course_name}
                    </h3>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Award size={14} className="text-indigo-500" />
                        <span className="text-xs font-medium">
                          {course.credits} Cr.
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-xs font-medium">
                          {course.lecture}-{course.tutorial}-{course.practical}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        {course.course_type === "Theory" ? (
                          <BookOpen size={14} />
                        ) : (
                          <Microscope size={14} />
                        )}
                        <span className="text-xs font-medium truncate">
                          {course.nature}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onAdd(course)}
                    disabled={isSelected}
                    className={`shrink-0 p-2.5 rounded-xl transition-all ${
                      isSelected
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 group-hover:scale-110 cursor-pointer"
                    }`}
                  >
                    {isSelected ? (
                      <CheckCircle2 size={22} />
                    ) : (
                      <PlusCircle size={22} />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
            <BookOpen size={32} className="text-slate-400" />
            <p className="font-bold text-slate-900 dark:text-white">
              No subjects found
            </p>
          </div>
        )}
      </div>

      {/* Footer Info - Fixed at bottom */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 rounded-b-2xl shrink-0">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center uppercase tracking-widest font-semibold">
          Showing {filtered.length} Available Courses
        </p>
      </div>
    </div>
  );
};

export default CourseSearchList;
