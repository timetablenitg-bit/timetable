import React from "react";
import { DoorClosed, Pencil, Trash2, MapPin } from "lucide-react";

const RoomCard = ({ assignment, onEdit, onDelete }) => {
  return (
    <div className="group relative bg-white dark:bg-slate-900 hover:bg-green-100 dark:hover:bg-emerald-950/30 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full max-w-sm flex flex-col gap-5 min-h-60 h-fit">
      {/* Key changes in the line above:
         - Added 'hover:bg-green-100'
         - Added 'dark:hover:bg-emerald-950/30' for a subtle dark green hover
         - Kept 'h-fit' to prevent expansion
      */}

      {/* Header: Status & Actions */}
      <div className="flex justify-between items-center shrink-0">
        <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Assigned
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(assignment)}
            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:text-teal-400 dark:hover:bg-teal-500/10 rounded-md transition-colors"
          >
            <Pencil size={14} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => onDelete(assignment.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-md transition-colors"
          >
            <Trash2 size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Body: Main Information */}
      <div className="flex-1">
        <h3 className="text-base font-bold text-gray-900 dark:text-white truncate mb-1.5">
          {assignment.batchName}
        </h3>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <MapPin size={12} className="opacity-70" />
          {assignment.labName}
        </p>
      </div>

      {/* Footer: Room Information Dock */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 transition-colors group-hover:bg-white/50 dark:group-hover:bg-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-gray-100 dark:border-slate-600">
            <DoorClosed
              size={16}
              className="text-gray-600 dark:text-gray-300"
              strokeWidth={2}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-0.5">
              Room
            </span>
            <span className="text-sm font-extrabold text-gray-800 dark:text-gray-100 leading-none">
              {assignment.roomNumber}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;

