import React, { useEffect, useState } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import useAdminStore from "../../../../store/useAdminStore";

const AssignmentModal = ({ isOpen, onClose, existingAssignment, session }) => {
  const {
    createCourseAssignment,
    updateCourseAssignment,
    faculties,
    courses,
    batches,
    isSaving,
  } = useAdminStore();

  const isEditing = !!existingAssignment;

  const [form, setForm] = useState({
    course_id: "",
    faculty_id: "",
    batch_id: "",
    backlog_batch_id: "",
  });
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (isEditing) {
      setForm({
        course_id:
          existingAssignment.course_id?._id ??
          existingAssignment.course_id ??
          "",
        faculty_id:
          existingAssignment.faculty_id?._id ??
          existingAssignment.faculty_id ??
          "",
        batch_id:
          existingAssignment.batch_id?._id ?? existingAssignment.batch_id ?? "",
        backlog_batch_id:
          existingAssignment.backlog_batch_id?._id ??
          existingAssignment.backlog_batch_id ??
          "",
      });
    } else {
      setForm({
        course_id: "",
        faculty_id: "",
        batch_id: "",
        backlog_batch_id: "",
      });
    }
    setFormError(null);
  }, [existingAssignment, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.course_id || !form.faculty_id || !form.batch_id) {
      setFormError("Course, faculty, and batch are required.");
      return;
    }

    const payload = {
      session_id: session._id,
      course_id: form.course_id,
      faculty_id: form.faculty_id,
      batch_id: form.batch_id,
      backlog_batch_id: form.backlog_batch_id || null,
    };

    const result = isEditing
      ? await updateCourseAssignment(existingAssignment._id, {
          faculty_id: form.faculty_id,
          backlog_batch_id: form.backlog_batch_id || null,
        })
      : await createCourseAssignment(payload);

    if (result?.success === false) {
      setFormError(result.message || "Something went wrong.");
    } else {
      onClose();
    }
  };

  const selectClass =
    "w-full px-3.5 py-2.5 rounded-lg text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {isEditing ? "Edit Assignment" : "Assign Course"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={15} />
              {formError}
            </div>
          )}

          {/* Course — disabled when editing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Course
            </label>
            <select
              name="course_id"
              value={form.course_id}
              onChange={handleChange}
              disabled={isEditing}
              className={`${selectClass} ${isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <option value="">Select a course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.course_name} ({c.course_code})
                </option>
              ))}
            </select>
          </div>

          {/* Faculty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Faculty
            </label>
            <select
              name="faculty_id"
              value={form.faculty_id}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="">Select a faculty member</option>
              {faculties.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name} ({f.faculty_code})
                </option>
              ))}
            </select>
          </div>

          {/* Batch — disabled when editing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Batch
            </label>
            <select
              name="batch_id"
              value={form.batch_id}
              onChange={handleChange}
              disabled={isEditing}
              className={`${selectClass} ${isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <option value="">Select a batch</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.batch_name}
                </option>
              ))}
            </select>
          </div>

          {/* Backlog Batch (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Backlog Batch{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              name="backlog_batch_id"
              value={form.backlog_batch_id}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="">None</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.batch_name}
                </option>
              ))}
            </select>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              {isEditing ? "Save Changes" : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentModal;
