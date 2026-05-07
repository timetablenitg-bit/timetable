// components/AddFacultyModal/FileUpload.jsx
import React from "react";
import { Upload, FileText } from "lucide-react";

const FileUpload = ({
  file,
  previewData,
  onFileUpload,
  onAdd,
  onReview,
  facultyCount,
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-8 text-center hover:border-emerald-500 dark:hover:border-emerald-400 transition-all duration-300 h-[330px] flex flex-col justify-center hover:bg-emerald-50/50 dark:hover:bg-emerald-900/5">
          <Upload className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3 transition-all duration-300 group-hover:scale-110" />
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            Upload CSV or Excel file
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-4">
            File should contain: Faculty ID, Name, Department (comma separated)
          </p>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={onFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] w-fit mx-auto"
          >
            <FileText className="w-4 h-4" />
            Choose File
          </label>
          {file && (
            <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 animate-in slide-in-from-top duration-300">
              Selected: {file.name}
            </p>
          )}
        </div>

        {previewData.length > 0 && (
          <div className="mt-4 animate-in slide-in-from-bottom duration-300">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Preview ({previewData.length} records)
            </h3>
            <div className="overflow-x-auto border border-gray-200 dark:border-slate-800 rounded-lg max-h-48 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                      Faculty ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                      Department
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {previewData.slice(0, 5).map((faculty, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors duration-200"
                    >
                      <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300">
                        {faculty.facultyId}
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300">
                        {faculty.name}
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300">
                        {faculty.department}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 5 && (
                <p className="text-xs text-center text-slate-500 dark:text-slate-400 py-2">
                  +{previewData.length - 5} more records
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-3 pt-6 mt-auto">
        <button
          onClick={onAdd}
          disabled={previewData.length === 0}
          className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Add {previewData.length} Records to Review
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

export default FileUpload;
