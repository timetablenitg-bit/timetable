import React from "react";
import { Trash2, Edit3, BookOpen, Layers, Monitor, Award } from "lucide-react";

const CourseCard = ({ course, onEdit, onDelete }) => {
  const getTypeConfig = (type) => {
    const lowerType = type?.toLowerCase();
    const configs = {
      core: {
        color:
          "text-blue-600 bg-blue-50 dark:bg-blue-400/10 border-blue-100 dark:border-blue-400/20",
        icon: BookOpen,
      },
      elective: {
        color:
          "text-purple-600 bg-purple-50 dark:bg-purple-400/10 border-purple-100 dark:border-purple-400/20",
        icon: Layers,
      },
      lab: {
        color:
          "text-emerald-600 bg-emerald-50 dark:bg-emerald-400/10 border-emerald-100 dark:border-emerald-400/20",
        icon: Monitor,
      },
      default: {
        color:
          "text-slate-600 bg-slate-50 dark:bg-slate-400/10 border-slate-100 dark:border-slate-400/20",
        icon: Award,
      },
    };
    return configs[lowerType] || configs.default;
  };

  const config = getTypeConfig(course.type);
  const TypeIcon = config.icon;

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 
      hover:bg-slate-50/80 dark:hover:bg-slate-800/50 
      hover:shadow-md hover:border-cyan-500/40 hover:ring-1 hover:ring-cyan-500/10
      w-full max-w-[320px] cursor-default
      h-[210px] flex flex-col justify-between shrink-0"
    >
      {/* CHANGES MADE ABOVE:
          1. h-[210px]: Sets a strict fixed height.
          2. flex flex-col: Allows us to use spacing utilities to pin the footer.
          3. justify-between: Pushes the top content and bottom actions apart.
          4. shrink-0: Prevents the parent flex container from squishing the card.
      */}

      <div>
        {/* Top Section: Icon & Credits */}
        <div className="flex justify-between items-start mb-3">
          <div
            className={`p-2 rounded-lg border transition-transform duration-300 group-hover:scale-110 ${config.color}`}
          >
            <TypeIcon size={20} strokeWidth={2.5} />
          </div>
          <div className="text-right">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              Credits
            </span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {course.credits}
            </span>
          </div>
        </div>

        {/* Main Info */}
        <div className="mb-2">
          <code className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">
            {course.course_code}
          </code>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
            {course.course_name}
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Semester {course.semester_offered}
          </p>
        </div>
      </div>

      {/* Actions: Pinned to bottom via flex justify-between */}
      <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800/50">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border transition-colors duration-300 ${config.color}`}
        >
          {course.course_type || "Course"}
        </span>

        <div className="flex gap-1">
          <button
            onClick={() => onEdit(course)}
            className="group relative p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-100/50 dark:hover:bg-cyan-400/20 rounded-md transition-all cursor-pointer active:scale-90"
          >
            <Edit3 size={18} />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col items-center group-hover:flex hidden">
              <span className="relative z-10 p-2 px-3 text-[10px] leading-none text-white font-bold whitespace-nowrap bg-slate-800 shadow-lg rounded-md animate-in fade-in slide-in-from-bottom-2 duration-200">
                EDIT
              </span>
              <div className="w-2 h-2 -mt-1 rotate-45 bg-slate-800"></div>
            </div>
          </button>

          <button
            onClick={() => onDelete(course._id)}
            className="group relative p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-100/50 dark:hover:bg-red-500/20 rounded-md transition-all cursor-pointer active:scale-90"
          >
            <Trash2 size={18} />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col items-center group-hover:flex hidden">
              <span className="relative z-10 p-2 px-3 text-[10px] leading-none text-white font-bold whitespace-nowrap bg-red-600 shadow-lg rounded-md animate-in fade-in slide-in-from-bottom-2 duration-200">
                DELETE
              </span>
              <div className="w-2 h-2 -mt-1 rotate-45 bg-red-600"></div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
