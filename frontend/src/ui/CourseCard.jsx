import React from "react";
import {
  Trash2,
  Edit3,
  BookOpen,
  Layers,
  Monitor,
  Award,
  FlaskConical,
  Presentation,
} from "lucide-react";

const NATURE_CONFIG = {
  CORE: {
    color:
      "text-blue-600 bg-blue-50 dark:bg-blue-400/10 border-blue-100 dark:border-blue-400/20",
    icon: BookOpen,
  },
  ELECTIVE: {
    color:
      "text-purple-600 bg-purple-50 dark:bg-purple-400/10 border-purple-100 dark:border-purple-400/20",
    icon: Layers,
  },
  MINOR: {
    color:
      "text-amber-600 bg-amber-50 dark:bg-amber-400/10 border-amber-100 dark:border-amber-400/20",
    icon: Award,
  },
  PROJECT: {
    color:
      "text-rose-600 bg-rose-50 dark:bg-rose-400/10 border-rose-100 dark:border-rose-400/20",
    icon: FlaskConical,
  },
  SEMINAR: {
    color:
      "text-teal-600 bg-teal-50 dark:bg-teal-400/10 border-teal-100 dark:border-teal-400/20",
    icon: Presentation,
  },
  default: {
    color:
      "text-slate-600 bg-slate-50 dark:bg-slate-400/10 border-slate-100 dark:border-slate-400/20",
    icon: Award,
  },
};

const CourseCard = ({ course, onEdit, onDelete }) => {
  const config = NATURE_CONFIG[course.nature] || NATURE_CONFIG.default;
  const TypeIcon = course.course_type === "LAB" ? Monitor : config.icon;

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 
      hover:bg-slate-50/80 dark:hover:bg-slate-800/50 
      hover:shadow-md hover:border-cyan-500/40 hover:ring-1 hover:ring-cyan-500/10
      w-full max-w-[320px] cursor-default
      h-[210px] flex flex-col justify-between shrink-0"
    >
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
        <div className="flex gap-1">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border transition-colors duration-300 ${config.color}`}
          >
            {course.nature || "Course"}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase border text-slate-500 bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700">
            {course.course_type}
          </span>
        </div>

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
