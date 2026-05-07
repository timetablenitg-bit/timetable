import React, { useState } from "react";
import { GraduationCap, BookOpen } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

const Header = () => {
  const { authUser } = useAuthStore();
  return (
    <header className="flex flex-row justify-between items-center px-4 sm:px-6 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm dark:shadow-2xl transition-all duration-300">
      {/* Branding Section - Stays on one line */}
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="p-2 rounded-lg bg-indigo-600 dark:bg-indigo-500 shadow-lg shadow-indigo-500/20 shrink-0">
          <GraduationCap size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold tracking-tight truncate dark:text-white">
            Course{" "}
            <span className="text-indigo-600 dark:text-indigo-400">
              Registration
            </span>
          </h1>
          {/* Hide portal text on tiny screens if needed, otherwise keep small */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">
            <BookOpen size={10} />
            <span>Student Portal</span>
          </div>
        </div>
      </div>

      {/* User Welcome Section - Stays on one line */}
      <div className="text-right shrink-0">
        <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-200 font-medium truncate">
          Welcome, {authUser.username || "Student"}!
        </p>
        <p className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400">
          Manage your registrations
        </p>
      </div>
    </header>
  );
};

export default Header;
