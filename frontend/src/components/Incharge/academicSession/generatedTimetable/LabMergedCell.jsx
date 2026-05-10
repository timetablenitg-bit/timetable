// LabMergedCell.jsx
import React, { useMemo } from "react";
import { FlaskConical } from "lucide-react";
import { LAB_COLOR } from "./colors";

const LabMergedCell = ({ labName, slotsData, subLabel }) => {
  const entries = useMemo(() => {
    if (!slotsData?.slots || !labName) return [];
    const slot = slotsData.slots.find((s) => s.slot_name === labName);
    return slot?.entries ?? [];
  }, [slotsData, labName]);

  const batchList = entries
    .flatMap((e) => e.batch_names ?? e.batches ?? [])
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(" / ");

  return (
    <td
      colSpan={3}
      rowSpan={1}
      className="border border-gray-100 dark:border-gray-700 px-1 py-1 align-middle"
    >
      <div
        className={`rounded-md border px-2 py-2 text-center h-full ${LAB_COLOR}`}
      >
        <FlaskConical size={10} className="mx-auto mb-0.5 opacity-60" />
        <p className="text-[11px] font-bold leading-none">{labName}</p>
        {batchList && (
          <p className="text-[9px] mt-0.5 opacity-65 leading-tight">
            {batchList}
          </p>
        )}
        {subLabel && (
          <p className="text-[9px] mt-0.5 opacity-50 leading-none">
            {subLabel}
          </p>
        )}
      </div>
    </td>
  );
};

export default LabMergedCell;
