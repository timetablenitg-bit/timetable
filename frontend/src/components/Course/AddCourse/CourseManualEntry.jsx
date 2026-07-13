import React from "react";
import CustomDropdown from "../../../ui/CustomDropdown";

const DEPARTMENTS = ["CSE", "ECE", "EEE", "CVE", "MCE", "APS", "HSS"];
const NATURES = ["CORE", "MINOR", "ELECTIVE", "PROJECT", "SEMINAR"];

const CourseManualEntry = ({
  formData,
  setFormData,
  onAdd,
  onReview,
  courseCount,
}) => {
  const isLab = formData.course_type === "LAB";

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd();
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col py-3">
      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Course Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.course_code}
              onChange={(e) =>
                setFormData({ ...formData, course_code: e.target.value })
              }
              placeholder="e.g., CS250"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Course Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.course_name}
              onChange={(e) =>
                setFormData({ ...formData, course_name: e.target.value })
              }
              placeholder="e.g., Database Systems"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Semester <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="8"
              value={formData.semester_offered}
              onChange={(e) =>
                setFormData({ ...formData, semester_offered: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div>
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

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Type
            </label>
            <CustomDropdown
              value={formData.course_type}
              options={["THEORY", "LAB"]}
              onChange={(val) => setFormData({ ...formData, course_type: val })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nature
            </label>
            <CustomDropdown
              value={formData.nature}
              options={NATURES}
              onChange={(val) => setFormData({ ...formData, nature: val })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Department
            </label>
            <CustomDropdown
              value={formData.department}
              options={DEPARTMENTS}
              onChange={(val) => setFormData({ ...formData, department: val })}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {isLab ? (
              <div className="col-span-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  P (Practical)
                </label>
                <input
                  type="number"
                  value={formData.practical}
                  onChange={(e) =>
                    setFormData({ ...formData, practical: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    L
                  </label>
                  <input
                    type="number"
                    value={formData.lecture}
                    onChange={(e) =>
                      setFormData({ ...formData, lecture: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    T
                  </label>
                  <input
                    type="number"
                    value={formData.tutorial}
                    onChange={(e) =>
                      setFormData({ ...formData, tutorial: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </>
            )}
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
