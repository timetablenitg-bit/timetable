import React, { useState, useEffect } from "react";
import { X, Calendar, BookOpen, CheckCircle } from "lucide-react";

const EditSessionModal = ({ session, activeSession, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: session._id,
    academic_year: session.academic_year,
    term: session.term,
    isActive: session.isActive.toString(),
  });
  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.academic_year.trim()) {
      newErrors.academic_year = "Academic year is required";
    } else if (!/^\d{4}$/.test(formData.academic_year)) {
      newErrors.academic_year = "Please enter a valid year (e.g., 2025)";
    }
    return newErrors;
  };

  const getTransitionMessage = () => {
    if (formData.isActive !== "true" || session.isActive) return null;
    if (!activeSession) return "This will become the active session.";

    const oldTerm = activeSession.term;
    const oldYear = parseInt(activeSession.academic_year);
    const newTerm = session.term;
    const newYear = parseInt(session.academic_year);

    const isForward =
      newYear > oldYear ||
      (newYear === oldYear && oldTerm === "EVEN" && newTerm === "ODD");

    if (isForward) {
      if (oldTerm === "EVEN" && newTerm === "ODD") {
        return "Moving forward: all students will have their semester +1 and year +1.";
      } else if (oldTerm === "ODD" && newTerm === "EVEN") {
        return "Moving forward: all students will have their semester +1. Year stays the same.";
      }
    } else {
      if (oldTerm === "ODD" && newTerm === "EVEN" && newYear === oldYear) {
        return "Moving backward: all students will have their semester −1 and year −1.";
      } else if (
        oldTerm === "EVEN" &&
        newTerm === "ODD" &&
        newYear === oldYear - 1
      ) {
        return "Moving backward: all students will have their semester −1. Year stays the same.";
      }
    }

    return "This will become the active session.";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const isActiveChanged = formData.isActive !== session.isActive.toString();
    if (isActiveChanged) {
      setShowConfirm(true);
      return;
    }

    handleSave();
  };

  const handleSave = async () => {
    setServerError("");
    const result = await onSave(formData);
    if (result?.success === false) {
      setServerError(result.message || "Failed to update session");
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md relative">
        {/* ── Confirmation Overlay ── */}
        {showConfirm && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center p-6 z-10">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl w-full max-w-sm space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base">
                    Confirm Status Change
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formData.isActive === "true"
                      ? getTransitionMessage()
                      : "You are about to deactivate this session. Are you sure?"}
                  </p>
                  {formData.isActive === "true" && activeSession && (
                    <p className="text-xs text-red-400 mt-2">
                      This will also deactivate the current session (
                      {activeSession.academic_year} {activeSession.term}). This
                      cannot be easily undone.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 
                           rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 
                           dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirm(false);
                    handleSave();
                  }}
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 
                           text-white rounded-lg transition-colors text-sm font-semibold"
                >
                  Yes, Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            Edit Academic Session
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Academic Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Session Name *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.academic_year}
                onChange={(e) => {
                  setFormData({ ...formData, academic_year: e.target.value });
                  setErrors({ ...errors, academic_year: "" });
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 
                         rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent
                         dark:bg-gray-700 dark:text-white transition-all"
                placeholder="e.g., 2026"
                autoFocus
              />
            </div>
            {errors.academic_year && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.academic_year}
              </p>
            )}
          </div>

          {/* Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Semester Type *
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={formData.term}
                onChange={(e) =>
                  setFormData({ ...formData, term: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 
                         rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent
                         dark:bg-gray-700 dark:text-white transition-all cursor-pointer"
              >
                <option value="EVEN">EVEN Semester</option>
                <option value="ODD">ODD Semester</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status *
            </label>
            <div className="relative">
              <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 
                         rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent
                         dark:bg-gray-700 dark:text-white transition-all cursor-pointer"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              <span className="font-semibold">⚠</span> {serverError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 
                       rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 
                       dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 
                       hover:from-amber-600 hover:to-orange-600 text-white rounded-lg 
                       transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSessionModal;
