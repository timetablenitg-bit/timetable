import React from "react";
import EntitySearch from "./EntitySearch";

const FacultySearch = ({
  faculties,
  allFaculties = [],
  value,
  onChange,
  placeholder = "Search faculty...",
}) => (
  <EntitySearch
    pool={faculties}
    allPool={allFaculties}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    getKey={(f) => f._id}
    getQueryLabel={(f) => f.name}
    matches={(f, query) =>
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.faculty_code.toLowerCase().includes(query.toLowerCase())
    }
    emptyLabel="No faculty found"
    maxResults={8}
    renderOption={(f) => (
      <>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
          {f.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {f.faculty_code} · {f.department} · {f.designation}
        </p>
      </>
    )}
  />
);

export default FacultySearch;
