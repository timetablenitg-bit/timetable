// components/AddFacultyModal/ManualEntry.jsx
import React from "react";

const ManualEntry = ({
  formData,
  setFormData,
  onAdd,
  onReview,
  facultyCount,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd();
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="flex-1 space-y-10">
        <div className="transform transition-all duration-200 hover:translate-x-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Faculty ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.facultyId}
            onChange={(e) =>
              setFormData({ ...formData, facultyId: e.target.value })
            }
            placeholder="e.g., KUK-APS"
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
          />
        </div>
        <div className="transform transition-all duration-200 hover:translate-x-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Faculty Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Dr. Karuna Umakant Korgaonkar"
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
          />
        </div>
        <div className="transform transition-all duration-200 hover:translate-x-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Department <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) =>
              setFormData({ ...formData, department: e.target.value })
            }
            placeholder="e.g., APS, CSE, ECE"
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-6 mt-auto">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          Add to Review List
        </button>
        {facultyCount > 0 && (
          <button
            type="button"
            onClick={onReview}
            className="px-4 py-2 border border-emerald-600 text-white hover:bg-emerald-50 dark:hover:bg-emerald-600 rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Review ({facultyCount})
          </button>
        )}
      </div>
    </form>
  );
};

export default ManualEntry;
