import React from "react";
import { GraduationCap, BookOpen, Layers, Network } from "lucide-react";
import CustomDropdown from "../../../ui/CustomDropdown";

const Header = ({ semester, setSemester, branch, setBranch }) => {
  const romanOptions = [1, 2, 3, 4, 5, 6, 7, 8];
  const branchOptions = ["ECE", "MCE", "CVE", "EEE", "CSE"];

  return (
    <header
      className="
      /* Layout & Shape */
      flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 rounded-xl 
      
      /* Light Mode */
      bg-white text-slate-900 border border-slate-200 shadow-sm
      
      /* Dark Mode */
      dark:bg-slate-950 dark:text-white dark:border-slate-800 dark:shadow-2xl dark:shadow-black/20
      
      /* Transitions */
      transition-all duration-300 ease-in-out px-6 py-4
    "
    >
      {/* Branding Section */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="p-2 rounded-lg bg-indigo-600 dark:bg-indigo-500 shadow-lg shadow-indigo-500/20">
          <GraduationCap size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight leading-tight">
            Course{" "}
            <span className="text-indigo-600 dark:text-indigo-400">
              Registration
            </span>
          </h1>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">
            <BookOpen size={10} />
            <span>Academic Session 2026</span>
          </div>
        </div>
      </div>

      {/* Control Section */}
      <div className="flex flex-col sm:flex-row items-center w-full lg:w-auto gap-4 sm:gap-6">
        {/* Branch Dropdown */}
        <div className="flex items-center gap-3 w-full sm:w-auto group">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Network
              size={16}
              className="text-slate-400 group-hover:text-indigo-500 transition-colors"
            />
            <span className="whitespace-nowrap">Branch:</span>
          </div>
          <div className="min-w-[110px] flex-1 sm:flex-none">
            <CustomDropdown
              label={"Branch"}
              options={branchOptions}
              value={branch}
              onChange={setBranch}
            />
          </div>
        </div>

        {/* Subtle vertical divider for desktop */}
        <div className="hidden lg:block h-8 w-[1px] bg-slate-200 dark:bg-slate-800" />

        {/* Semester Dropdown */}
        <div className="flex items-center gap-3 w-full sm:w-auto group">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Layers
              size={16}
              className="text-slate-400 group-hover:text-indigo-500 transition-colors"
            />
            <span className="whitespace-nowrap">Semester:</span>
          </div>
          <div className="min-w-[110px] flex-1 sm:flex-none">
            <CustomDropdown
              label={"Semester"}
              options={romanOptions}
              value={semester}
              onChange={setSemester}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
