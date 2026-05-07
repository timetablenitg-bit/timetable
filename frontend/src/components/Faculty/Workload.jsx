import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const Workload = () => {
  const data = [
    { name: "Completed", value: 18, color: "#22c55e" },
    { name: "Remaining", value: 6, color: "#ef4444" },
    { name: "Free Slots", value: 4, color: "#3b82f6" },
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const stats = [
    { label: "Total Lectures", value: 24 },
    { label: "Completed", value: 18 },
    { label: "Remaining", value: 6 },
    { label: "Free Slots", value: 4 },
  ];

  // 🎯 Custom Tooltip with %
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percent = ((item.value / total) * 100).toFixed(1);

      return (
        <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow">
          <p>{item.name}</p>
          <p>
            {item.value} ({percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // 🎯 Center % (Completed)
  const completedPercent = ((data[0].value / total) * 100).toFixed(0);

  return (
    <div className="space-y-5 w-full mx-auto p-1">
      {/* ================= PAGE HEADER ================= */}
      <div className="flex items-center gap-4 mb-6 px-1 sm:px-2">
        <div className="p-3 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl shadow-sm border border-purple-200 dark:border-purple-500/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
            <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Workload Dashboard
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor your lecture distribution and progress
          </p>
        </div>
      </div>

      {/* ================= TOP STATS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((item, i) => (
          <div
            key={i}
            className="bg-white/70 dark:bg-slate-800 backdrop-blur-md p-3 sm:p-4 rounded-2xl text-center shadow border border-slate-200 dark:border-slate-700 hover:scale-[1.03] transition"
          >
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {item.label}
            </p>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
              {item.value}
            </h3>
          </div>
        ))}
      </div>

      {/* ================= PIE CHART ================= */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm sm:text-base font-semibold mb-2 text-slate-900 dark:text-white">
          Workload Distribution
        </h3>

        {/* Chart */}
        <div className="w-full h-48 sm:h-56 flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={3}
                animationDuration={900}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label */}
          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {completedPercent}%
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
              Completed
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs sm:text-sm">
          {data.map((item, i) => {
            const percent = ((item.value / total) * 100).toFixed(0);
            return (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: item.color }}
                ></div>
                <span className="text-slate-600 dark:text-slate-300">
                  {item.name} ({percent}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Workload;
