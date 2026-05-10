// components/AddBatch/BatchCSVEntry.jsx
import React from "react";
import { FileText, AlertCircle, Code } from "lucide-react";

const BatchCSVEntry = ({
  csvData,
  setCsvData,
  onAdd,
  onReview,
  batchCount,
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <textarea
          value={csvData}
          onChange={(e) => setCsvData(e.target.value)}
          placeholder={`📋 Enter your batch data in CSV format
─────────────────────────────────────────
📌 Format: Program, Department, Year, Semester, Batch Name
─────────────────────────────────────────
✨ Example:
   BTECH, CSE, 2, 3, CSE_3rd_Sem
   BTECH, ECE, 1, 1, ECE_1st_Sem
   MTECH, CSE, 5, 1, MTech_CSE_1st_Sem

💡 Tips:
   • Use commas to separate fields
   • No spaces after commas (optional)
   • Each batch on a new line`}
          className="w-full h-[340px] p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-mono text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 leading-relaxed"
        />
      </div>

      <div className="flex gap-3 pt-6 mt-auto border-t border-gray-100 dark:border-slate-800">
        <button
          onClick={onAdd}
          disabled={!csvData.trim()}
          className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Add Records
        </button>
        {batchCount > 0 && (
          <button
            onClick={onReview}
            className="px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg font-medium transition-all"
          >
            Review ({batchCount})
          </button>
        )}
      </div>
    </div>
  );
};

export default BatchCSVEntry;
