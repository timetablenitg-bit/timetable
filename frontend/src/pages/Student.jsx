import React, { useState } from "react";
import Navbaar from "../components/Navbaar";
import TableModal from "../components/TableModal";
import { useAuthStore } from "../store/useAuthStore";
import NoticeBoard from "../components/Student/NoticeBoard";

import CourseRegistration from "../components/Student/CourseRegistration";

import {
  Menu,
  X,
  CalendarDays,
  MessageSquare,
  ClipboardCheck,
  Bell,
  FileText,
  GraduationCap,
  BookPlus,
  History,
} from "lucide-react";
import axiosInstance from "../lib/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const Student = () => {
  const { authUser } = useAuthStore();
  // console.log(authUser)

  const [openForm, setOpenForm] = useState(
    localStorage.getItem("needsProfileSetup"),
  );
  const [profileData, setProfileData] = useState({
    department: "",
    current_sem: "",
  });
  const [showWarning, setShowWarning] = useState(false);

  const handleClose = () => {
    if (!profileData.department || !profileData.current_sem) {
      setShowWarning(true);
    } else {
      setOpenForm(false);
    }
  };
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post(API_PATHS.AUTH.SETUP, profileData);
      if (res.data.success) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("needsProfileSetup", "false");
        setOpenForm(false);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const [openSidebar, setOpenSidebar] = useState(false);
  const [activeView, setActiveView] = useState("timetable"); // Default to timetable

  // 🔁 Render content dynamically
  const renderContent = () => {
    switch (activeView) {
      case "timetable":
        return <TableModal />;
      case "registration":
        return <CourseRegistration />;
      case "notices":
        return <NoticeBoard />;
      default:
        return <TableModal />;
    }
  };

  // 📋 Sidebar Menu Items mapped to components
  const menuItems = [
    { key: "timetable", label: "My Timetable", icon: CalendarDays },
    { key: "registration", label: "Course Registration", icon: BookPlus },
    { key: "notices", label: "Notice Board", icon: Bell },
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden">
      {/* Profile Setup form */}
      {openForm === "true" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Complete Your Profile
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Please fill in your details to continue to the dashboard.
            </p>
            {showWarning && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                <span className="font-semibold">⚠ Required:</span> Please select
                your department and semester before continuing.
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Department
                </label>
                <select
                  value={profileData.department}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      department: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MCE">MCE</option>
                  <option value="APS">APS</option>
                  <option value="HSS">HSS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Current Semester
                </label>
                <select
                  value={profileData.current_sem}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      current_sem: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!profileData.department || !profileData.current_sem}
                className={`w-full rounded-xl py-3 font-semibold text-white transition-colors ${
                  !profileData.department || !profileData.current_sem
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Save Profile
              </button>
            </form>
          </div>
        </div>
      )}
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
      <div className="flex flex-1 w-full overflow-hidden ">
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
              className="cursor-pointer text-slate-500 dark:text-slate-400"
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
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6 px-2">
            Student Portal
          </h2>

          {/* Menu */}
          <div className="flex flex-col gap-2 overflow-y-auto pb-4">
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
          <div className="mt-auto pt-6 text-xs text-slate-400 px-2 border-t border-slate-200 dark:border-slate-800">
            Student Dashboard v1.0
          </div>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900  shadow-md border border-slate-200 dark:border-slate-700 p-2 min-h-full flex flex-col">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* ================= FLOAT BUTTON ================= */}
      <button
        onClick={() => setOpenSidebar(true)}
        className="md:hidden fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 hover:scale-105 transition-all z-50"
      >
        <Menu size={24} />
      </button>
    </div>
  );
};

export default Student;
