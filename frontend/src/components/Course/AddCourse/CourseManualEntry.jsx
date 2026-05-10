// components/AddCourseModal/CourseManualEntry.jsx
import React from "react";
import CustomDropdown from "../../../ui/CustomDropdown";

const CourseManualEntry = ({
  formData,
  setFormData,
  onAdd,
  onReview,
  courseCount,
  selectedBranch,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd();
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col py-3">
      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="transform transition-all duration-200 hover:translate-x-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Course Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.courseCode}
              onChange={(e) =>
                setFormData({ ...formData, courseCode: e.target.value })
              }
              placeholder="e.g., CS250"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="transform transition-all duration-200 hover:translate-x-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Course Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.courseName}
              onChange={(e) =>
                setFormData({ ...formData, courseName: e.target.value })
              }
              placeholder="e.g., Database Systems"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="transform transition-all duration-200 hover:translate-x-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Semester <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="8"
              value={formData.semester}
              onChange={(e) =>
                setFormData({ ...formData, semester: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="transform transition-all duration-200 hover:translate-x-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Credits <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.5"
              value={formData.credits}
              onChange={(e) =>
                setFormData({ ...formData, credits: e.target.value })
              }
              placeholder="e.g., 4"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="transform transition-all duration-200 hover:translate-x-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Type
            </label>
            <CustomDropdown
              value={formData.type}
              options={["Theory", "Lab"]}
              onChange={(val) => setFormData({ ...formData, type: val })}
            />
          </div>

          <div className="transform transition-all duration-200 hover:translate-x-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nature
            </label>
            <CustomDropdown
              value={formData.nature}
              options={["CORE", "MINOR", "ELECTIVE", "PROJECT", "SEMINAR"]}
              onChange={(val) => setFormData({ ...formData, nature: val })}
            />
          </div>

          <div className="transform transition-all duration-200 hover:translate-x-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Department
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              placeholder="e.g., CSE"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="transform transition-all duration-200 hover:translate-x-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                L
              </label>
              <input
                type="number"
                value={formData.l}
                onChange={(e) =>
                  setFormData({ ...formData, l: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="transform transition-all duration-200 hover:translate-x-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                T
              </label>
              <input
                type="number"
                value={formData.t}
                onChange={(e) =>
                  setFormData({ ...formData, t: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="transform transition-all duration-200 hover:translate-x-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                P
              </label>
              <input
                type="number"
                value={formData.p}
                onChange={(e) =>
                  setFormData({ ...formData, p: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-3 pt-6 mt-auto md:pb-1 pb-7">
        <button
          type="submit"
          className="cursor-pointer flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          Add to Review List
        </button>
        {courseCount > 0 && (
          <button
            type="button"
            onClick={onReview}
            className="px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            Review ({courseCount})
          </button>
        )}
      </div>
    </form>
  );
};

export default CourseManualEntry;
