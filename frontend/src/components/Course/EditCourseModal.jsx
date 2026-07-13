import React, { useState } from "react";
import { toast } from "react-toastify";
import { X } from "lucide-react";

const DEPARTMENTS = ["CSE", "ECE", "EEE", "CVE", "MCE", "APS", "HSS"];
const NATURES = ["CORE", "MINOR", "ELECTIVE", "PROJECT", "SEMINAR"];

const EditCourseModal = ({ course, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    ...course,
    course_type: course.course_type || "THEORY",
    nature: course.nature || "CORE",
    department: course.department || "",
    lecture: course.lecture ?? 0,
    tutorial: course.tutorial ?? 0,
    practical: course.practical ?? 0,
  });

  const isLab = formData.course_type === "LAB";

  const handleSave = () => {
    if (!formData.course_code || !formData.course_name || !formData.credits) {
      toast.error("Course Code, Name, and Credits are required!");
      return;
    }
    onSave({
      ...formData,
      lecture: isLab ? 0 : Number(formData.lecture) || 0,
      tutorial: isLab ? 0 : Number(formData.tutorial) || 0,
      practical: isLab ? Number(formData.practical) || 0 : 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-emerald-500 dark:bg-emerald-900/10 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Edit Course
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                Course Code <span className="text-red-500">*</span>
              </label>
              <input
                value={formData.course_code}
                onChange={(e) =>
                  setFormData({ ...formData, course_code: e.target.value })
                }
                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              />
            </div>

            <div className="md:col-span-4">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                Course Name <span className="text-red-500">*</span>
              </label>
              <input
                value={formData.course_name}
                onChange={(e) =>
                  setFormData({ ...formData, course_name: e.target.value })
                }
                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                Semester
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={formData.semester_offered}
                onChange={(e) =>
                  setFormData({ ...formData, semester_offered: e.target.value })
                }
                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                Credits <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.credits}
                onChange={(e) =>
                  setFormData({ ...formData, credits: e.target.value })
                }
                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                Type
              </label>
              <select
                value={formData.course_type}
                onChange={(e) =>
                  setFormData({ ...formData, course_type: e.target.value })
                }
                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              >
                <option value="THEORY">THEORY</option>
                <option value="LAB">LAB</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                Nature
              </label>
              <select
                value={formData.nature}
                onChange={(e) =>
                  setFormData({ ...formData, nature: e.target.value })
                }
                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              >
                {NATURES.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>

            {isLab ? (
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                  P (Practical)
                </label>
                <input
                  type="number"
                  value={formData.practical}
                  onChange={(e) =>
                    setFormData({ ...formData, practical: e.target.value })
                  }
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                />
              </div>
            ) : (
              <>
                <div className="md:col-span-3">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                    L (Lecture)
                  </label>
                  <input
                    type="number"
                    value={formData.lecture}
                    onChange={(e) =>
                      setFormData({ ...formData, lecture: e.target.value })
                    }
                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                    T (Tutorial)
                  </label>
                  <input
                    type="number"
                    value={formData.tutorial}
                    onChange={(e) =>
                      setFormData({ ...formData, tutorial: e.target.value })
                    }
                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-all active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCourseModal;
