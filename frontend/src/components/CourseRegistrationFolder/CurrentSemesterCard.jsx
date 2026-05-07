import React from "react";
import { Clock, BookOpen, Calendar } from "lucide-react";

const CurrentSemesterCard = ({ semester, onRegister }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-amber-200 dark:border-amber-800 shadow-md overflow-hidden">
      <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-b border-amber-200 dark:border-amber-800">
        <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <Clock size={16} />
          Current Active Semester
        </h3>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
                Semester {semester.semester_name}
              </h4>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                <Clock size={12} />
                Registration Open
              </span>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                Academic Year: {semester.academic_year}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                Total Credits: {semester.total_credits}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={() => onRegister(semester)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
            >
              <BookOpen size={16} />
              Register for Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentSemesterCard;
