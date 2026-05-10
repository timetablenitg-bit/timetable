import React from "react";
import { CalendarRange } from "lucide-react";

const GeneratedTimetableTab = ({ session }) => {
  // TODO: fetch and display the generated timetable for session._id

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
        <CalendarRange size={26} className="text-blue-500 dark:text-blue-400" />
      </div>
      <div>
        <p className="text-base font-medium text-gray-700 dark:text-gray-200">
          No timetable generated yet
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Finalize your assignments and generate a timetable from the{" "}
          <span className="font-medium">Finalized Assignments</span> tab.
        </p>
      </div>
    </div>
  );
};

export default GeneratedTimetableTab;
