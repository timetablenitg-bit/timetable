import React, { useState, useRef, useEffect } from "react";
import { ArrowRightLeft } from "lucide-react";

// Single-select — case 3. Lets the admin mark which of the batch's
// already-assigned, non-backlog courses these backlog students will drop.
const DropCoursePicker = ({ candidates, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selected = candidates.find(
    (c) => c._id?.toString() === value?.toString(),
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={
          selected
            ? `Drops ${selected.course_code} for these students`
            : "Mark a current-sem course these backlog students will drop"
        }
        className={`p-1.5 rounded-lg transition-colors ${
          selected
            ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20"
            : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
      >
        <ArrowRightLeft size={14} />
      </button>

      {open && (
        <div className="absolute z-20 right-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 max-h-64 overflow-y-auto">
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 px-1 pb-1">
            Drop a current-sem course
          </p>
          <button
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={`w-full text-left px-2 py-1.5 rounded-md text-xs ${
              !value
                ? "bg-gray-100 dark:bg-gray-700 font-medium"
                : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            None
          </button>
          {candidates.length === 0 && (
            <p className="text-[11px] text-gray-400 px-2 py-1.5">
              No other courses assigned in this batch yet.
            </p>
          )}
          {candidates.map((c) => (
            <button
              key={c._id}
              onClick={() => {
                onChange(c._id);
                setOpen(false);
              }}
              className={`w-full text-left px-2 py-1.5 rounded-md text-xs ${
                value?.toString() === c._id?.toString()
                  ? "bg-amber-100 dark:bg-amber-900/30 font-medium"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <div className="font-medium text-gray-700 dark:text-gray-200">
                {c.course_code} — {c.course_name}
              </div>
              {c.faculty_name && (
                <div className="text-gray-400">{c.faculty_name}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropCoursePicker;
