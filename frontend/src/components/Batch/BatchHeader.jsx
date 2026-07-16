import React from "react";
import CustomDropdown from "../../ui/CustomDropdown";
import { Layers, Plus } from "lucide-react";

const BatchHeader = ({ onAddClick }) => {
  return (
    <div className="w-full bg-gray-100 dark:bg-slate-900 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-300 dark:border-slate-800 p-2 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 transition-all relative">
      {/* FIXED: Decorative blur container exactly like reference */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-4 p-1">
          {/* Icon Container: Matches w-10 h-10 and rounded-xl */}
          <div className="flex items-center justify-center w-10 h-10 bg-indigo-50 border border-indigo-100 shadow-sm rounded-xl">
            <Layers size={20} className="text-indigo-600" />
          </div>

          <div className="flex flex-col">
            <h1 className="text-2xl font-extrabold tracking-tight bg-linear-to-br from-indigo-600 to-violet-700 bg-clip-text text-transparent">
              Batch Management
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
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold shadow-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 ${"cursor-pointer bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50"}`}
        >
          <Plus size={20} />
          Add Batch
        </button>
      </div>
    </div>
  );
};

export default BatchHeader;
