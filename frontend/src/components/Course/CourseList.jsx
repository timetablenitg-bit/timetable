import React, { useMemo } from "react";
import GenericFilter from "../../ui/GenericFilter";
import CourseCard from "../../ui/CourseCard";

const CourseList = ({ courses, onEdit, onDelete }) => {
  const uniqueBranches = useMemo(() => {
    const branches = [
      ...new Set(courses.map((course) => course.department).filter(Boolean)),
    ];
    return branches.sort().map((branch) => ({ label: branch, value: branch }));
  }, [courses]);

  const uniqueCourseTypes = useMemo(() => {
    return [
      ...new Set(courses.map((c) => c.course_type).filter(Boolean)),
    ].sort();
  }, [courses]);

  const uniqueCourseNatures = useMemo(() => {
    return [...new Set(courses.map((c) => c.nature).filter(Boolean))].sort();
  }, [courses]);

  const uniqueSemesters = useMemo(() => {
    return [
      ...new Set(courses.map((c) => c.semester_offered).filter(Boolean)),
    ].sort((a, b) => a - b);
  }, [courses]);

  const uniqueDepartments = useMemo(() => {
    return [
      ...new Set(courses.map((c) => c.department).filter(Boolean)),
    ].sort();
  }, [courses]);

  if (courses.length === 0) {
    return (
      <GenericFilter
        items={courses}
        filterConfig={[]}
        searchFields={["course_code", "course_name"]}
        quickFilters={[]}
        renderItem={(course) => (
          <CourseCard course={course} onEdit={onEdit} onDelete={onDelete} />
        )}
        title="Courses"
        searchPlaceholder="Search by course code or name..."
        emptyMessage="No courses found."
      />
    );
  }

  return (
    <GenericFilter
      items={courses}
      filterConfig={[
        {
          key: "course_type",
          label: "Course Type",
          type: "button",
          options: uniqueCourseTypes,
        },
        {
          key: "nature",
          label: "Course Nature",
          type: "button",
          options: uniqueCourseNatures,
        },
        {
          key: "semester_offered",
          label: "Semester",
          type: "button",
          options: uniqueSemesters,
        },
        {
          key: "department",
          label: "Department",
          type: "select",
          options: uniqueDepartments,
        },
      ]}
      searchFields={["course_code", "course_name"]}
      quickFilters={uniqueBranches}
      quickFilterKey="department"
      renderItem={(course) => (
        <CourseCard course={course} onEdit={onEdit} onDelete={onDelete} />
      )}
      title="Courses"
      searchPlaceholder="Search by course code or name..."
      emptyMessage="No courses found matching your criteria."
    />
  );
};

export default CourseList;
