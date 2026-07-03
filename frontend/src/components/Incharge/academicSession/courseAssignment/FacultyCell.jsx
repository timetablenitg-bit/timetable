import React, { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import FacultySearch from "./FacultySearch";

// Collapsed: shows the faculty's full name as a chip (falls back to the
// code if a name isn't available). Click (or the pencil) reopens the full
// FacultySearch to change it.
const FacultyCell = ({ faculties, allFaculties, value, onChange }) => {
  const [editing, setEditing] = useState(!value); // auto-open if nothing picked yet
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!editing) return;
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setEditing(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [editing]);

  if (!editing && value) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        title={value.name}
        className="group flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors w-full"
      >
        <span className="truncate">
          {value.name ?? value.faculty_code ?? "—"}
        </span>
        <Pencil
          size={11}
          className="ml-auto text-gray-300 group-hover:text-emerald-500 shrink-0"
        />
      </button>
    );
  }

  return (
    <div ref={wrapRef}>
      <FacultySearch
        faculties={faculties}
        allFaculties={allFaculties}
        value={value}
        onChange={(f) => {
          onChange(f);
          setEditing(false);
        }}
      />
    </div>
  );
};

export default FacultyCell;
