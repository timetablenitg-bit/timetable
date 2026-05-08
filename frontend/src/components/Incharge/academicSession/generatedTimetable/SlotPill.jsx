// SlotPill.jsx
import React from "react";
import { Lock } from "lucide-react";
import { slotColor } from "./colors";

const SlotPill = ({ name, subLabel, isLocked, editMode, isDragOver }) => {
  if (!name) {
    return (
      <div className="text-center py-2">
        <span className="text-[10px] text-gray-200 dark:text-gray-700">—</span>
      </div>
    );
  }

  if (name === "BREAK") {
    return (
      <div className="text-center py-2">
        <span className="text-[9px] text-gray-300 dark:text-gray-600 italic">
          lunch
        </span>
      </div>
    );
  }

  const color = slotColor(name);

  return (
    <div
      className={[
        "rounded-md border px-1.5 py-1.5 text-center relative select-none transition-all",
        color,
        editMode ? "cursor-grab hover:opacity-90" : "",
        isDragOver ? "ring-2 ring-indigo-400 ring-offset-1" : "",
      ].join(" ")}
    >
      <p className="text-[11px] font-bold leading-none">{name}</p>
      {subLabel && (
        <p className="text-[9px] mt-0.5 opacity-65 leading-none">{subLabel}</p>
      )}
      {isLocked && (
        <span className="absolute top-0.5 right-0.5">
          <Lock size={7} className="text-amber-500" />
        </span>
      )}
    </div>
  );
};

export default SlotPill;
