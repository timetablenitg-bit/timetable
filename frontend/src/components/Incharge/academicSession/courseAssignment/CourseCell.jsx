import React from "react";
import CourseSearch from "./CourseSearch";
import ElectivePicker from "./ElectivePicker";

// Returns the right UI for the course cell based on row type:
//   1. isManual → CourseSearch (admin manually added this row)
//   2. is_elective_slot → ElectivePicker (slot name label + elective search)
//   3. normal course → static display
const CourseCell = ({ row, batch, batchCounts, courses, onChange }) => {
  if (row.isManual) {
    const deptCourses = courses.filter(
      (c) => c.department === batch.department,
    );
    return (
      <CourseSearch
        courses={deptCourses}
        allCourses={courses}
        value={row.course}
        onChange={(c) =>
          onChange({
            course: c ?? null,
            component_type: c?.course_type === "LAB" ? "lab" : "lecture",
            duration: c?.course_type === "LAB" ? 3 : 1,
          })
        }
      />
    );
  }

  if (row.course?.is_elective_slot) {
    return (
      <div className="space-y-1">
        <ElectivePicker
          allCourses={courses}
          batchDepartment={batch.department}
          value={row.elective_course}
          slotName={row.course.course_name} // e.g. "Elective III"
          onChange={(c) =>
            onChange({
              elective_course: c ?? null,
              // inherit component type from actual course if available
              component_type: c?.course_type === "LAB" ? "lab" : "lecture",
              duration: c?.course_type === "LAB" ? 3 : 1,
            })
          }
        />
        {row.elective_course && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 pl-1">
            {row.elective_course.credits ?? "–"} cr ·{" "}
            {row.elective_course.lecture ?? 0}-
            {row.elective_course.tutorial ?? 0}-
            {row.elective_course.practical ?? 0} ·{" "}
            {row.elective_course.department}
          </p>
        )}
      </div>
    );
  }

  // Normal static course display
  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
          {row.course?.course_name}
        </p>
        {row.course?._id && batchCounts[row.course._id.toString()] > 0 && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
            {batchCounts[row.course._id.toString()]}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        {row.course?.course_code} · {row.course?.course_type} ·{" "}
        {row.course?.credits} cr
      </p>
    </div>
  );
};

export default CourseCell;
