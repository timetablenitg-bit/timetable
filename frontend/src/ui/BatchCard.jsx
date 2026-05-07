import React from "react";
import { Edit3, Trash2, Users } from "lucide-react"; // Using Lucide for cleaner animation

const BatchCard = ({ batch, onEdit, onDelete }) => {
  const getStatusColors = (status) => {
    if (status?.toLowerCase() === "active") {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50";
    }
    return "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300";
  };

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between w-full max-w-[320px] h-[210px] shrink-0">
      <div>
        <div className="flex justify-between items-center mb-3">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColors(batch.status)}`}
          >
            {batch.status?.toUpperCase()}
          </span>
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700">
            {batch.degree}
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight line-clamp-1 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {batch.batch_name}
        </h3>

        <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>
            Year:{" "}
            <strong className="text-slate-900 dark:text-slate-200">
              {batch.year}
            </strong>
          </span>
          <span>
            Sem:{" "}
            <strong className="text-slate-900 dark:text-slate-200">
              {batch.semester}
            </strong>
          </span>
        </div>
      </div>

      {/* Bottom Row: Students & Actions */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2 pl-3 flex justify-between items-center border border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
          <Users size={16} className="text-indigo-500" />
          <span>
            <strong className="text-slate-900 dark:text-white text-sm">
              {batch.students}
            </strong>{" "}
            Students
          </span>
        </div>

        <div className="flex gap-1">
          {/* EDIT BUTTON WITH ANIMATION */}
          <button
            onClick={() => onEdit(batch)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg transition-all duration-200 cursor-pointer active:scale-90 group/edit"
            title="Edit Batch"
          >
            <Edit3
              size={18}
              className="transition-transform duration-200 group-hover/edit:rotate-12 group-hover/edit:scale-110"
            />
          </button>

          {/* DELETE BUTTON WITH ANIMATION */}
          <button
            onClick={() => onDelete(batch._id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-all duration-200 cursor-pointer active:scale-90 group/del"
            title="Delete Batch"
          >
            <Trash2
              size={18}
              className="transition-transform duration-200 group-hover/del:-rotate-12 group-hover/del:scale-110"
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchCard;
