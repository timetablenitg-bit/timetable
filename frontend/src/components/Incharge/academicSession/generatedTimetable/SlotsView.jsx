// SlotsView.jsx
import React, { useMemo } from "react";
import { SLOT_COLORS } from "./colors";
import { describeCoLocation } from "./resolveCellEntries";

const SlotsView = ({ slotsData }) => {
  const { slots } = slotsData;
  const lectureSlots = slots.filter((s) => !s.slot_name.startsWith("LAB"));

  const allBatches = useMemo(() => {
    const seen = new Set();
    lectureSlots.forEach((sl) =>
      sl.entries.forEach((e) =>
        (e.batch_names ?? e.batches ?? []).forEach((b) => seen.add(b)),
      ),
    );
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [lectureSlots]);

  // Returns EVERY entry for this batch in this slot, not just the first —
  // a slot can legitimately hold more than one entry for the same batch
  // (drop_course_id / parallel_with co-location).
  const getEntryGroup = (slotName, batch) => {
    const sl = lectureSlots.find((s) => s.slot_name === slotName);
    return (
      sl?.entries.filter((e) =>
        (e.batch_names ?? e.batches ?? []).includes(batch),
      ) ?? []
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-10 w-32 border-b border-r border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
            >
              Batch
            </th>
            {lectureSlots.map((sl) => (
              <th
                key={sl.slot_name}
                scope="col"
                className="min-w-[104px] border-b border-l border-gray-200 bg-gray-50 px-3 py-2.5 text-center dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  {sl.slot_name}
                </div>
                <div className="mt-0.5 whitespace-nowrap text-[9px] font-normal leading-none text-gray-400 dark:text-gray-500">
                  {sl.entries[0]?.credits ??
                    sl.entries[0]?.sessions_per_week ??
                    1}
                  cr
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allBatches.map((batch, bi) => (
            <tr
              key={batch}
              className={
                bi % 2 === 1
                  ? "bg-gray-50/60 dark:bg-gray-900/40"
                  : "bg-white dark:bg-gray-950"
              }
            >
              <th
                scope="row"
                className="sticky left-0 z-10 border-r border-gray-200 bg-inherit px-4 py-2 text-left text-xs font-medium text-gray-700 dark:border-gray-800 dark:text-gray-300"
              >
                {batch}
              </th>
              {lectureSlots.map((sl) => {
                const entryGroup = getEntryGroup(sl.slot_name, batch);
                return (
                  <td
                    key={sl.slot_name}
                    className="border-l border-t border-gray-200 px-3 py-2 text-center align-middle dark:border-gray-800"
                  >
                    {entryGroup.length ? (
                      <div className="space-y-1">
                        {entryGroup.map((entry, i) => {
                          const coLoc = describeCoLocation(entry, entryGroup);
                          return (
                            <div
                              key={entry.assignment_id ?? i}
                              className={
                                i > 0
                                  ? "border-t border-dashed border-gray-200 dark:border-gray-700 pt-1"
                                  : ""
                              }
                            >
                              <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                                {entry.course_code ?? entry.course ?? "—"}
                              </p>
                              {(entry.faculty_code ?? entry.faculty) && (
                                <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                                  {entry.faculty_code ?? entry.faculty}
                                </p>
                              )}
                              {coLoc && (
                                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
                                  {coLoc.kind === "drop"
                                    ? "⇄ drop"
                                    : "∥ parallel"}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-gray-200 dark:text-gray-700">
                        –
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SlotsView;
