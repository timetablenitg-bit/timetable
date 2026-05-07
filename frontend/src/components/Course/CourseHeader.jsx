// import React from "react";
// import CustomDropdown from "../../ui/CustomDropdown";
// import { NotebookText, Plus } from "lucide-react";

// const branches = ["APS", "CVE", "CSE", "ECE", "EEE", "HSS", "MCE"];

// const CourseHeader = ({ selectedBranch, setSelectedBranch, onAddClick }) => {
//   return (
//     <div className="w-full bg-gray-100 dark:bg-slate-900 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-300 dark:border-slate-800 p-2 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 transition-all relative">
//       {/* Decorative Blur - Exact match to reference positioning */}
//       <div className="absolute inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute -top-10 -left-10 w-40 h-40 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-3xl"></div>
//       </div>

//       <div className="relative z-10">
//         <div className="flex items-center gap-4 p-1">
//           {/* Icon Container: Matches w-10 h-10 and rounded-xl */}
//           <div className="flex items-center justify-center w-10 h-10 bg-cyan-50 border border-cyan-100 shadow-sm rounded-xl">
//             <NotebookText size={20} className="text-cyan-600" />
//           </div>

//           <div className="flex flex-col">
//             <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-cyan-600 to-blue-700 bg-clip-text text-transparent">
//               Course Library
//             </h1>
//             <p className="italic text-xs font-md font-thin text-slate-500 tracking-widest">
//               MANAGEMENT PORTAL
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto relative z-10">
//         <div className="w-full sm:w-56">
//           <CustomDropdown
//             label="Branch:"
//             options={branches}
//             value={selectedBranch}
//             onChange={setSelectedBranch}
//             placeholder="Select Branch"
//           />
//         </div>

//         <button
//           onClick={onAddClick}
//           disabled={!selectedBranch}
//           className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold shadow-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 ${
//             selectedBranch
//               ? "cursor-pointer bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/30 hover:shadow-cyan-500/50"
//               : "bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none"
//           }`}
//         >
//           <Plus size={20} />
//           Add Course
//         </button>
//       </div>
//     </div>
//   );
// };

// export default CourseHeader;
import React from "react";
import CustomDropdown from "../../ui/CustomDropdown";
import { BookOpen, Plus } from "lucide-react";

const branches = ["CSE", "ECE", "EEE", "MCE", "CVE", "APS", "HSS"];

const CourseHeader = ({ onAddClick }) => {
  return (
    <div className="w-full bg-gray-100 dark:bg-slate-900 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-300 dark:border-slate-800 p-2 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 transition-all relative">
      {/* Decorative Blur - Emerald theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-4 p-1">
          {/* Icon Container - Emerald theme */}
          <div className="flex items-center justify-center w-10 h-10 bg-emerald-50 border border-emerald-100 shadow-sm rounded-xl">
            <BookOpen size={20} className="text-emerald-600" />
          </div>

          <div className="flex flex-col">
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-emerald-600 to-teal-700 bg-clip-text text-transparent">
              Course Library
            </h1>
            <p className="italic text-xs font-md font-thin text-slate-500 tracking-widest">
              MANAGEMENT PORTAL
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto relative z-10">
        <button
          onClick={onAddClick}
          className={`cursor-pointer w-full sm:w-auto px-6 py-3 rounded-xl font-bold shadow-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50`}
        >
          <Plus size={20} />
          Add Course
        </button>
      </div>
    </div>
  );
};

export default CourseHeader;
