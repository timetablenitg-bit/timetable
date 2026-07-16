import React, { useState } from "react";
import { X, DoorOpen } from "lucide-react";
import { toast } from "react-toastify";

const EditBatchModal = ({ batch, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    program: batch.program || "BTECH",
    department: batch.department || "",
    year: batch.year || "",
    semester: batch.semester || "",
    batch_name: batch.batch_name || "",
    lecture_room_id: batch.lecture_room_id || "",
  });

  const programOptions = ["BTECH", "MTECH", "PHD"];
  const departmentOptions = ["CSE", "ECE", "MCE", "CVE", "EEE", "APS", "HSS"];
  const yearOptions = [1, 2, 3, 4];
  const semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8];

  const handleSave = () => {
    if (
      !formData.batch_name ||
      !formData.department ||
      !formData.year ||
      !formData.semester
    ) {
      toast.error("Please fill all required fields!");
      return;
    }

    // Prepare data for backend - ensure lecture_room_id is null if empty string
    const submitData = {
      ...formData,
      lecture_room_id: formData.lecture_room_id || null,
    };
    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10">
          <div className="flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Edit Batch
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Batch Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.batch_name}
                onChange={(e) =>
                  setFormData({ ...formData, batch_name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Program <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.program}
                  onChange={(e) =>
                    setFormData({ ...formData, program: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {programOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departmentOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Year</option>
                  {yearOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      Year {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.semester}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      semester: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Semester</option>
                  {semesterOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      Semester {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Lecture Room
              </label>
              <input
                type="text"
                value={formData.lecture_room_id || ""}
                onChange={(e) =>
                  setFormData({ ...formData, lecture_room_id: e.target.value })
                }
                placeholder="e.g., Room 401, Block A"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Optional: Leave empty if no room assigned
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBatchModal;
