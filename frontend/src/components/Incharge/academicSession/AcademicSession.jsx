import React, { useState } from "react";
import {
  BookOpen,
  CheckSquare,
  CalendarRange,
  GraduationCap,
  Calendar,
  Layers,
  X,
} from "lucide-react";
import CourseAssignmentTab from "./CourseAssignmentTab";
import FinalizedAssignmentTab from "./FinalizedAssignmentTab";
import GeneratedTimetableTab from "./GeneratedTimetableTab";
import CourseRegistrationTab from "./CourseRegsitrationTab";

const TABS = [
  {
    key: "courseRegistration",
    label: "Course Registration",
    icon: GraduationCap,
  },
  { key: "assignments", label: "Course Assignments", icon: BookOpen },
  { key: "finalized", label: "Finalized Assignments", icon: CheckSquare },
  { key: "timetable", label: "Generated Timetable", icon: CalendarRange },
];

const AcademicSession = ({ session, onClose }) => {
  const [activeTab, setActiveTab] = useState("courseRegistration");
  const [savedAssignments, setSavedAssignments] = useState([]);

  if (!session) {
    return (
      <div className="flex items-center justify-center w-full py-24 text-gray-400 dark:text-gray-500 text-sm">
        No session selected.
      </div>
    );
  }

  const handleAssignmentsSaved = (assignments) => {
    setSavedAssignments(assignments);
  };

  const renderTab = () => {
    switch (activeTab) {
      case "courseRegistration":
        return <CourseRegistrationTab session={session} />;
      case "assignments":
        return (
          <CourseAssignmentTab
            session={session}
            onSave={handleAssignmentsSaved}
            onAssignmentsChange={setSavedAssignments}
          />
        );
      case "finalized":
        return <FinalizedAssignmentTab session={session} />;
      case "timetable":
        return <GeneratedTimetableTab session={session} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Fixed Header - always at top, never scrolls */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Header content */}
        <div className="px-4 sm:px-6 py-3 sm:py-2.5">
          <div className="flex items-center justify-between gap-3">
            {/* Left section with title and metadata */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Icon */}
              <div className="p-2 sm:p-1.5 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 flex-shrink-0">
                <GraduationCap
                  size={18}
                  className=" text-emerald-600 dark:text-emerald-400"
                />
              </div>

              {/* Title and metadata */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-emerald-700 to-emerald-500 dark:from-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent">
                    {session.academic_year || session.name}
                  </h1>

                  {/* Active Status Badge */}
                  <div className="flex-shrink-0">
                    <div
                      className={`
                      inline-flex items-center gap-1.5 px-2 py-0.5 sm:py-1 rounded-lg font-medium text-[10px] sm:text-[11px]
                      transition-all duration-200
                      ${
                        session.isActive || session.status === "Active"
                          ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                          : "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                      }
                    `}
                    >
                      <div
                        className={`
                        w-1.5 h-1.5 rounded-full animate-pulse
                        ${
                          session.isActive || session.status === "Active"
                            ? "bg-emerald-500"
                            : "bg-gray-400"
                        }
                      `}
                      />
                      <span className="font-semibold">
                        {session.isActive || session.status === "Active"
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar
                      size={12}
                      className="text-emerald-500 flex-shrink-0"
                    />
                    <span className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 font-medium">
                      {session.term || session.type}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
                  <div className="flex items-center gap-1">
                    <Layers
                      size={12}
                      className="text-emerald-500 flex-shrink-0"
                    />
                    <span className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300">
                      {session.type === "EVEN"
                        ? "Even Semester"
                        : "Odd Semester"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 flex-shrink-0"
                title="Close"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Tab Bar - Responsive: grid on mobile, flex on desktop */}
        <div className="px-0">
          {/* Mobile view - grid layout (3 equal columns) */}
          <div className="grid grid-cols-3 sm:hidden">
            {TABS.map(({ key, label, icon: Icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`
                    relative flex flex-col items-center justify-center gap-1
                    px-2 py-3 text-[10px] font-medium
                    transition-all duration-200
                    ${
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10"
                        : "text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }
                  `}
                >
                  <Icon size={16} />
                  <span>
                    {label === "Course Assignments"
                      ? "Assignments"
                      : label === "Finalized Assignments"
                        ? "Finalized"
                        : "Timetable"}
                  </span>

                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Desktop view - flex layout with proper spacing */}
          <div className="hidden sm:flex gap-1 px-4 sm:px-6">
            {TABS.map(({ key, label, icon: Icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`
                    group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                    transition-all duration-200 whitespace-nowrap
                    ${
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400"
                    }
                  `}
                >
                  <Icon size={16} />
                  <span>{label}</span>

                  {/* Active Tab Indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-400 rounded-full" />
                  )}

                  {/* Hover Indicator */}
                  {!isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-200 dark:bg-emerald-800/50 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 md:p-6 transition-all duration-300 animate-fadeIn">
          {renderTab()}
        </div>
      </div>
    </div>
  );
};

export default AcademicSession;
