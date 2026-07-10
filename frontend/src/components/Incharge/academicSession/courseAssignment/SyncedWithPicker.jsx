// SyncedWithPicker.jsx — same search treatment
import React, { useState } from "react";
import { Link2, ChevronDown, Search } from "lucide-react";

const SyncedWithPicker = ({
  syncCandidates,
  syncedWith,
  onChange,
  disabled,
  compact = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedIds = new Set((syncedWith ?? []).map((id) => id?.toString()));
  const count = selectedIds.size;

  const toggle = (assignmentId) => {
    const idStr = assignmentId.toString();
    const next = selectedIds.has(idStr)
      ? (syncedWith ?? []).filter((id) => id?.toString() !== idStr)
      : [...(syncedWith ?? []), assignmentId];
    onChange(next);
  };

  const closeAndReset = () => {
    setOpen(false);
    setSearch("");
  };

  const filteredCandidates = syncCandidates
    .filter((a) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      const haystack = [
        a.label,
        a.course_code,
        a.course_name,
        a.course?.course_code,
        a.course?.course_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    })
    .sort((a, b) => {
      const aSelected = selectedIds.has(a._id?.toString());
      const bSelected = selectedIds.has(b._id?.toString());
      return aSelected === bSelected ? 0 : aSelected ? -1 : 1;
    });

  if (disabled) {
    return compact ? (
      <span
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-100 dark:border-gray-700 text-gray-300 dark:text-gray-600"
        title="Save this row first to enable slot sync"
      >
        <Link2 size={14} />
      </span>
    ) : (
      <span
        className="text-[11px] text-gray-400 italic"
        title="Save this row first to enable slot sync"
      >
        Save first
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Sync slot with other assignments"
        className={
          compact
            ? `relative flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                count
                  ? "border-sky-300 bg-sky-50 dark:bg-sky-900/10 text-sky-600 dark:text-sky-400"
                  : "border-gray-200 dark:border-gray-600 text-gray-400 hover:text-sky-500 hover:border-sky-300"
              }`
            : `flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors w-full justify-between ${
                count
                  ? "border-sky-300 bg-sky-50 dark:bg-sky-900/10 text-sky-700 dark:text-sky-400"
                  : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"
              }`
        }
      >
        {compact ? (
          <>
            <Link2 size={14} />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px] font-semibold flex items-center justify-center bg-sky-500 text-white rounded-full">
                {count}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5 truncate">
              <Link2 size={13} />
              {count ? `${count} synced` : "Sync slot"}
            </span>
            <ChevronDown size={12} />
          </>
        )}
      </button>

      {open && (
        <div className="absolute z-20 right-0 mt-1 w-64 max-h-72 overflow-hidden flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assignments…"
                className="w-full pl-6 pr-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-sky-400 text-gray-700 dark:text-gray-200"
              />
            </div>
          </div>

          <div className="overflow-y-auto p-2 space-y-1">
            {syncCandidates.length === 0 ? (
              <p className="text-xs text-gray-400 px-2 py-1">
                No other saved assignments to sync with yet.
              </p>
            ) : filteredCandidates.length === 0 ? (
              <p className="text-xs text-gray-400 px-2 py-1">
                No assignments match "{search}".
              </p>
            ) : (
              filteredCandidates.map((a) => (
                <label
                  key={a._id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(a._id?.toString())}
                    onChange={() => toggle(a._id)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-sky-500 focus:ring-sky-400"
                  />
                  <span className="text-gray-700 dark:text-gray-200 truncate">
                    {a.label}
                  </span>
                </label>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={closeAndReset}
            className="w-full text-center text-xs text-emerald-600 hover:text-emerald-700 py-1.5 border-t border-gray-100 dark:border-gray-700"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

export default SyncedWithPicker;
