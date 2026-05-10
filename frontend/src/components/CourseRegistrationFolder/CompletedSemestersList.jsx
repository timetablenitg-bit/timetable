import React from "react";
import { CheckCircle } from "lucide-react";

const CompletedSemestersList = ({ semesters }) => {
  const getStatusBadge = (status, isActive) => {
    if (status === "completed") {
      return {
        text: "Registration Completed",
        icon: <CheckCircle size={14} />,
        color:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
      };
    } else if (status === "pending" && isActive) {
      return {
        text: "Registration Pending",
        icon: <Clock size={14} />,
        color:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
      };
    } else {
      return {
        text: "Not Available",
        icon: null,
        color:
          "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700",
      };
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-600" />
          Completed Semesters
        </h3>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {semesters.map((semester) => {
          const status = getStatusBadge(
            semester.registration_status,
            semester.is_active,
          );
          return (
            <div
              key={semester._id}
              className="p-4 sm:px-5 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                      Semester {semester.semester_name}
                    </h4>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${status.color}`}
                    >
                      {status.icon}
                      {status.text}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {semester.batch_name}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      Academic Year: {semester.academic_year}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Total Credits: {semester.total_credits}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Courses: {semester.courses_registered}
                    </span>
                    {semester.registration_completed_date && (
                      <span className="text-gray-500 dark:text-gray-400">
                        Completed: {semester.registration_completed_date}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="inline-flex px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      ✓ Registration Done
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompletedSemestersList;
