// components/AddCourseModal/CourseFileUpload.jsx
import React from "react";
import { Upload, FileText } from "lucide-react";

const CourseFileUpload = ({
  file,
  previewData,
  onFileUpload,
  onAdd,
  onReview,
  courseCount,
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg p-8 text-center hover:border-emerald-500 dark:hover:border-emerald-400 transition-all duration-300 h-[340px] flex flex-col justify-center hover:bg-emerald-50/50 dark:hover:bg-emerald-900/5">
          <Upload className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3 transition-all duration-300 group-hover:scale-110" />
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            Upload CSV File
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-4">
            File should contain: Course Code, Course Name, Semester, Credits,
            Type, Department, Nature, L, T, P
          </p>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={onFileUpload}
            className="hidden"
            id="course-file-upload"
          />
          <label
            htmlFor="course-file-upload"
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
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                      Code
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                      Sem
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                      Credits
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                      Dept
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {previewData.slice(0, 5).map((course, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors duration-200"
                    >
                      <td className="px-3 py-2 text-sm font-medium text-slate-900 dark:text-white">
                        {course.courseCode}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
                        {course.courseName}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
                        {course.semester}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
                        {course.credits}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${course.type === "Lab" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"}`}
                        >
                          {course.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
                        {course.department}
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
        {courseCount > 0 && (
          <button
            onClick={onReview}
            className="px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            Review ({courseCount})
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseFileUpload;
