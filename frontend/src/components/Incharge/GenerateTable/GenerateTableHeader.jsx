import React from "react";
import { Plus } from "lucide-react";

const GenerateTableHeader = ({ onAddSession, sessionCount, totalSessions }) => {
  return (
    // Changed flex-col to flex-row and items-start to items-center
    <div className="flex flex-row justify-between items-center w-full mb-6 pb-4 border-b border-emerald-200 dark:border-emerald-800 animate-fadeIn ">
      <div className="flex flex-col">
        <h1 className="text-xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent whitespace-nowrap">
          Academic Sessions
        </h1>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[10px] sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            {sessionCount} active session{sessionCount !== 1 ? "s" : ""}
          </p>
          {totalSessions !== sessionCount && (
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
              ({totalSessions} total)
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onAddSession}
        className="cursor-pointer group relative px-3 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-500 dark:to-teal-500 text-white font-medium rounded-xl 
                   hover:shadow-lg hover:shadow-emerald-500/25 dark:hover:shadow-emerald-500/20 transition-all duration-300 ease-in-out
                   flex items-center gap-1 sm:gap-2 overflow-hidden transform hover:scale-105 active:scale-95 text-sm sm:text-base"
      >
        <span className="relative z-10 flex items-center gap-1 sm:gap-2">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:rotate-90" />
          <span className="hidden sm:inline">Add Session</span>
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-600 dark:from-teal-400 dark:to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>
    </div>
  );
};

export default GenerateTableHeader;
