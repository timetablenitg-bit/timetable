import React from "react";
import { BookOpen, CalendarX2 } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

const CurrentSemesterCard = ({ semester, onRegister, isRegistered }) => {
  const { authUser } = useAuthStore();
  const currentSem = authUser.current_sem;
  if (!semester) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 min-h-[240px]">
        <div className="p-3 rounded-full bg-gray-50 dark:bg-gray-700/50">
          <CalendarX2 size={20} className="text-gray-300 dark:text-gray-500" />
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Active session not found
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center relative rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 sm:p-10 min-h-[240px] overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-500" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isRegistered
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  isRegistered ? "bg-emerald-500" : "bg-indigo-500"
                }`}
              />
              {isRegistered ? "Registration completed" : "Registrations open"}
            </span>
          </div>

          <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
            Current Semester
          </p>
          <h4 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight mb-4">
            Semester {currentSem}
          </h4>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
            <span>Academic Year {semester.academic_year}</span>
          </div>
        </div>

        <button
          onClick={() => onRegister(semester)}
          className={`flex items-center justify-center gap-2 px-6 py-3 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all whitespace-nowrap ${
            isRegistered
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          <BookOpen size={16} />
          {isRegistered ? "View Your Courses" : "Register for Courses"}
        </button>
      </div>
    </div>
  );
};

export default CurrentSemesterCard;
