import React from "react";
import { Trash2, Loader2 } from "lucide-react";

const DeleteAssignmentModal = ({
  assignment,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!assignment) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Trash2 size={18} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Remove Assignment
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to remove{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {assignment.course_id?.course_name ?? "this course"}
              </span>{" "}
              assigned to{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {assignment.faculty_id?.name ?? "this faculty"}
              </span>
              ? This cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isDeleting && <Loader2 size={14} className="animate-spin" />}
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAssignmentModal;
