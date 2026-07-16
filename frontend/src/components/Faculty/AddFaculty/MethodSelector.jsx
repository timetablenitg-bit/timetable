// components/AddFacultyModal/MethodSelector.jsx
import React from "react";
import { UserPlus, Database, Upload, Eye } from "lucide-react";

const MethodSelector = ({
  activeMethod,
  setActiveMethod,
  facultyCount,
  onReview,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-slate-800">
      <button
        onClick={() => setActiveMethod("manual")}
        className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-300 relative ${
          activeMethod === "manual"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        }`}
      >
        <UserPlus className="w-4 h-4 inline mr-2" />
        Manual Entry
        {activeMethod === "manual" && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-in slide-in-from-left duration-300" />
        )}
      </button>

      <button
        onClick={() => setActiveMethod("csv")}
        className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-300 relative ${
          activeMethod === "csv"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        }`}
      >
        <Database className="w-4 h-4 inline mr-2" />
        CSV Text
        {activeMethod === "csv" && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-in slide-in-from-left duration-300" />
        )}
      </button>

      <button
        onClick={() => setActiveMethod("file")}
        className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-300 relative ${
          activeMethod === "file"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        }`}
      >
        <Upload className="w-4 h-4 inline mr-2" />
        File Upload
        {activeMethod === "file" && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-in slide-in-from-left duration-300" />
        )}
      </button>

      {facultyCount > 0 && (
        <button
          onClick={onReview}
          className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95"
        >
          <Eye className="w-4 h-4" />
          Review ({facultyCount})
        </button>
      )}
    </div>
  );
};

export default MethodSelector;
