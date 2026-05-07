import React from "react";
import { X } from "lucide-react";

const Notification = ({ open, setOpen }) => {
  return (
    <>
      {/* 🔲 Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black/40 z-60 transition-opacity duration-300 ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* 📦 RIGHT SIDE DRAWER */}
      <div
        className={`fixed top-0 right-0 h-full w-[85%] sm:w-96 
        bg-white dark:bg-slate-900 shadow-2xl z-61 
        transform transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Notifications
          </h2>

          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-60px)]">
          {/* Notification Item */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              New Course Assigned
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Data Structures assigned to you
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Timetable Updated
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your timetable has been updated
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Notification;
