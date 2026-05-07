import React, { useState, useEffect, useMemo } from "react";
import CustomDropdown from "../../ui/CustomDropdown";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";

import { useFacultyStore } from "../../store/useFacultyStore";

import AttendanceHeader from "./AttendanceHeader";
import AttendanceModal from "./AttendanceModal";
import StatsCards from "./StatsCard";

const colors = {
  Present: "bg-emerald-500",
  Absent: "bg-rose-500",
  "Half Day": "bg-amber-500",
  Note: "bg-blue-500",
};

const Attendance = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // ✅ Date range state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { attendanceData, fetchAttendance, markAttendance } = useFacultyStore();

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthOptions = months.map((monthName, index) => ({
    label: monthName,
    value: index,
  }));

  const handleMonthChange = (value) => {
    setCurrentDate(new Date(year, parseInt(value), 1));
  };

  const daysArray = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const arr = [];

    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let i = 1; i <= totalDays; i++) arr.push(i);

    return arr;
  }, [year, month]);

  const formatDate = (day) => `${year}-${month + 1}-${day}`;

  const handleSave = async (date, status) => {
    const success = await markAttendance(date, status);
    if (success) setSelectedDate(null);
  };

  const currentMonthName = months[month];
  const generatePDF = async (useRange = false) => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    // -------------------------
    // 🎨 HEADER
    // -------------------------
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("ATTENDANCE REPORT", 14, 18);

    doc.setFontSize(10);

    let subtitle = "";
    if (fromDate && toDate) {
      subtitle = `From: ${fromDate}  To: ${toDate}`;
    } else {
      subtitle = `${months[month]} ${year}`;
    }

    doc.text(subtitle, 14, 25);

    // -------------------------
    // 📊 FILTER DATA
    // -------------------------
    const rows = [];

   Object.keys(attendanceData).forEach((key) => {
     const dateObj = new Date(key);

     let isInRange = false;

     if (useRange) {
       const from = new Date(fromDate);
       const to = new Date(toDate);
       isInRange = dateObj >= from && dateObj <= to;
     } else {
       isInRange = key.startsWith(`${year}-${month + 1}`);
     }

     if (isInRange) {
       rows.push([key, attendanceData[key]]);
     }
   });
    // -------------------------
    // 📈 SUMMARY
    // -------------------------
    const present = rows.filter((r) => r[1] === "Present").length;
    const absent = rows.filter((r) => r[1] === "Absent").length;
    const half = rows.filter((r) => r[1] === "Half Day").length;

    const total = present + absent + half;
    const percent = total ? Math.round((present / total) * 100) : 0;

    // -------------------------
    // 🧾 SUMMARY BOXES
    // -------------------------
    let startY = 40;

    const drawBox = (x, label, value, color) => {
      doc.setFillColor(...color);
      doc.roundedRect(x, startY, 40, 20, 3, 3, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(label, x + 5, startY + 7);

      doc.setFontSize(14);
      doc.text(String(value), x + 5, startY + 15);
    };

    drawBox(14, "Present", present, [46, 204, 113]);
    drawBox(60, "Absent", absent, [231, 76, 60]);
    drawBox(106, "Half Day", half, [241, 196, 15]);
    drawBox(152, "Attendance %", `${percent}%`, [52, 152, 219]);

    // -------------------------
    // 📊 CHART (Canvas → Image)
    // -------------------------
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 200;

    const ctx = canvas.getContext("2d");

    const { Chart } = await import("chart.js/auto");

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Present", "Absent", "Half Day"],
        datasets: [
          {
            data: [present, absent, half],
            backgroundColor: ["#2ecc71", "#e74c3c", "#f1c40f"],
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        responsive: false,
      },
    });

    await new Promise((res) => setTimeout(res, 500));

    const chartImage = canvas.toDataURL("image/png");

    doc.addImage(chartImage, "PNG", 14, startY + 30, 180, 60);

    // -------------------------
    // 📋 TABLE
    // -------------------------
    autoTable(doc, {
      startY: startY + 100,
      head: [["Date", "Status"]],
      body: rows,
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // -------------------------
    // 📅 FOOTER
    // -------------------------
    const pageHeight = doc.internal.pageSize.height;

    doc.setFontSize(9);
    doc.setTextColor(100);

    doc.text(
      `Generated on ${new Date().toLocaleString()}`,
      14,
      pageHeight - 10,
    );

    doc.text("Smart Attendance System", 150, pageHeight - 10);

    // -------------------------
    // 💾 FILE NAME
    // -------------------------
    const fileName = `Attendance_${fromDate || months[month]}_${year}.pdf`;

    doc.save(fileName);
  };
  const handleMonthlyDownload = () => {
    generatePDF(false); // monthly
  };

  const handleRangeDownload = () => {
    if (!fromDate || !toDate) {
      alert("Please select both From and To dates");
      return;
    }

    generatePDF(true); // range
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-white dark:bg-slate-900 transition-colors duration-500">
      <AttendanceHeader
        onDownloadMonthly={handleMonthlyDownload}
        onDownloadRange={handleRangeDownload}
      />

      <div className="flex flex-col xl:flex-row gap-6 w-full items-start">
        {/* --- CALENDAR --- */}
        <div className="flex-1 w-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <CalendarIcon size={20} className="text-blue-600" />

              <div className="w-30 sm:w-48">
                <CustomDropdown
                  label="Month"
                  options={monthOptions}
                  value={currentMonthName}
                  onChange={handleMonthChange}
                />
              </div>

              <span className="text-lg font-bold text-slate-400">{year}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1))}
                className="p-2 border rounded-xl dark:border-slate-700 hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-all cursor-pointer dark:bg-gray-300 hover:text-black"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={() => setCurrentDate(new Date(year, month + 1))}
                className="p-2 border rounded-xl dark:border-slate-700 hover:bg-blue-500/90 dark:hover:bg-blue-500 transition-all cursor-pointer dark:bg-gray-300 hover:text-black"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-4 text-center text-[10px] font-black uppercase text-slate-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            <AnimatePresence mode="wait">
              <motion.div key={month} className="contents">
                {daysArray.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} />;

                  const key = formatDate(day);
                  const status = attendanceData[key];

                  return (
                    <motion.div
                      key={key}
                      onClick={() => setSelectedDate(key)}
                      className={`h-12 sm:h-16 flex items-center justify-center rounded-xl cursor-pointer text-sm font-bold border ${
                        status
                          ? `${colors[status]} text-white border-transparent`
                          : "bg-slate-50 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-300 hover:border-blue-400"
                      }`}
                    >
                      {day}
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* --- STATS SECTION --- */}
        <div className="w-full xl:w-[450px] flex flex-col gap-4">
          {/* ✅ DATE RANGE PICKER (responsive, minimal UI addition) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase">
              Select Date Range
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                className="text-[10px] mt-2 text-blue-500 font-bold"
              >
                Reset to Monthly
              </button>
            )}
          </div>

          {/* ✅ STATS COMPONENT (your original UI inside it) */}
          <StatsCards
            attendanceData={attendanceData}
            year={year}
            month={month}
            fromDate={fromDate}
            toDate={toDate}
          />
        </div>
      </div>

      <AttendanceModal
        selectedDate={selectedDate}
        onClose={() => setSelectedDate(null)}
        onSave={handleSave}
      />
    </div>
  );
};

export default Attendance;
