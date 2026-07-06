import React from "react";
import { useAuthStore } from "../../store/useAuthStore";

const StudentInfoCard = () => {
  const { authUser } = useAuthStore();

  const rollNumber = authUser.email?.split("@")[0]?.toUpperCase();

  const fields = [
    { label: "Roll Number", value: rollNumber },
    { label: "Department", value: authUser.department },
    { label: "Current Semester", value: authUser.current_sem },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-700">
        {fields.map((field) => (
          <div key={field.label} className="flex-1 px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
              {field.label}
            </p>
            <p className="text-base font-medium text-gray-800 dark:text-gray-100 truncate">
              {field.value ?? "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentInfoCard;
