import React, { useState, useEffect } from "react";
// 💡 Make sure to update this import path to where your store is located
import { useStudentStore } from "../../store/useStudentStore";

const statuses = ["Present", "Absent", "Half Day", "Note"];

const colors = {
  Present: "bg-green-500",
  Absent: "bg-red-500",
  "Half Day": "bg-yellow-500",
  Note: "bg-blue-500",
};

const AttendanceTracker = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // 🆕 Hook into Zustand store
  const { attendanceData, fetchAttendance, markAttendance } = useStudentStore();

  // 🆕 Fetch data on mount via the store
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // 🆕 Use store action to save data
  const saveData = async (date, status) => {
    const success = await markAttendance(date, status);
    if (success) {
      setSelectedDate(null); // Close modal on success
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  for (let i = 0; i < firstDay; i++) daysArray.push(null);
  for (let i = 1; i <= totalDays; i++) daysArray.push(i);

  const formatDate = (day) => `${year}-${month + 1}-${day}`;

  // 📊 Stats
  let present = 0;
  let absent = 0;

  // 🆕 Use attendanceData instead of local data state
  Object.keys(attendanceData).forEach((key) => {
    if (key.startsWith(`${year}-${month + 1}`)) {
      if (attendanceData[key] === "Present") present++;
      if (attendanceData[key] === "Absent") absent++;
    }
  });

  const total = present + absent;
  const presentPercent = total ? ((present / total) * 100).toFixed(1) : 0;
  const absentPercent = total ? ((absent / total) * 100).toFixed(1) : 0;

  return (
    <div className="w-full mx-auto p-1">
      {/* ================= PAGE HEADER ================= */}
      <div className="flex items-center gap-4 mb-6 px-1 sm:px-2">
        <div className="p-3 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm border border-blue-200 dark:border-blue-500/30">
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
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
            <path d="M9 16l2 2 4-4"></path>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Attendance
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Manage and track daily records
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* ================= CALENDAR ================= */}
        <div className="flex-1 bg-slate-50/50 dark:bg-slate-800/30 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1))}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 shadow-sm hover:shadow-md hover:scale-105 transition-all text-slate-700 dark:text-slate-200 text-sm"
            >
              ◀
            </button>

            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-wide">
              {currentDate.toLocaleString("default", { month: "long" })} {year}
            </h3>

            <button
              onClick={() => setCurrentDate(new Date(year, month + 1))}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 shadow-sm hover:shadow-md hover:scale-105 transition-all text-slate-700 dark:text-slate-200 text-sm"
            >
              ▶
            </button>
          </div>

          {/* Week */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold mb-2 text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {daysArray.map((day, i) => {
              if (!day) return <div key={i}></div>;

              const key = formatDate(day);
              // 🆕 Check status from Zustand state
              const status = attendanceData[key];

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(key)}
                  className={`
                    h-10 sm:h-12 lg:h-12 flex flex-col items-center justify-center rounded-xl cursor-pointer text-sm font-semibold
                    transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md
                    ${
                      status
                        ? `${colors[status]} text-white shadow-sm`
                        : "bg-white dark:bg-slate-700/70 border border-slate-100 dark:border-slate-600 text-slate-700 dark:text-slate-200"
                    }
                  `}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= PREMIUM STATS ================= */}
        <div className="w-full lg:w-64 xl:w-72 shrink-0 space-y-4">
          {/* Present Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/60 transition-all hover:shadow-md">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Present
            </p>
            <h2 className="text-3xl font-bold text-green-500">
              {presentPercent}%
            </h2>
            <div className="mt-3 w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${presentPercent}%` }}
              />
            </div>
          </div>

          {/* Absent Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/60 transition-all hover:shadow-md">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Absent
            </p>
            <h2 className="text-3xl font-bold text-red-500">
              {absentPercent}%
            </h2>
            <div className="mt-3 w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${absentPercent}%` }}
              />
            </div>
          </div>

          {/* Total Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md hover:shadow-lg transition-all">
            <p className="text-xs font-medium text-blue-100 mb-1">
              Total Classes Counted
            </p>
            <h2 className="text-3xl font-bold">{total}</h2>
          </div>
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {selectedDate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 w-full max-w-xs shadow-2xl transform transition-all">
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white text-center border-b border-slate-100 dark:border-slate-700 pb-3">
              Mark attendance for <br />
              <span className="text-blue-600 dark:text-blue-400">
                {selectedDate}
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => saveData(selectedDate, s)}
                  className={`p-2.5 rounded-lg text-sm text-white font-semibold shadow-sm ${colors[s]} hover:-translate-y-0.5 hover:shadow-md transition-all duration-200`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedDate(null)}
              className="mt-5 w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold py-2.5 rounded-lg transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;
