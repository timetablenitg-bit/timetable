import React, { useState, useEffect } from "react";
import { X, Calendar, BookOpen, CheckCircle } from "lucide-react";

const CreateSessionModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    academic_year: "",
    term: "EVEN",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.academic_year.trim()) {
      newErrors.academic_year = "Academic year is required";
    } else if (!/^\d{4}$/.test(formData.academic_year)) {
      newErrors.academic_year = "Please enter a valid year (e.g., 2025)";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length === 0) {
      setServerError("");
      const result = await onSave(formData); // ✅ check result instead of try/catch
      if (result?.success === false) {
        setServerError(result.message || "Failed to create session");
      } else {
        setFormData({ academic_year: "", term: "EVEN" });
        setErrors({});
      }
    } else {
      setErrors(newErrors);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md animate-modalPopIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-500 dark:to-teal-500 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            Create New Academic Session
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Session Name */}
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
                placeholder="e.g., 2026"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 
                         rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                         dark:bg-gray-700 dark:text-white transition-all"
                autoFocus
              />
            </div>
            {errors.academic_year && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 animate-fadeIn">
                {errors.academic_year}
              </p>
            )}
          </div>

          {/* Session Type */}
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
                         rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                         dark:bg-gray-700 dark:text-white transition-all cursor-pointer"
              >
                <option value="EVEN">EVEN Semester</option>
                <option value="ODD">ODD Semester</option>
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
              className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 
                       hover:from-emerald-700 hover:to-teal-600 text-white rounded-lg 
                       transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSessionModal;
