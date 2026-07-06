import React from "react";
import { GraduationCap, BookOpen } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

const Header = () => {
  const { authUser } = useAuthStore();
  const rollNumber = authUser.email?.split("@")[0]?.toUpperCase();

  return (
    <header className="flex flex-row justify-between items-center px-3 sm:px-6 py-2 sm:py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg sm:rounded-xl shadow-sm dark:shadow-2xl transition-all duration-300">
      {/* Branding Section */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-hidden flex-1 min-w-0">
        <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-600 dark:bg-indigo-500 shadow-lg shadow-indigo-500/20 shrink-0">
          <GraduationCap size={16} className="sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="min-w-0">
          {/* Mobile: Shows "Course Reg." | Laptop: Shows "Course Registration" */}
          <h1 className="text-xs sm:text-base md:text-lg font-bold tracking-tight truncate dark:text-white">
            <span className="sm:hidden">Backlog Reg.</span>
            <span className="hidden sm:inline">
              Backlog{" "}
              <span className="text-indigo-600 dark:text-indigo-400">
                Registration
              </span>
            </span>
          </h1>
          {/* Portal text - hidden on mobile, visible on laptop */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">
            <BookOpen size={10} />
            <span>Student Portal</span>
          </div>
        </div>
      </div>

      {/* User Welcome Section */}
      <div className="text-right shrink-0 ml-2 sm:ml-0">
        {/* Mobile view - truncated */}
        <div className="sm:hidden">
          <p
            className="text-xs text-slate-900 dark:text-slate-200 font-medium"
            title={rollNumber || "Student"}
          >
            Hi, {rollNumber || "Student"}!
          </p>
        </div>

        {/* Laptop view - full details */}
        <div className="hidden sm:block">
          <p
            className="text-sm text-slate-900 dark:text-slate-200 font-medium"
            title={rollNumber || "Student"}
          >
            Welcome, {rollNumber || "Student"}!
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Manage your registrations
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
