import React, { useEffect, useRef, useState } from "react";
import { Search, Sparkles, X } from "lucide-react";
import DropdownPortal from "./DropdownPortal";

const ElectivePicker = ({
  allCourses = [],
  batchDepartment,
  value,
  onChange,
  slotName,
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const wrapperRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setQuery(value ? `${value.course_code} – ${value.course_name}` : "");
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      const inWrapper = wrapperRef.current?.contains(e.target);
      const inDropdown = dropdownRef.current?.contains(e.target);
      if (!inWrapper && !inDropdown) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const electivePool = allCourses.filter(
    (c) => c.nature === "ELECTIVE" && !c.is_elective_slot,
  );
  const pool = showAll
    ? electivePool
    : electivePool.filter((c) => c.department === batchDepartment);
  const filtered = pool
    .filter(
      (c) =>
        c.course_name.toLowerCase().includes(query.toLowerCase()) ||
        c.course_code.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 10);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Sparkles size={11} className="text-violet-400" />
        <span className="text-[10px] font-semibold text-violet-500 dark:text-violet-400 uppercase tracking-wide">
          {slotName}
        </span>
      </div>

      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all w-full
          ${
            open
              ? "border-violet-400 ring-2 ring-violet-100 dark:ring-violet-900/30"
              : "border-violet-200 dark:border-violet-800/50 hover:border-violet-300"
          } bg-violet-50/40 dark:bg-violet-900/10`}
      >
        <Search size={13} className="text-violet-400 flex-none" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Pick an elective…"
          className="bg-transparent outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder-violet-300 dark:placeholder-violet-600 text-sm min-w-0"
        />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setShowAll((p) => !p);
            setOpen(true);
          }}
          title={showAll ? "Showing all departments" : "Showing dept. only"}
          className={`flex-none text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
            showAll
              ? "bg-violet-200 dark:bg-violet-800/50 text-violet-700 dark:text-violet-300"
              : "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600"
          }`}
        >
          {showAll ? "ALL" : "DEPT"}
        </button>

        {value && (
          <X
            size={13}
            className="text-violet-400 hover:text-violet-600 cursor-pointer flex-none"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange(null);
              setQuery("");
              setOpen(false);
            }}
          />
        )}
      </div>

      <DropdownPortal
        anchorRef={wrapperRef}
        dropdownRef={dropdownRef}
        open={open}
        className="bg-white dark:bg-gray-800 border border-violet-200 dark:border-violet-800/50 rounded-xl shadow-xl max-h-64 overflow-y-auto"
      >
        {electivePool.length === 0 ? (
          <div className="px-4 py-4 text-xs text-gray-400 italic text-center">
            No elective courses found.
            <br />
            <span className="text-violet-400">
              Add elective courses first from the Courses tab.
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-3 text-xs text-gray-400 italic">
            No matches
            {!showAll && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setShowAll(true);
                }}
                className="ml-1 text-violet-500 underline"
              >
                search all departments?
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
              {showAll ? "All departments" : `${batchDepartment} electives`} ·{" "}
              {filtered.length} found
            </div>
            {filtered.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => {
                  onChange(c);
                  setQuery(`${c.course_code} – ${c.course_name}`);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {c.course_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {c.course_code} · {c.department} · {c.credits ?? "–"} cr ·{" "}
                  {c.lecture ?? 0}-{c.tutorial ?? 0}-{c.practical ?? 0}
                </p>
              </button>
            ))}
          </>
        )}
      </DropdownPortal>
    </div>
  );
};

export default ElectivePicker;
