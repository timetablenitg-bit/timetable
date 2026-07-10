// LabMergedCell.jsx
import React from "react";
import { FlaskConical } from "lucide-react";

const LabMergedCell = () => {
  return (
    <td
      colSpan={3}
      rowSpan={1}
      className="border border-gray-100 dark:border-gray-800 px-1 py-1 align-middle"
    >
      <div className="rounded-md bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 h-full flex items-center justify-center gap-1.5 py-1.5">
        <FlaskConical
          size={13}
          className="text-indigo-400 dark:text-indigo-500"
        />
        <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-200">
          LAB
        </span>
      </div>
    </td>
  );
};

export default LabMergedCell;
