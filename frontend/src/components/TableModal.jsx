import React, { useState } from "react";
import Grid from "../ui/Grid";
import { Download, Pencil, Share2, Search, ChevronDown } from "lucide-react";
import { initialTimetableData, allSlots } from "../../public/js/data";

const TableModal = () => {
  const [weeklyData] = useState(initialTimetableData);
  const [availableDays] = useState(Object.keys(initialTimetableData));
  const [selectedDay, setSelectedDay] = useState(availableDays[0] || "Monday");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentDayData = weeklyData[selectedDay] || [];

  const isBreakSlot = (slot) => slot.includes("13:00");

  const getGridTemplateColumns = () => {
    const colDefinitions = allSlots.map((slot) => {
      if (isBreakSlot(slot)) return "minmax(50px, 70px)";
      return "minmax(100px, 1fr)";
    });
    return `minmax(120px, 140px) ${colDefinitions.join(" ")}`;
  };

  return (
    <div className="w-full mt-2 text-gray-700 dark:text-gray-200">
      {/* ================= BEAUTIFUL PAGE HEADER ================= */}
      <div className="flex items-center gap-4 mb-6 mt-2 px-1 sm:px-2">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-sm border border-indigo-200 dark:border-indigo-500/30 flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
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
          </svg>
        </div>
        <div>
          <h1 className="text-2xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Weekly Timetable
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            View and manage your daily class schedule
          </p>
        </div>
      </div>

      {/* Utility Bar */}
      <div className="flex items-center justify-between px-3 py-2 mb-2">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md
            bg-gray-100 dark:bg-gray-800/60
            border border-gray-200/60 dark:border-gray-700/40
            hover:bg-gray-200/60 dark:hover:bg-gray-700/40 transition"
          >
            {selectedDay}
            <ChevronDown size={14} />
          </button>

          {isDropdownOpen && (
            <div className="absolute mt-2 w-40 bg-gray-50 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/40 rounded-lg shadow-md z-50">
              {availableDays.map((day) => (
                <div
                  key={day}
                  onClick={() => {
                    setSelectedDay(day);
                    setIsDropdownOpen(false);
                  }}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-200/60 dark:hover:bg-gray-700/40"
                >
                  {day}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-1">
          {[Search, Download, Share2, Pencil].map((Icon, i) => (
            <button
              key={i}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/40 transition"
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* ================= MOBILE ================= */}
      <div className="md:hidden space-y-3">
        {currentDayData.map((row, index) => (
          <div
            key={index}
            className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200/60 dark:border-gray-700/40 rounded-xl p-3 shadow-sm"
          >
            <h2 className="text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
              {row.Group}
            </h2>

            <div className="flex flex-col gap-2">
              {allSlots.map((slot) => {
                if (isBreakSlot(slot)) {
                  return (
                    <div
                      key={slot}
                      className="text-center text-xs text-gray-400"
                    >
                      — Break —
                    </div>
                  );
                }

                const multiKey = Object.keys(row).find(
                  (k) => k.includes("-") && k.startsWith(slot.split("-")[0]),
                );

                let entry;

                if (multiKey) {
                  entry = row[multiKey];
                } else {
                  entry = row[slot];
                }

                if (!entry) return null;

                return (
                  <div
                    key={slot}
                    className="flex items-center justify-between gap-2 bg-gray-100/70 dark:bg-gray-800/50 p-2 rounded-md"
                  >
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-[80px]">
                      {slot}
                    </span>

                    <div className="flex-1">
                      <Grid data={entry} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ================= DESKTOP (UPGRADED) ================= */}
      <div className="hidden md:block">
        <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200/50 dark:border-gray-700/40 rounded-xl shadow-sm md:h-[60vh] overflow-hidden">
          <div className="overflow-auto h-full">
            <div
              className="grid min-w-[max-content]"
              style={{ gridTemplateColumns: getGridTemplateColumns() }}
            >
              {/* Corner */}
              <div className="sticky top-0 left-0 z-30 bg-gray-100 dark:bg-gray-800/80 backdrop-blur p-2 text-xs font-semibold border-b border-gray-200/40 dark:border-gray-700/40">
                Group / Time
              </div>

              {/* Headers */}
              {allSlots.map((slot) => (
                <div
                  key={slot}
                  className="sticky top-0 z-20 bg-gray-100/90 dark:bg-gray-800/70 backdrop-blur p-2 text-xs text-center font-medium border-b border-gray-200/40 dark:border-gray-700/40"
                >
                  {isBreakSlot(slot) ? "Break" : slot}
                </div>
              ))}

              {/* Rows */}
              {currentDayData.map((row, rowIndex) => {
                let skip = 0;

                return (
                  <React.Fragment key={rowIndex}>
                    {/* Row Header */}
                    <div className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-900/70 p-2 text-sm font-medium border-r border-gray-200/40 dark:border-gray-700/40">
                      {row.Group}
                    </div>

                    {allSlots.map((slot) => {
                      if (isBreakSlot(slot)) {
                        return <div key={slot}></div>;
                      }

                      if (skip > 0) {
                        skip--;
                        return null;
                      }

                      const multiKey = Object.keys(row).find(
                        (k) =>
                          k.includes("-") && k.startsWith(slot.split("-")[0]),
                      );

                      let entry;
                      let span = 1;

                      if (multiKey) {
                        entry = row[multiKey];
                        const [s, e] = multiKey
                          .split("-")
                          .map((t) => parseInt(t.split(":")[0]));
                        span = e - s;
                        skip = span - 1;
                      } else {
                        entry = row[slot];
                      }

                      return (
                        <div
                          key={slot}
                          className="p-1.5 transition-all duration-200 hover:bg-gray-100/60 dark:hover:bg-gray-700/30 rounded-md"
                          style={{ gridColumn: `span ${span}` }}
                        >
                          {entry && <Grid data={entry} />}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableModal;
