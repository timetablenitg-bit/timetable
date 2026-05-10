// components/AddBatch/BatchManualEntry.jsx
import React, { useState, useEffect, useRef } from "react";

const BatchManualEntry = ({
  formData,
  setFormData,
  onAdd,
  onReview,
  batchCount,
  programOptions = ["BTECH", "MTECH", "PHD"],
  departmentOptions = [
    "CSE",
    "ECE",
    "MCE",
    "CVE",
    "EEE",
    "APS",
    "HSS",
    "common",
  ],
  yearOptions = [1, 2, 3, 4, 5],
  semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8],
}) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [customDepartment, setCustomDepartment] = useState("");
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);

  const programRef = useRef(null);
  const departmentRef = useRef(null);
  const yearRef = useRef(null);
  const semesterRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd();
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideProgram =
        programRef.current && !programRef.current.contains(event.target);
      const isOutsideDepartment =
        departmentRef.current && !departmentRef.current.contains(event.target);
      const isOutsideYear =
        yearRef.current && !yearRef.current.contains(event.target);
      const isOutsideSemester =
        semesterRef.current && !semesterRef.current.contains(event.target);

      if (
        isOutsideProgram &&
        isOutsideDepartment &&
        isOutsideYear &&
        isOutsideSemester
      ) {
        setOpenDropdown(null);
        setShowCustomDepartment(false);
        setCustomDepartment("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
    setShowCustomDepartment(false);
    setCustomDepartment("");
  };

  const handleSelect = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setOpenDropdown(null);
  };

  const handleCustomDepartmentAdd = () => {
    if (customDepartment.trim()) {
      setFormData({ ...formData, department: customDepartment.trim() });
      setShowCustomDepartment(false);
      setCustomDepartment("");
      setOpenDropdown(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Batch Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Batch Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.batch_name}
              onChange={(e) =>
                setFormData({ ...formData, batch_name: e.target.value })
              }
              placeholder="e.g., 1st_Year_Sec_A or CSE_3rd_Sem"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
            />
          </div>

          {/* Program Dropdown */}
          <div className="relative" ref={programRef}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Program <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => toggleDropdown("program")}
              className="w-full px-4 py-2 text-left border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 flex justify-between items-center"
            >
              <span>{formData.program || "Select Program"}</span>
              <span
                className={`text-gray-400 transition-transform duration-200 ${openDropdown === "program" ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
            {openDropdown === "program" && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {programOptions.map((option) => (
                  <div
                    key={option}
                    onClick={() => handleSelect("program", option)}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Department Dropdown */}
          <div className="relative" ref={departmentRef}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Department <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => toggleDropdown("department")}
              className="w-full px-4 py-2 text-left border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 flex justify-between items-center"
            >
              <span>{formData.department || "Select Department"}</span>
              <span
                className={`text-gray-400 transition-transform duration-200 ${openDropdown === "department" ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
            {openDropdown === "department" && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {departmentOptions.map((option) => (
                  <div
                    key={option}
                    onClick={() => handleSelect("department", option)}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                  >
                    {option}
                  </div>
                ))}
                <div className="border-t border-gray-200 dark:border-slate-700">
                  {!showCustomDepartment ? (
                    <div
                      onClick={() => setShowCustomDepartment(true)}
                      className="px-4 py-2 text-emerald-600 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    >
                      + Add Custom Department
                    </div>
                  ) : (
                    <div className="p-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={customDepartment}
                        onChange={(e) => setCustomDepartment(e.target.value)}
                        placeholder="Enter department name"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        autoFocus
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleCustomDepartmentAdd()
                        }
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={handleCustomDepartmentAdd}
                          className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded transition-colors"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomDepartment(false);
                            setCustomDepartment("");
                          }}
                          className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Year Dropdown */}
          <div className="relative" ref={yearRef}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Year <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => toggleDropdown("year")}
              className="w-full px-4 py-2 text-left border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 flex justify-between items-center"
            >
              <span>
                {formData.year ? `Year ${formData.year}` : "Select Year"}
              </span>
              <span
                className={`text-gray-400 transition-transform duration-200 ${openDropdown === "year" ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
            {openDropdown === "year" && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                {yearOptions.map((option) => (
                  <div
                    key={option}
                    onClick={() => handleSelect("year", option)}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                  >
                    Year {option}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Semester Dropdown */}
          <div className="relative" ref={semesterRef}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Semester <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => toggleDropdown("semester")}
              className="w-full px-4 py-2 text-left border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 flex justify-between items-center"
            >
              <span>
                {formData.semester
                  ? `Semester ${formData.semester}`
                  : "Select Semester"}
              </span>
              <span
                className={`text-gray-400 transition-transform duration-200 ${openDropdown === "semester" ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
            {openDropdown === "semester" && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                {semesterOptions.map((option) => (
                  <div
                    key={option}
                    onClick={() => handleSelect("semester", option)}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                  >
                    Semester {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 mt-auto">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          Add to Review List
        </button>
        {batchCount > 0 && (
          <button
            type="button"
            onClick={onReview}
            className="px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            Review ({batchCount})
          </button>
        )}
      </div>
    </form>
  );
};

export default BatchManualEntry;
