import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
  FileText,
  Activity,
} from "lucide-react";

const StatsCards = ({ attendanceData, year, month, fromDate, toDate }) => {
  // Logic to calculate counts based on monthly or date-range selection
  const counts = Object.keys(attendanceData).reduce(
    (acc, key) => {
      const dateObj = new Date(key);
      let isInRange = false;

      if (fromDate && toDate) {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        isInRange = dateObj >= from && dateObj <= to;
      } else {
        // Match year and month (handle 1-based month indexing)
        isInRange = key.startsWith(`${year}-${month + 1}`);
      }

      if (isInRange) {
        const status = attendanceData[key];
        if (acc.hasOwnProperty(status)) {
          acc[status] = (acc[status] || 0) + 1;
        }
      }

      return acc;
    },
    { Present: 0, Absent: 0, "Half Day": 0, Note: 0 },
  );

  const totalPossible = counts.Present + counts.Absent + counts["Half Day"];
  const attendanceRate = totalPossible
    ? Math.round((counts.Present / totalPossible) * 100)
    : 0;

  const cards = [
    {
      label: "Present",
      value: counts.Present,
      icon: UserCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      label: "Absent",
      value: counts.Absent,
      icon: UserX,
      color: "text-rose-500",
      bg: "bg-rose-50 dark:bg-rose-500/10",
    },
    {
      label: "Half Day",
      value: counts["Half Day"],
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-500/10",
    },
    {
      label: "Notes",
      value: counts.Note,
      icon: FileText,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-500/10",
    },
  ];

  return (
    /**
     * Parent Container Fix:
     * - mx-auto centers the entire block if the screen is wider than max-w-md.
     * - Removed items-center to allow children to stretch (fill width) by default.
     */
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">
      {/* --- Main Analytics Card --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full p-6 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
            Monthly Performance
          </h3>
          <Activity size={18} className="text-blue-500" />
        </div>

        <div className="flex items-center gap-6">
          {/* Radial Graph */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-100 dark:text-slate-800"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="251.2"
                initial={{ strokeDashoffset: 251.2 }}
                animate={{
                  strokeDashoffset: 251.2 - (251.2 * attendanceRate) / 100,
                }}
                className="text-blue-50" // Color fix: ensures visibility
                style={{ color: "#3b82f6" }} // Manual color override to blue-500
              />
            </svg>
            <span className="absolute text-lg font-black dark:text-white">
              {attendanceRate}%
            </span>
          </div>

          <div>
            <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">
              {totalPossible}
            </p>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase">
              Total Sessions
            </p>
            <div className="flex items-center gap-1 mt-2 text-emerald-500 font-bold text-xs">
              <TrendingUp size={14} />
              <span>Good Standing</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* --- Detailed Stats Grid --- 
          Grid items are now w-full so they split the space exactly 50/50.
      */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`w-full p-4 rounded-[24px] ${card.bg} border border-white/50 dark:border-transparent shadow-sm flex flex-col`}
          >
            <div
              className={`p-2 w-fit rounded-lg bg-white dark:bg-slate-800 mb-3 shadow-sm ${card.color}`}
            >
              <card.icon size={18} />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">
              {card.value}
            </p>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-1">
              {card.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* --- Total Summary Banner --- */}
      <motion.div
        whileHover={{ y: -5 }}
        className="w-full p-6 rounded-[32px] bg-slate-900 dark:bg-blue-600 text-white shadow-2xl relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all" />
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-60">
          Total Classes Conducted
        </p>
        <div className="flex items-baseline gap-2 mt-2">
          <h2 className="text-5xl font-black">{totalPossible}</h2>
          <span className="text-xs font-bold opacity-60">Session units</span>
        </div>
      </motion.div>
    </div>
  );
};

export default StatsCards;
