import React, { useState, useEffect } from "react";
import { X, Building, Hash, ToggleLeft, ToggleRight } from "lucide-react";

const FacultyDetailModal = ({
  faculty,
  isEditing = false,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (faculty) {
      setFormData({
        name: faculty.name || "",
        email: faculty.email || "",
        department: faculty.department || "",
        is_active: faculty.is_active ?? false,
      });
    }
  }, [faculty]);

  if (!faculty) return null;

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave({
      ...faculty, // preserves _id
      name: formData.name,
      email: formData.email,
      department: formData.department,
      is_active: formData.is_active,
    });
  };

  const departmentOptions = ["CSE", "CVE", "ECE", "EEE", "MCE", "APS", "HSS"];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-[101] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 flex items-center justify-between text-white shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold backdrop-blur-md">
              {isEditing
                ? formData.name?.charAt(0) || "F"
                : faculty.name?.charAt(0) || "F"}
            </div>
            <div>
              <h2 className="text-xl font-bold">{faculty.name}</h2>
              <p className="text-emerald-100 text-sm">{faculty.faculty_code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5 overflow-y-auto flex-1">
          {/* Faculty Code – always read-only */}
          <DetailField
            icon={<Hash size={18} />}
            label="Faculty Code"
            value={faculty.faculty_code}
            editable={false}
          />

          {/* Name */}
          <DetailField
            icon={<Hash size={18} />} // You can swap to User icon if you add lucide
            label="Full Name"
            value={isEditing ? formData.name : faculty.name}
            onChange={handleChange("name")}
            editable={isEditing}
          />

          {/* Email */}
          <DetailField
            icon={<Hash size={18} />}
            label="Email"
            value={isEditing ? formData.email : faculty.email || "N/A"}
            onChange={handleChange("email")}
            editable={isEditing}
            type="email"
          />

          {/* Department */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
              <Building size={18} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Department
              </p>
              {isEditing ? (
                <select
                  className="w-full mt-1 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.department}
                  onChange={handleChange("department")}
                >
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                  {faculty.department}
                </p>
              )}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
              {formData.is_active ? (
                <ToggleRight size={18} />
              ) : (
                <ToggleLeft size={18} />
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Status
              </p>
              {isEditing ? (
                <label className="flex items-center gap-2 mt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={handleChange("is_active")}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-200">
                    Active
                  </span>
                </label>
              ) : (
                <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                  {faculty.is_active ? "Active" : "Inactive"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-t border-slate-200 dark:border-slate-800 shrink-0 rounded-b-2xl">
          {isEditing ? (
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              >
                Discard
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple DetailField helper
const DetailField = ({
  icon,
  label,
  value,
  onChange,
  editable,
  type = "text",
}) => (
  <div className="flex items-start gap-3">
    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
      {editable ? (
        <input
          type={type}
          className="w-full mt-1 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
          value={value}
          onChange={onChange}
        />
      ) : (
        <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
          {value}
        </p>
      )}
    </div>
  </div>
);

export default FacultyDetailModal;
