import React, { useEffect, useState } from "react";
import {
  Search,
  X,
  ShieldPlus,
  ShieldMinus,
  Clock,
  Loader2,
  ShieldCheck,
  History,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import axiosInstance from "../../lib/axiosInstance"; // adjust to match your actual axios setup
import { API_PATHS } from "../../utils/apiPaths";

const actionLabels = {
  PROMOTE_TO_ADMIN: "Promoted to admin",
  DEMOTE_ADMIN: "Removed admin access",
  INVITE_FACULTY: "Invited faculty",
};

const Avatar = ({ name }) => (
  <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-base font-bold text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
    {name ? name.charAt(0).toUpperCase() : "?"}
  </div>
);

// setActiveView is passed down from Incharge.jsx so we can jump to the
// Faculty Directory tab when a search here comes up empty.
const AdminManagement = ({ setActiveView }) => {
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [promoteLoading, setPromoteLoading] = useState(null);
  const [demoteLoading, setDemoteLoading] = useState(null);

  const fetchAdmins = async () => {
    try {
      const { data } = await axiosInstance.get(API_PATHS.ADMIN.LIST_ADMINS);
      setAdmins(data.admins);
    } catch (err) {
      console.error("Failed to fetch admins", err);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const { data } = await axiosInstance.get(
          `${API_PATHS.ADMIN.SEARCH_FACULTY_FOR_ADMIN}?q=${encodeURIComponent(query)}`,
        );
        setResults(data.faculties);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelectAdmin = async (admin) => {
    setSelectedAdmin(admin);
    setLogsLoading(true);
    try {
      const { data } = await axiosInstance.get(
        API_PATHS.ADMIN.ADMIN_LOGS(admin._id),
      );
      setLogs(data.logs);
    } catch (err) {
      console.error("Failed to fetch logs", err);
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handlePromote = async (userId, e) => {
    e.stopPropagation();
    setPromoteLoading(userId);
    try {
      await axiosInstance.post(API_PATHS.ADMIN.PROMOTE_TO_ADMIN, { userId });
      setResults((prev) => prev.filter((f) => f._id !== userId));
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to promote");
    } finally {
      setPromoteLoading(null);
    }
  };

  const handleDemote = async (userId, e) => {
    e.stopPropagation();
    if (!window.confirm("Remove admin access for this user?")) return;
    setDemoteLoading(userId);
    try {
      await axiosInstance.post(API_PATHS.ADMIN.DEMOTE_ADMIN, { userId });
      if (selectedAdmin?._id === userId) {
        setSelectedAdmin(null);
        setLogs([]);
      }
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to demote");
    } finally {
      setDemoteLoading(null);
    }
  };

  const goToFacultyDirectory = () => {
    if (typeof setActiveView === "function") {
      setActiveView("faculty");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-full">
      {/* ================= LEFT: admins + promote search ================= */}
      <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-6 lg:overflow-y-auto lg:pr-1">
        {/* Current admins */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
            <ShieldCheck size={14} />
            Current Admins
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {admins.length}
            </span>
          </h2>

          <div className="space-y-2">
            {admins.map((admin) => (
              <div
                key={admin._id}
                onClick={() => handleSelectAdmin(admin)}
                className={`group flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 shadow-sm
                  ${
                    selectedAdmin?._id === admin._id
                      ? "bg-slate-900 border-slate-900 dark:bg-white dark:border-white"
                      : "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-slate-800"
                  }`}
              >
                <Avatar name={admin.username} />
                <div className="min-w-0 flex-1">
                  <h3
                    className={`font-bold text-sm truncate ${
                      selectedAdmin?._id === admin._id
                        ? "text-white dark:text-slate-900"
                        : "text-slate-800 dark:text-white"
                    }`}
                  >
                    {admin.username}
                  </h3>
                  <p
                    className={`text-xs truncate ${
                      selectedAdmin?._id === admin._id
                        ? "text-slate-300 dark:text-slate-500"
                        : "text-slate-400"
                    }`}
                  >
                    {admin.email}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDemote(admin._id, e)}
                  disabled={demoteLoading === admin._id}
                  className={`p-1.5 rounded-lg transition-colors shrink-0 disabled:opacity-50 ${
                    selectedAdmin?._id === admin._id
                      ? "text-rose-300 hover:text-rose-200 hover:bg-white/10 dark:text-rose-500 dark:hover:bg-black/5"
                      : "text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  }`}
                  title="Remove admin"
                >
                  {demoteLoading === admin._id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ShieldMinus size={16} />
                  )}
                </button>
              </div>
            ))}

            {admins.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-8 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <ShieldCheck size={28} className="mb-2 opacity-30" />
                <p className="text-sm font-medium">No admins yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Promote search */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Make Faculty Admin
          </h2>

          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search faculty by name or email..."
              className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
            {searching && (
              <div className="flex items-center gap-2 text-xs text-slate-400 px-1 py-2">
                <Loader2 size={14} className="animate-spin" />
                Searching...
              </div>
            )}

            {!searching &&
              results.map((f) => (
                <div
                  key={f._id}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-emerald-50/50 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm"
                >
                  <Avatar name={f.username} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate">
                      {f.username}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">{f.email}</p>
                  </div>
                  <button
                    onClick={(e) => handlePromote(f._id, e)}
                    disabled={promoteLoading === f._id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 transition-colors shrink-0 disabled:opacity-50"
                    title="Make admin"
                  >
                    {promoteLoading === f._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ShieldPlus size={16} />
                    )}
                  </button>
                </div>
              ))}

            {/* Empty search result — nudge toward Faculty Directory */}
            {!searching && query && results.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-8 px-4 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <Search size={28} className="mb-2 opacity-30" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  No matching faculty found
                </p>
                <p className="text-xs mt-1 mb-3 text-slate-400">
                  They may not be added yet, or don't have an email on file.
                </p>
                <button
                  onClick={goToFacultyDirectory}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                >
                  <UserPlus size={14} />
                  Add faculty in Directory
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= RIGHT: selected admin + log ================= */}
      <div className="flex-1 bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 overflow-y-auto">
        {!selectedAdmin ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
            <History size={40} className="mb-3 opacity-20" />
            <p className="text-base font-medium">No admin selected</p>
            <p className="text-sm mt-1">
              Pick an admin from the list to view their action log.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-700">
              <Avatar name={selectedAdmin.username} />
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate">
                  {selectedAdmin.username}
                </h2>
                <p className="text-sm text-slate-400 truncate">
                  {selectedAdmin.email}
                </p>
              </div>
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Clock size={14} />
              Action Log
            </h3>

            {logsLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
                <Loader2 size={16} className="animate-spin" />
                Loading...
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <Clock size={28} className="mb-2 opacity-30" />
                <p className="text-sm font-medium">No actions recorded yet</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {logs.map((log) => (
                  <li
                    key={log._id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-slate-800 dark:text-white">
                        {actionLabels[log.action] || log.action}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {log.target?.email && (
                      <div className="text-xs text-slate-400 mt-1">
                        Target: {log.target.username} ({log.target.email})
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagement;
