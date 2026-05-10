// components/AddBatch/BatchReviewSection.jsx
import React, { useState } from "react";
import {
  Edit2,
  Trash2,
  Save,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";

const BatchReviewSection = ({
  batchList,
  onUpdate,
  onDelete,
  onAddMore,
  onSubmit,
  isSubmitting,
  programOptions = ["BTECH", "MTECH", "PHD"],
  departmentOptions = ["CSE", "ECE", "MECH", "CIVIL", "EEE", "APS", "HSS"],
  yearOptions = [1, 2, 3, 4],
  semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8],
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editFormData, setEditFormData] = useState({
    program: "",
    department: "",
    year: "",
    semester: "",
    batch_name: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(batchList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBatches = batchList.slice(startIndex, endIndex);

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditFormData(batchList[index]);
  };

  const handleUpdate = () => {
    if (!editFormData.batch_name) {
      toast.error("Batch Name is required!");
      return;
    }
    onUpdate(editingIndex, editFormData);
    setEditingIndex(null);
    setEditFormData({
      program: "",
      department: "",
      year: "",
      semester: "",
      batch_name: "",
    });
  };

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this batch?")) {
      onDelete(index);
      if (currentBatches.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  if (batchList.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400">
          No batches added yet
        </p>
        <button
          onClick={onAddMore}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Add Batches
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div>
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
            Total Batches to Submit
          </p>
          <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">
            {batchList.length} {batchList.length === 1 ? "Batch" : "Batches"}
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={onAddMore}
            className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            Add More
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSubmitting
              ? "Submitting..."
              : `Submit All (${batchList.length})`}
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {editingIndex !== null && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            Edit Batch
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Batch Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editFormData.batch_name}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    batch_name: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Program
              </label>
              <select
                value={editFormData.program}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, program: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {programOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Department
              </label>
              <select
                value={editFormData.department}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    department: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {departmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Year
              </label>
              <select
                value={editFormData.year}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    year: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Year</option>
                {yearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Semester
              </label>
              <select
                value={editFormData.semester}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    semester: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Semester</option>
                {semesterOptions.map((option) => (
                  <option key={option} value={option}>
                    Semester {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-6">
            <button
              onClick={handleUpdate}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all"
            >
              Update Batch
            </button>
            <button
              onClick={() => {
                setEditingIndex(null);
                setEditFormData({
                  program: "",
                  department: "",
                  year: "",
                  semester: "",
                  batch_name: "",
                });
              }}
              className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Batches Table */}
      {editingIndex === null && (
        <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Batch Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Semester
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                {currentBatches.map((batch, idx) => (
                  <tr
                    key={batch.id || idx}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {startIndex + idx + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                      {batch.batch_name}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium">
                        {batch.program}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {batch.department}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {batch.year}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      Semester {batch.semester}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(startIndex + idx)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mr-3 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(startIndex + idx)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchReviewSection;
