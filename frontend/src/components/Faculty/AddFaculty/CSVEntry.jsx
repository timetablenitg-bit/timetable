// components/AddFacultyModal/CSVEntry.jsx
import React from "react";

const CSVEntry = ({ csvData, setCsvData, onAdd, onReview, facultyCount }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Paste CSV Data
        </label>
        <textarea
          value={csvData}
          onChange={(e) => setCsvData(e.target.value)}
          rows={8}
          placeholder={`Format: Faculty ID, Name, Department\nExample:\nKUK-APS, Dr. Karuna U K, APS\nLP-APS, Dr. Lasitha P, APS\nVNK-CSE, Dr. Venkatnareshbabu K, CSE`}
          className="w-full h-[300px] px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent resize-none transition-all duration-200 hover:shadow-lg"
        />
      </div>
      <div className="flex gap-3 pt-6 mt-auto">
        <button
          onClick={onAdd}
          className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          Add to Review List
        </button>
        {facultyCount > 0 && (
          <button
            onClick={onReview}
            className="px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            Review ({facultyCount})
          </button>
        )}
      </div>
    </div>
  );
};

export default CSVEntry;
