import React, { useState } from "react";
import {
  BookOpen,
  CheckSquare,
  CalendarRange,
  ChevronLeft,
} from "lucide-react";
import CourseAssignmentTab from "./CourseAssignmentTab";
import FinalizedAssignmentTab from "./FinalizedAssignmentTab";
import GeneratedTimetableTab from "./GeneratedTimetableTab";

const TABS = [
  { key: "assignments", label: "Course Assignments", icon: BookOpen },
  { key: "finalized", label: "Finalized Assignments", icon: CheckSquare },
  { key: "timetable", label: "Generated Timetable", icon: CalendarRange },
];

const AcademicSession = ({ session, onBack }) => {
  const [activeTab, setActiveTab] = useState("assignments");

  if (!session) {
    return (
      <div className="flex items-center justify-center w-full py-24 text-gray-400 dark:text-gray-500 text-sm">
        No session selected.
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "assignments":
        return <CourseAssignmentTab session={session} />;
      case "finalized":
        return <FinalizedAssignmentTab session={session} />;
      case "timetable":
        return <GeneratedTimetableTab session={session} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-start gap-3 mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="mt-1 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {session.academic_year}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {session.term}
            <span className="ml-2">
              {session.isActive ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  Inactive
                </span>
              )}
            </span>
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-sm font-medium
              border-b-2 -mb-px transition-colors duration-150
              ${
                activeTab === key
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }
            `}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1">{renderTab()}</div>
    </div>
  );
};

export default AcademicSession;
