import React, { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  CalendarDays,
  Table,
  Users,
  BookOpen,
  Layers,
  DoorOpen,
  ClipboardList,
  MessageSquare,
} from "lucide-react";

import Navbaar from "../components/Navbaar";
// 2️⃣ Removed the duplicate TableModal import
import TableModal from "../components/TableModal";
import AdminOverview from "../components/Incharge/AdminOverview";
import GenerateTable from "../components/Incharge/GenerateTable";
import FacultyDirectory from "../components/Incharge/FacultyDirectry";
import Course from "../components/Course/Course";
import Batch from "../components/Batch/Batch";
import Room from "../components/Room/Room";
import AcademicSession from "../components/Incharge/academicSession/AcademicSession";
import { useAuthStore } from "../store/useAuthStore";
import FeedbackList from "../components/Incharge/FeedbackList";

const Incharge = () => {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [selectedSession, setSelectedSession] = useState(null);
  const { authUser } = useAuthStore();

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return <AdminOverview />;
      case "generate":
        return (
          <GenerateTable
            setActiveView={setActiveView}
            setSelectedSession={setSelectedSession}
          />
        );
      case "timetable":
        return <TableModal />;
      case "faculty":
        return <FacultyDirectory />;
      case "course":
        return <Course />;
      case "batch":
        return <Batch />;
      case "room":
        return <Room />;
      case "feedback":
        return <FeedbackList />;
      case "academicSession":
        return (
          <AcademicSession
            session={selectedSession}
            onBack={() => setActiveView("generate")}
          />
        );
      default:
        return <AdminOverview />;
    }
  };

  // 🔁 Render content dynamically
  const menuItems = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "generate", label: "Generate Timetable", icon: CalendarDays },
    { key: "timetable", label: "Time Table", icon: Table },
    { key: "faculty", label: "Faculty Directory", icon: Users },
    { key: "course", label: "Course Management", icon: BookOpen },
    { key: "batch", label: "Batch Management", icon: Layers },
    { key: "feedback", label: "Student Feedback", icon: MessageSquare },
    { key: "room", label: "Room Management", icon: DoorOpen },
    { key: "request", label: "Pending Requests", icon: ClipboardList },
  ];

  return (
    <div className="h-screen flex flex-col  overflow-hidden">
      {/* Navbar */}
      <Navbaar />

      {/* Overlay (Mobile) */}
      {openSidebar && (
        <div
          onClick={() => setOpenSidebar(false)}
          className="fixed inset-0 bg-black/40 z-50 md:hidden"
        />
      )}

      {/* Layout */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* ================= SIDEBAR ================= */}
        <div
          className={`
            fixed md:static top-0 left-0 h-full w-64 
            bg-white dark:bg-slate-900
            border-r border-slate-200 dark:border-slate-800
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
              className="cursor-pointer text-slate-900 dark:text-white"
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
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
            Admin Panel
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
                    transition-all duration-200 cursor-pointer

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
            Admin Dashboard v1.0
          </div>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="flex-1 overflow-y-auto ">
          <div className="bg-white dark:bg-slate-900  shadow-md border border-slate-200 dark:border-slate-700 p-4 min-h-full flex">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* ================= FLOAT BUTTON ================= */}
      <button
        onClick={() => setOpenSidebar(true)}
        className="md:hidden fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-105 transition z-40"
      >
        <Menu size={24} />
      </button>
    </div>
  );
};

export default Incharge;
