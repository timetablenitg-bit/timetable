import React, { useState, useEffect } from "react";
import { useFacultyStore } from "../../store/useFacultyStore";
import { Calendar, Clock9, Plus, ChevronRight } from "lucide-react";
import CustomLoader from "../../ui/CustomLoader";

const Leave = () => {
  const [form, setForm] = useState({
    date: "",
    reason: "",
  });

  const {
    leaves,
    isLeavesLoading,
    isLeaveSubmitting,
    fetchLeaves,
    submitLeave,
  } = useFacultyStore();

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const isFormValid = form.date.trim() !== "" && form.reason.trim() !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || isLeaveSubmitting) return;

    const success = await submitLeave({
      date: form.date,
      reason: form.reason,
    });

    if (success) {
      setForm({ date: "", reason: "" });
    }
  };

  return (
    /* RESPONSIVE HEIGHT: 
       - Mobile: h-auto (natural growth)
       - Desktop: h-[800px] or h-screen (contained)
    */
    <div className="p-3 md:p-6 w-full h-auto lg:h-[750px] bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 flex flex-col overflow-hidden">
      {/* Header Section */}
      <div className="mb-6 flex gap-2 sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700/60 shrink-0 shadow-sm">
        <div className="w-fit p-2.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/30 text-white">
          <Calendar size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Leave Management</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            Apply for time off and track your requests.
          </p>
        </div>
      </div>

      {/* Main Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 mb-4">
        {/* LEFT - FORM (Sticky on mobile if needed, or just top) */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1e293b] p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col shrink-0 h-fit lg:h-full">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-4">
            <Plus className="text-blue-500" />
            New Request
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Date of Leave
              </label>
              <input
                type="date"
                value={form.date}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all dark:[color-scheme:dark]"
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Reason
              </label>
              <textarea
                placeholder="E.g., Doctor's appointment..."
                value={form.reason}
                rows={4}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={!isFormValid || isLeaveSubmitting}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-300 flex justify-center items-center space-x-2 ${
                isFormValid && !isLeaveSubmitting
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                  : "bg-slate-200 text-slate-400 dark:bg-slate-700 cursor-not-allowed"
              }`}
            >
              <span>
                {isLeaveSubmitting ? "Submitting..." : "Submit Request"}
              </span>
              {!isLeaveSubmitting && <ChevronRight size={16} />}
            </button>
          </form>
        </div>

        {/* RIGHT - HISTORY */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col h-[500px] lg:h-full min-h-0 overflow-hidden">
          <h3 className="gap-4 text-lg font-semibold mb-6 flex items-center shrink-0">
            <Clock9 className="text-blue-500" />
            Request History
          </h3>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
            {isLeavesLoading ? (
              <div className="flex justify-center items-center py-20">
                <CustomLoader />
              </div>
            ) : leaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4 text-slate-300">
                  <Clock9 size={32} />
                </div>
                <p className="text-base font-medium text-slate-600">
                  No requests yet
                </p>
              </div>
            ) : (
              leaves.map((leave) => (
                <div
                  key={leave.id || leave._id}
                  className="group flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/40 hover:border-blue-300 transition-all duration-200 gap-3"
                >
                  <div className="flex-1 min-w-0 pr-0 sm:pr-4">
                    <p className="font-semibold text-sm md:text-base leading-tight">
                      {leave.reason}
                    </p>
                    <div className="flex items-center text-[10px] md:text-xs text-slate-500 mt-2 space-x-1.5 font-medium uppercase tracking-wider">
                      <Calendar size={12} />
                      <span>{formatDate(leave.date)}</span>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold border shadow-sm w-fit ${
                      leave.status === "Approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50"
                        : leave.status === "Pending"
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50"
                          : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        leave.status === "Approved"
                          ? "bg-emerald-500"
                          : leave.status === "Pending"
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                    />
                    {leave.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leave;
