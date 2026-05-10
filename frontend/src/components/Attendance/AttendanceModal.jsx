import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, FileText, X } from "lucide-react";

const statuses = [
  {
    id: "Present",
    label: "Present",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    darkBg: "dark:bg-emerald-500/10",
  },
  {
    id: "Absent",
    label: "Absent",
    icon: XCircle,
    color: "text-rose-500",
    bg: "bg-rose-50",
    darkBg: "dark:bg-rose-500/10",
  },
  {
    id: "Half Day",
    label: "Half Day",
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50",
    darkBg: "dark:bg-amber-500/10",
  },
  {
    id: "Note",
    label: "Add Note",
    icon: FileText,
    color: "text-blue-500",
    bg: "bg-blue-50",
    darkBg: "dark:bg-blue-500/10",
  },
];

const AttendanceModal = ({ selectedDate, onClose, onSave }) => {
  return (
    <AnimatePresence>
      {selectedDate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop with lighter blur for better performance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Compact Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-[300px] bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            {/* Header - Compact */}
            <div className="p-4 flex justify-between items-center border-b border-slate-50 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-none">
                  Mark Status
                </h3>
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-wider">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            {/* Status List - Tighter spacing */}
            <div className="p-3 space-y-2">
              {statuses.map((status, index) => (
                <motion.button
                  key={status.id}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => onSave(selectedDate, status.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-current transition-all group active:scale-[0.97] ${status.bg} ${status.darkBg} ${status.color}`}
                >
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                    <status.icon size={16} strokeWidth={2.5} />
                  </div>
                  <span className="font-bold text-xs tracking-tight text-slate-700 dark:text-slate-200">
                    {status.label}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Footer shadow/accent */}
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-slate-100 dark:via-slate-800 to-transparent" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AttendanceModal;
