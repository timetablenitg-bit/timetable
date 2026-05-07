import React, { useState } from "react";
import { CalendarCheck } from "lucide-react";
import CustomDropdown from "../../ui/CustomDropdown";

const AttendanceHeader = ({ onDownloadMonthly, onDownloadRange }) => {
  const [selectedOption, setSelectedOption] = useState("");

  const options = [
    { label: "📅 Monthly Report", value: "monthly" },
    { label: "📊 Date Range Report", value: "range" },
  ];

  const handleChange = (value) => {
    setSelectedOption(value);

    if (value === "monthly") {
      onDownloadMonthly();
    } else if (value === "range") {
      onDownloadRange();
    }

    // reset after action (so dropdown placeholder comes back)
    setTimeout(() => setSelectedOption(""), 500);
  };

  return (
    <header className="flex items-center justify-between mb-8 p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all">
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl blur-[3px] opacity-30"></div>
          <div className="relative p-2.5 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-slate-700 shadow-inner">
            <CalendarCheck size={20} strokeWidth={2.5} />
          </div>
        </div>

        <div>
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
            Attendance
          </h1>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-wider">
            Logs & Records
          </p>
        </div>
      </div>

      {/* RIGHT - CUSTOM DROPDOWN */}
      <div className="w-56">
        <CustomDropdown
          label="Report"
          options={options}
          value={selectedOption}
          onChange={handleChange}
          placeholder="Download Report"
        />
      </div>
    </header>
  );
};

export default AttendanceHeader;
