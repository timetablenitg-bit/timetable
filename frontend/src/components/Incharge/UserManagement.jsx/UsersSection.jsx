import React, { useEffect, useMemo, useState } from "react";
import {
  Users as UsersIcon,
  Trash2,
  Layers,
  Search,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import useAdminStore from "../../../store/admin";
import CustomLoader from "../../../ui/CustomLoader";

const ROLE_TABS = ["All", "student", "faculty", "admin"];

const UsersSection = () => {
  const {
    users,
    batches,
    isLoading,
    fetchUsers,
    fetchBatches,
    deleteUser,
    deleteUsersByBatch,
    deleteBatchFromBackend,
  } = useAdminStore();

  const [roleFilter, setRoleFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [search, setSearch] = useState("");
  // NEW: track which batch groups are collapsed, keyed by "department::sem"
  const [collapsedGroups, setCollapsedGroups] = useState({});

  useEffect(() => {
    fetchUsers();
    fetchBatches();
  }, [fetchUsers, fetchBatches]);

  const departments = useMemo(() => {
    const set = new Set(users.map((u) => u.department).filter(Boolean));
    return ["All", ...set];
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === "All" || u.role === roleFilter;
      const matchesDept = deptFilter === "All" || u.department === deptFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);
      return matchesRole && matchesDept && matchesSearch;
    });
  }, [users, roleFilter, deptFilter, search]);

  const { batchGroups, nonStudents } = useMemo(() => {
    const groups = {};
    const rest = [];

    filteredUsers.forEach((u) => {
      if (u.role !== "student") {
        rest.push(u);
        return;
      }
      const key = `${u.department || "—"}::${u.current_sem ?? "—"}`;
      if (!groups[key]) {
        const batch = batches.find(
          (b) => b.department === u.department && b.semester === u.current_sem,
        );
        groups[key] = {
          key,
          department: u.department,
          current_sem: u.current_sem,
          batch,
          students: [],
        };
      }
      groups[key].students.push(u);
    });

    return {
      batchGroups: Object.values(groups).sort(
        (a, b) => (a.current_sem ?? 0) - (b.current_sem ?? 0),
      ),
      nonStudents: rest,
    };
  }, [filteredUsers, batches]);

  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => setCollapsedGroups({});
  const collapseAll = () => {
    const all = {};
    batchGroups.forEach((g) => {
      all[g.key] = true;
    });
    setCollapsedGroups(all);
  };

  const handleDeleteUser = async (user) => {
    if (
      !window.confirm(
        `Delete ${user.username || user.email}? This cannot be undone.`,
      )
    )
      return;
    await deleteUser(user._id);
  };

  const handleDeleteBatch = async (group) => {
    const label =
      group.batch?.batch_name ||
      `${group.department} · Sem ${group.current_sem}`;
    const confirmed = window.confirm(
      `This will permanently delete all ${group.students.length} student account(s) in "${label}"` +
        (group.batch ? " and remove the batch itself." : ".") +
        " This cannot be undone. Continue?",
    );
    if (!confirmed) return;

    const result = await deleteUsersByBatch(
      group.department,
      group.current_sem,
    );
    if (result.success && group.batch) {
      await deleteBatchFromBackend(group.batch._id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-[80vh] w-full items-center justify-center">
        <CustomLoader variant="blue" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-none space-y-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
            <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-linear-to-br from-blue-600 to-indigo-700 bg-clip-text text-transparent">
            User Management
          </h1>
        </div>

        <div className="relative w-full max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {ROLE_TABS.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
                  roleFilter === r
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {(roleFilter === "All" || roleFilter === "student") &&
            batchGroups.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={expandAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <Maximize2 size={13} />
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <Minimize2 size={13} />
                  Collapse All
                </button>
              </div>
            )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {departments.map((d) => (
            <button
              key={d}
              onClick={() => setDeptFilter(d)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                deptFilter === d
                  ? "bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-800"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-4">
        {(roleFilter === "All" || roleFilter === "student") &&
          batchGroups.map((group) => {
            const isCollapsed = !!collapsedGroups[group.key];
            return (
              <div
                key={group.key}
                className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-100 dark:bg-slate-800/60">
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight
                        size={16}
                        className="text-slate-400 shrink-0"
                      />
                    ) : (
                      <ChevronDown
                        size={16}
                        className="text-slate-400 shrink-0"
                      />
                    )}
                    <Layers size={16} className="text-indigo-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-white truncate">
                      {group.batch?.batch_name ||
                        `${group.department} · Semester ${group.current_sem}`}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                      ({group.students.length} student
                      {group.students.length === 1 ? "" : "s"})
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteBatch(group)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-rose-200 dark:border-rose-800 transition-colors shrink-0"
                  >
                    <Trash2 size={14} />
                    Delete Batch
                  </button>
                </div>

                {!isCollapsed && (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {group.students.map((u) => (
                      <div
                        key={u._id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 dark:text-white truncate">
                            {u.username}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {u.email}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors shrink-0"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        {roleFilter !== "student" && nonStudents.length > 0 && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800/60 font-semibold text-slate-800 dark:text-white">
              Faculty & Admins
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {nonStudents.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 dark:text-white truncate">
                      {u.username}{" "}
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize">
                        {u.role}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {u.email} {u.department ? `· ${u.department}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteUser(u)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors shrink-0"
                    title="Delete user"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {batchGroups.length === 0 && nonStudents.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20">
            <UsersIcon size={48} className="mb-4 opacity-20" />
            <p>No users match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersSection;
