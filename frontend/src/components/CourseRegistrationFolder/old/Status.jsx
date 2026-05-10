import React from "react";

const Status = ({ formData }) => {
  if (!formData) return null;

  const { student, courses, status } = formData;

  const totalCredits = courses.reduce(
    (sum, course) => sum + (Number(course.credits) || 0),
    0,
  );

  return (
    <div className="w-full  mx-auto animate-in fade-in zoom-in duration-500">
      {/* Header Section */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4 ring-8 ring-emerald-50 dark:ring-emerald-900/10">
          <svg
            className="w-10 h-10 text-emerald-600 dark:text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Registration Confirmed
        </h2>
       
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            Student
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {student?.name}
          </p>
          <p className="text-xs text-gray-500">{student?.roll}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            Academic Year
          </p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Semester {student?.semester}
          </p>
          <p className="text-xs text-gray-500">Fall 2026 Batch</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400 uppercase tracking-widest mb-1">
            Status
          </p>
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm font-bold uppercase">{status}</p>
          </div>
          <p className="text-xs text-emerald-600/60">
            {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Courses List */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 dark:text-white">
            Course Summary
          </h3>
          <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-400">
            {courses.length} Units
          </span>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {courses.map((c, i) => (
            <div
              key={i}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-xs font-mono text-blue-500 dark:text-blue-400 font-bold">
                  {c.code || "N/A"}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {c.name}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <span
                  className={`hidden sm:block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                    c.type === "Regular"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                      : "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
                  }`}
                >
                  {c.type}
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white w-8 text-right">
                  {c.credits}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            Total Credit Hours
          </span>
          <span className="text-xl font-black text-gray-900 dark:text-white">
            {totalCredits}
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-dashed border-gray-200 dark:border-gray-700 pt-8 mt-8">
        <p className="text-xs text-gray-400 italic">
          * This is a computer-generated receipt and requires no signature.
        </p>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-gray-200 dark:shadow-none"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default Status;
