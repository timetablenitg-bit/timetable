// components/AddFacultyModal/ReviewSection.jsx
import React, { useState } from "react";
import {
  Edit2,
  Trash2,
  Save,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { toast } from "react-toastify";

const ReviewSection = ({
  facultyList,
  onUpdate,
  onDelete,
  onAddMore,
  onSubmit,
  isSubmitting,
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editFormData, setEditFormData] = useState({
    facultyId: "",
    name: "",
    department: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(facultyList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFaculties = facultyList.slice(startIndex, endIndex);

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditFormData(facultyList[index]);
  };

  const handleUpdate = () => {
    if (
      !editFormData.facultyId ||
      !editFormData.name ||
      !editFormData.department
    ) {
      toast.error("Please fill all fields");
      return;
    }
    onUpdate(editingIndex, {
      ...editFormData,
      id: facultyList[editingIndex].id,
    });
    setEditingIndex(null);
    setEditFormData({ facultyId: "", name: "", department: "" });
  };

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this faculty?")) {
      onDelete(index);
      if (currentFaculties.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  if (facultyList.length === 0) {
    return (
      <div className="text-center py-12">
        <UserPlus className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400">
          No faculty added yet
        </p>
        <button
          onClick={onAddMore}
          className="cursor-pointer mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          Add Faculty
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
        <div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            Total Faculty to Submit
          </p>
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
            {facultyList.length}{" "}
            {facultyList.length === 1 ? "Record" : "Records"}
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={onAddMore}
            className="cursor-pointer px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
          >
            Add More
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="cursor-pointer flex-1 sm:flex-none px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSubmitting
              ? "Submitting..."
              : `Submit All (${facultyList.length})`}
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {editingIndex !== null && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            Edit Faculty
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Faculty ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editFormData.facultyId}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    facultyId: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Faculty Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editFormData.department}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    department: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleUpdate}
                className="cursor-pointer flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all"
              >
                Update Faculty
              </button>
              <button
                onClick={() => {
                  setEditingIndex(null);
                  setEditFormData({ facultyId: "", name: "", department: "" });
                }}
                className="dark:text-white cursor-pointer px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Table */}
      {editingIndex === null && (
        <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Faculty ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                {currentFaculties.map((faculty, idx) => (
                  <tr
                    key={faculty.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {startIndex + idx + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                      {faculty.facultyId}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                      {faculty.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                      <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium">
                        {faculty.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        title="Edit"
                        onClick={() => handleEdit(startIndex + idx)}
                        className="cursor-pointer text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mr-3 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => handleDelete(startIndex + idx)}
                        className="cursor-pointer text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
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

export default ReviewSection;
