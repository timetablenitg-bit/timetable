import React, { useEffect, useState } from "react";
import { Star, Bug, Lightbulb, MessageSquare, Trash2 } from "lucide-react";
import { useFeedbackStore } from "../../store/useFeedbackStore";

const TYPE_META = {
  bug: { label: "Bug", icon: Bug, color: "text-red-500" },
  suggestion: {
    label: "Suggestion",
    icon: Lightbulb,
    color: "text-yellow-500",
  },
  general: { label: "General", icon: MessageSquare, color: "text-blue-500" },
};

const STATUS_STYLES = {
  open: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  reviewed:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  resolved:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const FeedbackList = () => {
  const {
    allFeedback,
    isLoading,
    fetchAllFeedback,
    updateFeedbackStatus,
    deleteFeedback,
  } = useFeedbackStore();

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    const filters = {};
    if (statusFilter) filters.status = statusFilter;
    if (typeFilter) filters.type = typeFilter;
    fetchAllFeedback(filters);
  }, [statusFilter, typeFilter, fetchAllFeedback]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Student Feedback
        </h2>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="">All Types</option>
            <option value="bug">Bug</option>
            <option value="suggestion">Suggestion</option>
            <option value="general">General</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {allFeedback.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No feedback yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {allFeedback.map((f) => {
            const meta = TYPE_META[f.type] || TYPE_META.general;
            const Icon = meta.icon;
            return (
              <div
                key={f._id}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={meta.color} />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {meta.label}
                    </span>
                    {f.rating ? (
                      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 ml-2">
                        <Star
                          size={12}
                          className="fill-yellow-400 text-yellow-400"
                        />
                        {f.rating}/5
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={f.status}
                      onChange={(e) =>
                        updateFeedbackStatus(f._id, e.target.value)
                      }
                      className={`text-xs font-medium rounded-full px-2 py-1 border-none ${STATUS_STYLES[f.status]}`}
                    >
                      <option value="open">Open</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <button
                      onClick={() => deleteFeedback(f._id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-200 mt-2">
                  {f.message}
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-3">
                  <span>{f.student?.username || "Unknown student"}</span>
                  <span>•</span>
                  <span>{f.student?.email}</span>
                  <span>•</span>
                  <span>{new Date(f.createdAt).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FeedbackList;
