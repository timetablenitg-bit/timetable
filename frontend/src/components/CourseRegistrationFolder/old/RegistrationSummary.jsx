import React from "react";
import {
  Calculator,
  BookOpen,
  Microscope,
  AlertCircle,
  FileText,
  Trash2,
} from "lucide-react";

const RegistrationSummary = ({ selectedCourses, onRemove }) => {
  // --- Logic: Calculate Stats ---
  const stats = {
    total: selectedCourses.length,
    credits: selectedCourses.reduce((sum, c) => sum + Number(c.credits), 0),
    theory: selectedCourses.filter((c) => c.type === "Theory").length,
    practical: selectedCourses.filter((c) => c.type === "Lab").length,
    backlog: selectedCourses.filter((c) => c.nature === "BACKLOG").length,
  };

  if (selectedCourses.length === 0) return null;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* 📊 Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Total Subjects"
          value={stats.total}
          icon={<FileText size={20} />}
          color="indigo"
        />
        <StatCard
          label="Total Credits"
          value={stats.credits}
          icon={<Calculator size={20} />}
          color="emerald"
        />
        <StatCard
          label="Theory"
          value={stats.theory}
          icon={<BookOpen size={20} />}
          color="amber"
        />
        <StatCard
          label="Practicals"
          value={stats.practical}
          icon={<Microscope size={20} />}
          color="blue"
        />
        <StatCard
          label="Backlogs"
          value={stats.backlog}
          icon={<AlertCircle size={20} />}
          color="red"
        />
      </div>

      {/* 📋 Details Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-widest">
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Subject Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-center">L-T-P</th>
                <th className="px-6 py-4 text-center">Credits</th>
                <th className="px-6 py-4">Nature</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {selectedCourses.map((course) => (
                <tr
                  key={course.code}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                    {course.code}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {course.name}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                        course.type === "Theory"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {course.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-xs text-slate-500">
                    {course.L}-{course.T}-{course.P}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {course.credits}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-bold ${
                        course.nature === "CORE"
                          ? "text-emerald-500"
                          : course.nature === "BACKLOG"
                            ? "text-red-500"
                            : "text-slate-400"
                      }`}
                    >
                      ● {course.nature}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onRemove(course.code)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
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

// --- Sub-component: Stat Card ---
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
      className={`p-4 rounded-2xl border ${colors[color]} flex flex-col items-center text-center gap-1`}
    >
      <div className="mb-1">{icon}</div>
      <span className="text-2xl font-black">{value}</span>
      <span className="text-[10px] font-bold uppercase tracking-tighter opacity-80">
        {label}
      </span>
    </div>
  );
};

export default RegistrationSummary;
