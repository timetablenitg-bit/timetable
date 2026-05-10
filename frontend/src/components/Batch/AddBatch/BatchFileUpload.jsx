// components/AddBatch/BatchFileUpload.jsx
import React from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";

const BatchFileUpload = ({
  file,
  previewData,
  onFileUpload,
  onAdd,
  onReview,
  batchCount,
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-8 text-center hover:border-emerald-500 dark:hover:border-emerald-400 transition-all duration-300 h-[340px] flex flex-col justify-center hover:bg-emerald-50/50 dark:hover:bg-emerald-900/5">
          <Upload className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            Upload CSV File
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Required: Program, Department, Year, Semester, Batch Name
          </p>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg mb-4 max-w-md mx-auto">
            <p className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 mb-1 uppercase tracking-wider">
              Example format:
            </p>
            <code className="text-xs text-emerald-700 dark:text-emerald-400 block whitespace-pre">
              BTECH, CSE, 2, 3, CSE_3rd_Sem
            </code>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-300 mt-1">
              Note: Room assignment will be done separately after batch creation
            </p>
          </div>

          <input
            type="file"
            accept=".csv,.txt"
            onChange={onFileUpload}
            className="hidden"
            id="batch-file-upload"
          />
          <label
            htmlFor="batch-file-upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg cursor-pointer transition-all hover:scale-[1.02] w-fit mx-auto"
          >
            <FileText className="w-4 h-4" />
            Choose CSV File
          </label>

          {file && (
            <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Selected: {file.name}
            </p>
          )}
        </div>

        {/* Preview Table */}
        {previewData.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Preview ({previewData.length} records found)
            </h3>
            <div className="overflow-x-auto border border-gray-200 dark:border-slate-800 rounded-lg max-h-60 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">
                      #
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">
                      Program
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">
                      Dept
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">
                      Year
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">
                      Sem
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">
                      Batch Name
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {previewData.slice(0, 5).map((batch, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {batch.program}
                      </td>
                      <td className="px-3 py-2 text-xs">{batch.department}</td>
                      <td className="px-3 py-2 text-xs">{batch.year}</td>
                      <td className="px-3 py-2 text-xs">{batch.semester}</td>
                      <td className="px-3 py-2 text-xs font-semibold">
                        {batch.batch_name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.length > 5 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                +{previewData.length - 5} more records
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 mt-auto border-t border-gray-100 dark:border-slate-800">
        <button
          onClick={onAdd}
          disabled={previewData.length === 0}
          className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Add {previewData.length > 0 ? previewData.length : ""} Records
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

export default BatchFileUpload;
