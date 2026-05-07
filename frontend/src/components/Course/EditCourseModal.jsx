// import React, { useState } from "react";
// import { toast } from "react-toastify";

// const EditCourseModal = ({ course, onClose, onSave }) => {
//   // Pre-fill with the existing 10 fields
//   const [formData, setFormData] = useState({
//     ...course,
//     // Provide fallbacks just in case older data lacks the new fields
//     type: course.course_type || "Theory",
//     nature: course.nature || "CORE",
//     department: course.department || course.branch || "",
//     l: course.lecture || "0",
//     t: course.tutorial || "0",
//     p: course.practical || "0",
//   });

//   const handleSave = () => {
//     if (!formData.course_code || !formData.course_name || !formData.credits) {
//       toast.error("Course Code, Name, and Credits are required!");
//       return;
//     }
//     onSave(formData);
//   };

//   return (
//     <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//       <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
//         {/* Header */}
//         <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-cyan-50/50 dark:bg-cyan-900/10">
//           <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
//             Edit Course
//           </h2>
//           <button
//             onClick={onClose}
//             className="p-2 bg-white dark:bg-slate-800 rounded-full text-gray-500 hover:text-red-500 transition-colors"
//           >
//             <svg
//               className="w-6 h-6"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2"
//                 d="M6 18L18 6M6 6l12 12"
//               ></path>
//             </svg>
//           </button>
//         </div>

//         {/* Form Body */}
//         <div className="p-6 overflow-y-auto">
//           <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
//             <div className="md:col-span-2">
//               <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
//                 Course Code
//               </label>
//               <input
//                 value={formData.course_code}
//                 onChange={(e) =>
//                   setFormData({ ...formData, course_code: e.target.value })
//                 }
//                 className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-gray-800 dark:text-white"
//               />
//             </div>

//             <div className="md:col-span-4">
//               <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
//                 Course Name
//               </label>
//               <input
//                 value={formData.course_name}
//                 onChange={(e) =>
//                   setFormData({ ...formData, course_name: e.target.value })
//                 }
//                 className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-gray-800 dark:text-white"
//               />
//             </div>

//             <div className="md:col-span-2">
//               <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
//                 Semester
//               </label>
//               <input
//                 type="number"
//                 value={formData.semester_offered}
//                 onChange={(e) =>
//                   setFormData({ ...formData, semester_offered: e.target.value })
//                 }
//                 className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-gray-800 dark:text-white"
//               />
//             </div>

//             <div className="md:col-span-2">
//               <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
//                 Credits
//               </label>
//               <input
//                 type="number"
//                 value={formData.credits}
//                 onChange={(e) =>
//                   setFormData({ ...formData, credits: e.target.value })
//                 }
//                 className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-gray-800 dark:text-white"
//               />
//             </div>

//             <div className="md:col-span-2">
//               <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
//                 Department
//               </label>
//               <input
//                 value={formData.department}
//                 onChange={(e) =>
//                   setFormData({ ...formData, department: e.target.value })
//                 }
//                 className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-gray-800 dark:text-white"
//               />
//             </div>

//             <div className="md:col-span-3">
//               <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
//                 Type
//               </label>
//               <select
//                 value={formData.type}
//                 onChange={(e) =>
//                   setFormData({ ...formData, type: e.target.value })
//                 }
//                 className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-gray-800 dark:text-white"
//               >
//                 <option>Theory</option>
//                 <option>Lab</option>
//               </select>
//             </div>

//             <div className="md:col-span-3">
//               <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
//                 Nature
//               </label>
//               <select
//                 value={formData.nature}
//                 onChange={(e) =>
//                   setFormData({ ...formData, nature: e.target.value })
//                 }
//                 className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-gray-800 dark:text-white"
//               >
//                 <option>CORE</option>
//                 <option>MINOR</option>
//                 <option>ELECTIVE</option>
//                 <option>PROJECT</option>
//                 <option>SEMINAR</option>
//               </select>
//             </div>

//             <div className="md:col-span-2">
//               <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
//                 L (Lecture)
//               </label>
//               <input
//                 type="number"
//                 value={formData.l}
//                 onChange={(e) =>
//                   setFormData({ ...formData, l: e.target.value })
//                 }
//                 className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-gray-800 dark:text-white"
//               />
//             </div>
//             <div className="md:col-span-2">
//               <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
//                 T (Tutorial)
//               </label>
//               <input
//                 type="number"
//                 value={formData.t}
//                 onChange={(e) =>
//                   setFormData({ ...formData, t: e.target.value })
//                 }
//                 className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-gray-800 dark:text-white"
//               />
//             </div>
//             <div className="md:col-span-2">
//               <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
//                 P (Practical)
//               </label>
//               <input
//                 type="number"
//                 value={formData.p}
//                 onChange={(e) =>
//                   setFormData({ ...formData, p: e.target.value })
//                 }
//                 className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 text-gray-800 dark:text-white"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-end gap-3 shrink-0">
//           <button
//             onClick={onClose}
//             className="px-6 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSave}
//             className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/30 transition-all active:scale-95"
//           >
//             Save Changes
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EditCourseModal;
import React, { useState } from "react";
import { toast } from "react-toastify";
import { X } from "lucide-react";

const EditCourseModal = ({ course, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    ...course,
    type: course.type || "Theory",
    nature: course.nature || "CORE",
    department: course.department || course.branch || "",
    l: course.l || "0",
    t: course.t || "0",
    p: course.p || "0",
  });

  const handleSave = () => {
    if (!formData.courseCode || !formData.courseName || !formData.credits) {
      toast.error("Course Code, Name, and Credits are required!");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Header */}
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
                value={formData.courseCode}
                onChange={(e) =>
                  setFormData({ ...formData, courseCode: e.target.value })
                }
                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              />
            </div>

            <div className="md:col-span-4">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                Course Name <span className="text-red-500">*</span>
              </label>
              <input
                value={formData.courseName}
                onChange={(e) =>
                  setFormData({ ...formData, courseName: e.target.value })
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
                value={formData.semester}
                onChange={(e) =>
                  setFormData({ ...formData, semester: e.target.value })
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
              <input
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              >
                <option>Theory</option>
                <option>Lab</option>
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
                <option>CORE</option>
                <option>MINOR</option>
                <option>ELECTIVE</option>
                <option>PROJECT</option>
                <option>SEMINAR</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                L (Lecture)
              </label>
              <input
                type="number"
                value={formData.l}
                onChange={(e) =>
                  setFormData({ ...formData, l: e.target.value })
                }
                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                T (Tutorial)
              </label>
              <input
                type="number"
                value={formData.t}
                onChange={(e) =>
                  setFormData({ ...formData, t: e.target.value })
                }
                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                P (Practical)
              </label>
              <input
                type="number"
                value={formData.p}
                onChange={(e) =>
                  setFormData({ ...formData, p: e.target.value })
                }
                className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
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
