import React from "react";
import EntitySearch from "./EntitySearch";

const CourseSearch = ({
  courses,
  allCourses = [],
  value,
  onChange,
  placeholder = "Search course...",
}) => (
  <EntitySearch
    pool={courses}
    allPool={allCourses}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    getKey={(c) => c._id}
    getQueryLabel={(c) => `${c.course_code} – ${c.course_name}`}
    matches={(c, query) =>
      c.course_name.toLowerCase().includes(query.toLowerCase()) ||
      c.course_code.toLowerCase().includes(query.toLowerCase())
    }
    emptyLabel="No courses found"
    maxResults={8}
    renderOption={(c) => (
      <>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
          {c.course_name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {c.course_code} · {c.course_type} · {c.credits} cr ·{" "}
          {c.semester_offered ? `Sem ${c.semester_offered}` : "Elective"} ·{" "}
          {c.department}
        </p>
      </>
    )}
  />
);

export default CourseSearch;
