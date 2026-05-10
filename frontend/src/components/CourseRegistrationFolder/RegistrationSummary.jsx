import React from "react";
import {
  Calculator,
  BookOpen,
  Microscope,
  AlertCircle,
  FileText,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";

const RegistrationSummary = ({ selectedCourses, onRemove }) => {
  console.log(selectedCourses);
  const stats = {
    total: selectedCourses.length,
    credits: selectedCourses.reduce((sum, c) => sum + Number(c.credits), 0),
    theory: selectedCourses.filter((c) => c.type === "Theory").length,
    practical: selectedCourses.filter((c) => c.type === "Lab").length,
    // Change these lines:
    regular: selectedCourses.filter((c) => c.registrationType === "regular")
      .length,
    backlog: selectedCourses.filter((c) => c.registrationType === "backlog")
      .length,
  };

  const getRowColor = (registrationType) => {
    switch (registrationType) {
      case "regular":
        return "bg-emerald-50/50 ...";
      case "backlog":
        return "bg-red-50/50 ...";
      case "dropped":
        return "bg-amber-50/50 ...";
      default:
        return "hover:bg-slate-50/50 ...";
    }
  };

  const getBadgeColor = (registrationType) => {
    switch (registrationType) {
      case "regular":
        return "bg-emerald-100 text-emerald-700 ...";
      case "backlog":
        return "bg-red-100 text-red-700 ...";
      case "dropped":
        return "bg-amber-100 text-amber-700 ...";
      default:
        return "bg-gray-100 text-gray-700 ...";
    }
  };

  const getTypeIcon = (registrationType) => {
    switch (registrationType) {
      case "regular":
        return <CheckCircle size={12} />;
      case "backlog":
        return <AlertCircle size={12} />;
      case "dropped":
        return <XCircle size={12} />;
      default:
        return null;
    }
  };

  // Show info banner when no courses are selected
  if (selectedCourses.length === 0) {
    return (
      <div className="flex flex-col h-[420px] space-y-6 animate-in slide-in-from-bottom-4 duration-500 overflow-hidden">
        {/* Empty State Banner */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-w-0">
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
              No Courses Selected
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-4">
              You haven't added any courses to your registration yet. Browse the
              available courses below to get started.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full">
              <span>👇</span>
              <span>Add courses from Available Courses section</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[420px] space-y-6 animate-in slide-in-from-bottom-4 duration-500 overflow-hidden ">
      {/* 📋 Details Table - No horizontal scroll */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <table className="w-full text-left border-collapse min-w-0 table-fixed">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
              <tr className="text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-widest">
                <th className="px-4 py-4 w-[90px]">Code</th>
                <th className="px-4 py-4">Subject Name</th>
                <th className="px-4 py-4 text-center w-[80px]">Credits</th>
                <th className="px-4 py-4 text-center w-[100px]">Type</th>
                <th className="px-4 py-4 text-right w-[70px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {selectedCourses.map((course) => (
                <tr
                  key={course.code}
                  className={`transition-colors ${getRowColor(course.registrationType)}`}
                >
                  <td
                    className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400 text-sm truncate"
                    title={course.code}
                  >
                    {course.code}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <div className="truncate" title={course.name}>
                      {course.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {course.credits}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getBadgeColor(course.registrationType)}`}
                    >
                      {getTypeIcon(course.registrationType)}
                      <span className="hidden sm:inline">
                        {course.registrationType}
                      </span>
                      <span className="sm:hidden">
                        {course.registrationType === "Regular"
                          ? "Reg"
                          : course.registrationType === "Backlog"
                            ? "Back"
                            : "Drop"}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onRemove(course.code)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove course"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => {
  const colors = {
    indigo:
      "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20",
    emerald:
      "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20",
    amber:
      "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20",
    blue: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20",
    red: "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:border-red-500/20",
  };

  return (
    <div
      className={`p-3 rounded-xl border ${colors[color]} flex flex-col items-center text-center gap-0.5`}
    >
      <div className="mb-0.5">{icon}</div>
      <span className="text-xl font-black">{value}</span>
      <span className="text-[9px] font-bold uppercase tracking-tighter opacity-80">
        {label}
      </span>
    </div>
  );
};

export default RegistrationSummary;
