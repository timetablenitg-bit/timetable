import React from "react";
import {
  MousePointerClick,
  LayoutGrid,
  Network,
  ArrowRight,
} from "lucide-react";

const SemesterNotSelected = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] w-full rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 transition-all duration-500 p-8 text-center">
      {/* Visual Composition */}
      <div className="relative mb-8 flex items-center justify-center gap-4">
        {/* Branch Icon Box */}
        <div className="relative flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
          <Network className="w-8 h-8 text-slate-400 dark:text-slate-500" />
        </div>

        {/* Animated Connector */}
        <div className="flex flex-col items-center gap-1">
          <ArrowRight className="w-5 h-5 text-indigo-400 animate-pulse" />
        </div>

        {/* Semester Icon Box */}
        <div className="relative flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
          <LayoutGrid className="w-8 h-8 text-slate-400 dark:text-slate-500" />

          {/* Floating Click Indicator */}
          <div className="absolute -top-2 -right-2 p-1.5 bg-indigo-600 rounded-lg shadow-lg animate-bounce">
            <MousePointerClick className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Background Glow */}
        <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl -z-10 rounded-full"></div>
      </div>

      {/* Text Content */}
      <div className="max-w-md space-y-3">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Complete Your Selection
        </h2>

        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
          To fetch your specific curriculum, please ensure both
          <span className="font-bold text-indigo-600 dark:text-indigo-400 italic">
            {" "}
            Branch{" "}
          </span>
          and
          <span className="font-bold text-indigo-600 dark:text-indigo-400 italic">
            {" "}
            Semester{" "}
          </span>
          are selected in the header.
        </p>
      </div>

      {/* Status Badges */}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Branch Required
          </span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Semester Required
          </span>
        </div>
      </div>
    </div>
  );
};

export default SemesterNotSelected;
