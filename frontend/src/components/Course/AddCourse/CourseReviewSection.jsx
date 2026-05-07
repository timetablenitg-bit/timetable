// components/AddCourseModal/CourseReviewSection.jsx
import React, { useState } from "react";
import {
  Edit2,
  Trash2,
  Save,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { toast } from "react-toastify";
import CustomDropdown from "../../../ui/CustomDropdown";

const CourseReviewSection = ({
  courseList,
  onUpdate,
  onDelete,
  onAddMore,
  onSubmit,
  isSubmitting,
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editFormData, setEditFormData] = useState({
    courseCode: "",
    courseName: "",
    semester: "",
    credits: "",
    type: "",
    department: "",
    nature: "",
    l: "",
    t: "",
    p: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(courseList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCourses = courseList.slice(startIndex, endIndex);

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditFormData(courseList[index]);
  };

  const handleUpdate = () => {
    if (
      !editFormData.courseCode ||
      !editFormData.courseName ||
      !editFormData.credits
    ) {
      toast.error("Course Code, Name, and Credits are required!");
      return;
    }
    onUpdate(editingIndex, {
      ...editFormData,
      id: courseList[editingIndex].id,
    });
    setEditingIndex(null);
    setEditFormData({
      courseCode: "",
      courseName: "",
      semester: "",
      credits: "",
      type: "",
      department: "",
      nature: "",
      l: "",
      t: "",
      p: "",
    });
  };

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      onDelete(index);
      if (currentCourses.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  if (courseList.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400">
          No courses added yet
        </p>
        <button
          onClick={onAddMore}
          className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          Add Courses
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
            Total Courses to Submit
          </p>
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
            {courseList.length} {courseList.length === 1 ? "Course" : "Courses"}
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={onAddMore}
            className="px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
          >
            Add More
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSubmitting
              ? "Submitting..."
              : `Submit All (${courseList.length})`}
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {editingIndex !== null && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            Edit Course
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Course Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editFormData.courseCode}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    courseCode: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Course Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editFormData.courseName}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    courseName: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Semester
              </label>
              <input
                type="number"
                value={editFormData.semester}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, semester: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Credits <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                value={editFormData.credits}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, credits: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Type
              </label>
              <CustomDropdown
                value={editFormData.type}
                options={["Theory", "Lab"]}
                onChange={(val) =>
                  setEditFormData({ ...editFormData, type: val })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nature
              </label>
              <CustomDropdown
                value={editFormData.nature}
                options={["CORE", "MINOR", "ELECTIVE", "PROJECT", "SEMINAR"]}
                onChange={(val) =>
                  setEditFormData({ ...editFormData, nature: val })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Department
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
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  L
                </label>
                <input
                  type="number"
                  value={editFormData.l}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, l: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  T
                </label>
                <input
                  type="number"
                  value={editFormData.t}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, t: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  P
                </label>
                <input
                  type="number"
                  value={editFormData.p}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, p: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-6">
            <button
              onClick={handleUpdate}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all"
            >
              Update Course
            </button>
            <button
              onClick={() => {
                setEditingIndex(null);
                setEditFormData({
                  courseCode: "",
                  courseName: "",
                  semester: "",
                  credits: "",
                  type: "",
                  department: "",
                  nature: "",
                  l: "",
                  t: "",
                  p: "",
                });
              }}
              className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Courses Table */}
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
                    Course Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Course Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Sem
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Dept
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    L-T-P
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                {currentCourses.map((course, idx) => (
                  <tr
                    key={course.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {startIndex + idx + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                      {course.courseCode}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {course.courseName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {course.semester}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {course.credits}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          course.type === "Lab"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}
                      >
                        {course.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      {course.department}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded text-xs font-mono">
                        {course.l}-{course.t}-{course.p}
                      </span>
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

export default CourseReviewSection;
