import React, { useState, useRef, useEffect } from "react";
import { SplitSquareHorizontal } from "lucide-react";

// Multi-select — case 4. Links this backlog row to other backlog rows
// (any batch) that should share the same timeslot because their student
// sets are disjoint.
const ParallelWithPicker = ({ candidates, value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const valueIds = (value ?? []).map((v) => (v?._id ?? v)?.toString());

  const toggle = (id) => {
    const idStr = id.toString();
    const next = valueIds.includes(idStr)
      ? valueIds.filter((x) => x !== idStr)
      : [...valueIds, idStr];
    onChange(next);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        title={
          disabled
            ? "Save this row first to link parallel backlog slots"
            : valueIds.length
              ? `Parallel with ${valueIds.length} other backlog slot(s)`
              : "Run this backlog slot in parallel with another (disjoint students)"
        }
        className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
          valueIds.length
            ? "text-sky-600 bg-sky-50 dark:bg-sky-900/20"
            : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
      >
        <SplitSquareHorizontal size={14} />
      </button>

      {open && (
        <div className="absolute z-20 right-0 mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 max-h-64 overflow-y-auto">
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 px-1 pb-1">
            Run in parallel with (disjoint student sets)
          </p>
          {candidates.length === 0 && (
            <p className="text-[11px] text-gray-400 px-2 py-1.5">
              No other backlog slots yet.
            </p>
          )}
          {candidates.map((c) => (
            <label
              key={c._id}
              className="flex items-start gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
            >
              <input
                type="checkbox"
                className="mt-0.5"
                checked={valueIds.includes(c._id?.toString())}
                onChange={() => toggle(c._id)}
              />
              <div>
                <div className="font-medium text-gray-700 dark:text-gray-200">
                  {c.course_code} — {c.course_name}
                </div>
                <div className="text-gray-400">
                  {c.batch_name}
                  {c.faculty_name ? ` · ${c.faculty_name}` : ""}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParallelWithPicker;
