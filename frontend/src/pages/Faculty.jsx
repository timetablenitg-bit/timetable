import React, { useState } from "react";
import Navbaar from "../components/Navbaar";
import TableModal from "../components/TableModal";
import FacultyTimeTableModal from "../components/Faculty/FacultyTimeTableModal";
import ContactAdmin from "../components/Faculty/ContactAdmin";
import Attendance from "../components/Attendance/Attendance";
import Leave from "../components/Faculty/Leave";
import Workload from "../components/Faculty/Workload";
import { useAuthStore } from "../store/useAuthStore";
import {
  Menu,
  X,
  CalendarDays,
  Table,
  MessageSquare,
  ClipboardCheck,
  Plane,
  BarChart3,
} from "lucide-react";

const Faculty = () => {
  const {authUser}=useAuthStore();

  const [openSidebar, setOpenSidebar] = useState(false);
  const [activeView, setActiveView] = useState("schedule");
  const renderContent = () => {
    switch (activeView) {
      case "schedule":
        return <FacultyTimeTableModal />;
      case "timetable":
        return <TableModal />;
      case "leave":
        return <Leave />;
      case "workload":
        return <Workload />;
      case "request":
        return <ContactAdmin />;
      default:
        return <div>Select something</div>;
    }
  };

  // 🔁 Render content dynamically
  const menuItems = [
    { key: "schedule", label: "Today's Schedule", icon: CalendarDays },
    { key: "timetable", label: "Time Table", icon: Table },
    // { key: "attendance", label: "Attendance", icon: ClipboardCheck },
    // { key: "leave", label: "Leave Request", icon: Plane },
    { key: "workload", label: "Workload", icon: BarChart3 },
    { key: "request", label: "Request Change", icon: MessageSquare },
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden">
      {/* Navbar */}
      <Navbaar />

      {/* Overlay (Mobile) */}
      {openSidebar && (
        <div
          onClick={() => setOpenSidebar(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* Layout */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* ================= SIDEBAR ================= */}
        <div
          className={`
            fixed md:static top-0 left-0 h-full w-64 
            bg-white dark:bg-slate-900
            border-r border-t border-slate-200 dark:border-slate-800
            z-50 transform transition-transform duration-300
            ${openSidebar ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0 flex flex-col
            px-4 py-5
          `}
        >
          {/* Close Button (Mobile) */}
          <div className="flex justify-end md:hidden mb-4">
            <X
              onClick={() => setOpenSidebar(false)}
              className="text-black dark:text-white cursor-pointer"
            />
          </div>

          {/* Title */}
          <h1
            className="text-lg text-blue-600 dark:text-blue-500 font-bold px-2"
            title={authUser.username}
          >
            {authUser.username.length > 16
              ? `${authUser.username.substring(0, 16)}...`
              : authUser.username}
          </h1>
          <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
            Faculty Panel
          </h2>

          {/* Menu */}
          <div className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveView(item.key);
                    setOpenSidebar(false);
                  }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-200

                    ${
                      activeView === item.key
                        ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }
                  `}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-auto pt-6 text-xs text-slate-400 px-2">
            Faculty Dashboard v1.0
          </div>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-700 p-4 min-h-full flex ">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* ================= FLOAT BUTTON ================= */}
      <button
        onClick={() => setOpenSidebar(true)}
        className="md:hidden fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-105 transition z-50"
      >
        <Menu size={24} />
      </button>
    </div>
  );
};

export default Faculty;
