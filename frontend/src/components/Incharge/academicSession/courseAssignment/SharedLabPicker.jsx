// SharedLabPicker.jsx — picks specific LAB ASSIGNMENTS (batch-specific lab
// sessions), not courses. Two different batches can run the exact same
// course (e.g. "Chemistry Lab" for 2ndSemSecA and 2ndSemSecB) as two
// different CourseAssignment docs, and those are what actually need linking
// — a course id alone can't tell SecA's session apart from SecB's.
// Batch name is shown as the primary/bold line in every option since it's
// often the only thing that visually distinguishes two otherwise-identical
// entries.
import React, { useState } from "react";
import { FlaskConical, ChevronDown, Search } from "lucide-react";

const SharedLabPicker = ({
  labAssignmentPool,
  sharedLabWith,
  onChange,
  compact = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedIds = new Set(
    (sharedLabWith ?? []).map((id) => id?.toString()),
  );
  const count = selectedIds.size;

  const toggle = (assignmentId) => {
    const idStr = assignmentId.toString();
    const next = selectedIds.has(idStr)
      ? (sharedLabWith ?? []).filter((id) => id?.toString() !== idStr)
      : [...(sharedLabWith ?? []), assignmentId];
    onChange(next);
  };

  const closeAndReset = () => {
    setOpen(false);
    setSearch("");
  };

  const filteredPool = labAssignmentPool
    .filter((a) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        a.course_code?.toLowerCase().includes(q) ||
        a.course_name?.toLowerCase().includes(q) ||
        a.batch_name?.toLowerCase().includes(q) ||
        a.faculty_name?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const aSelected = selectedIds.has(a._id?.toString());
      const bSelected = selectedIds.has(b._id?.toString());
      return aSelected === bSelected ? 0 : aSelected ? -1 : 1;
    });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Shared lab room"
        className={
          compact
            ? `relative flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
                count
                  ? "border-amber-300 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400"
                  : "border-gray-200 dark:border-gray-600 text-gray-400 hover:text-amber-500 hover:border-amber-300"
              }`
            : `flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors w-full justify-between ${
                count
                  ? "border-amber-300 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400"
                  : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400"
              }`
        }
      >
        {compact ? (
          <>
            <FlaskConical size={14} />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[9px] font-semibold flex items-center justify-center bg-amber-500 text-white rounded-full">
                {count}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5 truncate">
              <FlaskConical size={13} />
              {count ? `${count} room-shared` : "Lab room"}
            </span>
            <ChevronDown size={12} />
          </>
        )}
      </button>

      {open && (
        <div className="absolute z-20 right-0 mt-1 w-72 max-h-72 overflow-hidden flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
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
                placeholder="Search batch or course…"
                className="w-full pl-6 pr-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-amber-400 text-gray-700 dark:text-gray-200"
              />
            </div>
          </div>

          <div className="overflow-y-auto p-2 space-y-1">
            {labAssignmentPool.length === 0 ? (
              <p className="text-xs text-gray-400 px-2 py-1">
                No other saved lab sessions available yet.
              </p>
            ) : filteredPool.length === 0 ? (
              <p className="text-xs text-gray-400 px-2 py-1">
                No sessions match "{search}".
              </p>
            ) : (
              filteredPool.map((a) => (
                <label
                  key={a._id}
                  className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(a._id?.toString())}
                    onChange={() => toggle(a._id)}
                    className="w-3.5 h-3.5 mt-0.5 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span className="flex flex-col leading-tight">
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      {a.batch_name || "Unnamed batch"}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">
                      {a.course_code} — {a.course_name}
                      {a.faculty_name ? ` · ${a.faculty_name}` : ""}
                    </span>
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

export default SharedLabPicker;
