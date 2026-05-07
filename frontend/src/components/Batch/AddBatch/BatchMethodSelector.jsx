// components/AddBatch/BatchMethodSelector.jsx
import React from "react";
import { UserPlus, Database, Upload, Eye } from "lucide-react";

const BatchMethodSelector = ({
  activeMethod,
  setActiveMethod,
  batchCount,
  onReview,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-slate-800">
      <button
        onClick={() => setActiveMethod("manual")}
        className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-300 relative ${
          activeMethod === "manual"
            ? "text-blue-600 dark:text-blue-400"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        }`}
      >
        <UserPlus className="w-4 h-4 inline mr-2" />
        Manual Entry
        {activeMethod === "manual" && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-in slide-in-from-left duration-300" />
        )}
      </button>

      <button
        onClick={() => setActiveMethod("csv")}
        className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-300 relative ${
          activeMethod === "csv"
            ? "text-blue-600 dark:text-blue-400"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        }`}
      >
        <Database className="w-4 h-4 inline mr-2" />
        CSV Text
        {activeMethod === "csv" && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-in slide-in-from-left duration-300" />
        )}
      </button>

      <button
        onClick={() => setActiveMethod("file")}
        className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-300 relative ${
          activeMethod === "file"
            ? "text-blue-600 dark:text-blue-400"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        }`}
      >
        <Upload className="w-4 h-4 inline mr-2" />
        File Upload
        {activeMethod === "file" && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-in slide-in-from-left duration-300" />
        )}
      </button>

      {batchCount > 0 && (
        <button
          onClick={onReview}
          className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95"
        >
          <Eye className="w-4 h-4" />
          Review ({batchCount})
        </button>
      )}
    </div>
  );
};

export default BatchMethodSelector;
