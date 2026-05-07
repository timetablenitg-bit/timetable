import React from "react";
import CustomDropdown from "../../ui/CustomDropdown";
import { DoorOpen, Plus } from "lucide-react"; // DoorOpen fits the 'Room' theme

const branches = ["CSE", "ECE", "IT", "MECH", "CIVIL"];

const RoomHeader = ({ selectedBranch, setSelectedBranch, onAddClick }) => {
  return (
    <div className="w-full bg-gray-100 dark:bg-slate-900 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-300 dark:border-slate-800 p-2 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 transition-all relative">
      {/* Decorative Blur - Matched exactly to reference */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-teal-500/10 dark:bg-teal-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-4 p-1">
          {/* Icon Container with soft glow - Matched size/style */}
          <div className="flex items-center justify-center w-10 h-10 bg-teal-50 border border-teal-100 shadow-sm rounded-xl">
            <DoorOpen size={20} className="text-teal-600" />
          </div>

          <div className="flex flex-col">
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-teal-600 to-emerald-700 bg-clip-text text-transparent">
              Room Management
            </h1>
            <p className="italic text-xs font-md font-thin text-slate-500 tracking-widest uppercase">
              Management Portal
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto relative z-10">
        <div className="w-full sm:w-56">
          <CustomDropdown
            label="Branch:"
            options={branches}
            value={selectedBranch}
            onChange={setSelectedBranch}
            placeholder="Select Branch"
          />
        </div>

        <button
          onClick={onAddClick}
          disabled={!selectedBranch}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold shadow-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 ${
            selectedBranch
              ? "cursor-pointer bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-teal-500/30 hover:shadow-teal-500/50"
              : "bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none"
          }`}
        >
          <Plus size={20} />
          Assign Room
        </button>
      </div>
    </div>
  );
};

export default RoomHeader;
