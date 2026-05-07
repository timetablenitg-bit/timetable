import React, { useEffect, useState } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";

// Mock data for testing
const MOCK_FACULTIES = [
  {
    _id: "fac_1",
    name: "Dr. Sarah Johnson",
    faculty_code: "FAC001",
    designation: "Professor",
    specialization: "CSE",
  },
  {
    _id: "fac_2",
    name: "Prof. Michael Chen",
    faculty_code: "FAC002",
    designation: "Associate Professor",
    specialization: "CSE",
  },
  {
    _id: "fac_3",
    name: "Dr. Emily Davis",
    faculty_code: "FAC003",
    designation: "Professor",
    specialization: "ECE",
  },
  {
    _id: "fac_4",
    name: "Prof. Robert Wilson",
    faculty_code: "FAC004",
    designation: "Assistant Professor",
    specialization: "MECH",
  },
];

const MOCK_COURSES = [
  {
    _id: "course_1",
    course_name: "Data Structures",
    course_code: "CS101",
    credits: 4,
    department: "CSE",
  },
  {
    _id: "course_2",
    course_name: "Algorithms",
    course_code: "CS102",
    credits: 4,
    department: "CSE",
  },
  {
    _id: "course_3",
    course_name: "Digital Electronics",
    course_code: "EC201",
    credits: 3,
    department: "ECE",
  },
  {
    _id: "course_4",
    course_name: "Thermodynamics",
    course_code: "ME301",
    credits: 3,
    department: "MECH",
  },
];

const MOCK_BATCHES = [
  {
    _id: "batch_1",
    batch_name: "CSE 2024 - Section A",
    branch: "CSE",
    year: "1st Year",
    semester: "1",
  },
  {
    _id: "batch_2",
    batch_name: "CSE 2023 - Section B",
    branch: "CSE",
    year: "2nd Year",
    semester: "3",
  },
  {
    _id: "batch_3",
    batch_name: "ECE 2024 - Section A",
    branch: "ECE",
    year: "1st Year",
    semester: "1",
  },
  {
    _id: "batch_4",
    batch_name: "MECH 2023 - Section A",
    branch: "MECH",
    year: "2nd Year",
    semester: "3",
  },
];

const AssignmentModal = ({
  isOpen,
  onClose,
  existingAssignment,
  session,
  onSave,
}) => {
  const isEditing = !!existingAssignment;

  const [form, setForm] = useState({
    course_id: "",
    faculty_id: "",
    batch_id: "",
    backlog_batch_id: "",
  });
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local state for data (mock)
  const [faculties] = useState(MOCK_FACULTIES);
  const [courses] = useState(MOCK_COURSES);
  const [batches] = useState(MOCK_BATCHES);

  // ========== BACKEND INTEGRATION (COMMENTED FOR NOW) ==========
  // If you want to use real API, uncomment the store import and use these:
  // const {
  //   createCourseAssignment,
  //   updateCourseAssignment,
  //   faculties,
  //   courses,
  //   batches,
  //   isSaving,
  // } = useAdminStore();

  useEffect(() => {
    if (isEditing && existingAssignment) {
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

    setIsSubmitting(true);

    const payload = {
      session_id: session?._id,
      course_id: form.course_id,
      faculty_id: form.faculty_id,
      batch_id: form.batch_id,
      backlog_batch_id: form.backlog_batch_id || null,
    };

    // ========== BACKEND INTEGRATION (COMMENTED) ==========
    // Uncomment when backend is ready:
    /*
    const result = isEditing
      ? await updateCourseAssignment(existingAssignment._id, {
          faculty_id: form.faculty_id,
          backlog_batch_id: form.backlog_batch_id || null,
        })
      : await createCourseAssignment(payload);

    if (result?.success === false) {
      setFormError(result.message || "Something went wrong.");
      setIsSubmitting(false);
    } else {
      setIsSubmitting(false);
      onClose();
      if (onSave) onSave(payload, isEditing);
    }
    */

    // ========== FRONTEND SIMULATION (ACTIVE) ==========
    // Simulate API delay
    setTimeout(() => {
      console.log("Assignment saved:", payload);
      console.log("Mode:", isEditing ? "Edit" : "Create");

      setIsSubmitting(false);
      onClose();

      // Call onSave callback if provided
      if (onSave) {
        const newAssignment = {
          _id: isEditing ? existingAssignment._id : Date.now().toString(),
          ...payload,
          course_id: courses.find((c) => c._id === form.course_id),
          faculty_id: faculties.find((f) => f._id === form.faculty_id),
          batch_id: batches.find((b) => b._id === form.batch_id),
          backlog_batch_id: form.backlog_batch_id
            ? batches.find((b) => b._id === form.backlog_batch_id)
            : null,
          createdAt: isEditing
            ? existingAssignment.createdAt
            : new Date().toISOString(),
        };
        onSave(newAssignment, isEditing);
      }
    }, 500);
  };

  const selectClass =
    "w-full px-3.5 py-2.5 rounded-lg text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition";

  // Get selected course name for display
  const getSelectedCourseName = () => {
    const course = courses.find((c) => c._id === form.course_id);
    return course ? `${course.course_name} (${course.course_code})` : "";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {isEditing ? "Edit Assignment" : "Assign Course"}
            </h2>
            {session && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Session: {session.academic_year} - {session.term}
              </p>
            )}
          </div>
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
              Course{" "}
              {isEditing && (
                <span className="text-xs text-gray-400">
                  (cannot be changed)
                </span>
              )}
            </label>
            <select
              name="course_id"
              value={form.course_id}
              onChange={handleChange}
              disabled={isEditing}
              className={`${selectClass} ${isEditing ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800" : ""}`}
            >
              <option value="">Select a course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.course_name} ({c.course_code})
                </option>
              ))}
            </select>
            {isEditing && form.course_id && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Selected: {getSelectedCourseName()}
              </p>
            )}
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
                  {f.name} ({f.faculty_code}) - {f.designation}
                </option>
              ))}
            </select>
          </div>

          {/* Batch — disabled when editing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Batch{" "}
              {isEditing && (
                <span className="text-xs text-gray-400">
                  (cannot be changed)
                </span>
              )}
            </label>
            <select
              name="batch_id"
              value={form.batch_id}
              onChange={handleChange}
              disabled={isEditing}
              className={`${selectClass} ${isEditing ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800" : ""}`}
            >
              <option value="">Select a batch</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.batch_name} ({b.branch})
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
                  {b.batch_name} ({b.branch})
                </option>
              ))}
            </select>
          </div>

          {/* Summary Preview */}
          {form.course_id && form.faculty_id && form.batch_id && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                Assignment Summary
              </p>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <p>
                  📚 Course:{" "}
                  {courses.find((c) => c._id === form.course_id)?.course_name}
                </p>
                <p>
                  👨‍🏫 Faculty:{" "}
                  {faculties.find((f) => f._id === form.faculty_id)?.name}
                </p>
                <p>
                  👥 Batch:{" "}
                  {batches.find((b) => b._id === form.batch_id)?.batch_name}
                </p>
                {form.backlog_batch_id && (
                  <p>
                    🔄 Backlog Batch:{" "}
                    {
                      batches.find((b) => b._id === form.backlog_batch_id)
                        ?.batch_name
                    }
                  </p>
                )}
              </div>
            </div>
          )}

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
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isEditing ? "Save Changes" : "Assign Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentModal;
