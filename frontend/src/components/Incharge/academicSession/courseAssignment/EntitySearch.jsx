import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

// Generic "search + DEPT/ALL toggle + dropdown" picker.
// CourseSearch and FacultySearch are thin wrappers around this with
// entity-specific getKey/getQueryLabel/matches/renderOption functions.
const EntitySearch = ({
  pool, // department-scoped items
  allPool = [], // full unscoped items (for the ALL toggle)
  value,
  onChange,
  placeholder = "Search...",
  getKey,
  getQueryLabel,
  matches,
  renderOption,
  maxResults = 8,
  emptyLabel = "No results found",
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value ? getQueryLabel(value) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activePool = showAll ? allPool : pool;
  const filtered = activePool
    .filter((item) => matches(item, query))
    .slice(0, maxResults);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all w-full
          ${
            open
              ? "border-emerald-400 ring-2 ring-emerald-100 dark:ring-emerald-900/30"
              : "border-gray-200 dark:border-gray-600 hover:border-emerald-300"
          } bg-white dark:bg-gray-800`}
      >
        <Search size={14} className="text-gray-400 flex-none" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="bg-transparent outline-none flex-1 text-gray-700 dark:text-gray-200 placeholder-gray-400 min-w-0"
        />
        {allPool.length > 0 && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowAll((p) => !p);
              setOpen(true);
            }}
            title={showAll ? "Showing all" : "Showing dept. only"}
            className={`flex-none text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${
              showAll
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600"
            }`}
          >
            {showAll ? "ALL" : "DEPT"}
          </button>
        )}
        {value && (
          <X
            size={14}
            className="text-gray-400 hover:text-gray-600 cursor-pointer flex-none"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange(null);
              setQuery("");
              setOpen(false);
            }}
          />
        )}
      </div>

      {open && query.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-400 italic">
              {emptyLabel}
              {!showAll && allPool.length > 0 && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setShowAll(true);
                  }}
                  className="ml-1 text-emerald-500 underline"
                >
                  search all departments?
                </button>
              )}
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={getKey(item)}
                type="button"
                onClick={() => {
                  onChange(item);
                  setQuery(getQueryLabel(item));
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                {renderOption(item)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default EntitySearch;
