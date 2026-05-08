// SlotsView.jsx
import React, { useMemo } from "react";
import { SLOT_COLORS } from "./colors";

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

  const getEntry = (slotName, batch) => {
    const sl = lectureSlots.find((s) => s.slot_name === slotName);
    return (
      sl?.entries.find((e) =>
        (e.batch_names ?? e.batches ?? []).includes(batch),
      ) ?? null
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <table
        className="border-collapse"
        style={{ minWidth: 640, width: "100%" }}
      >
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/80">
            <th
              className="border border-gray-100 dark:border-gray-700 px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-800/80 z-10"
              style={{ minWidth: 140 }}
            >
              Batch
            </th>
            {lectureSlots.map((sl) => (
              <th
                key={sl.slot_name}
                className="border border-gray-100 dark:border-gray-700 px-3 py-2.5 text-center"
                style={{ minWidth: 110 }}
              >
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border text-sm font-bold ${SLOT_COLORS[sl.slot_name] ?? SLOT_COLORS.A}`}
                >
                  {sl.slot_name}
                </span>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 font-normal">
                  {sl.entries[0]?.sessions_per_week ?? 1}×/wk
                </p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allBatches.map((batch, bi) => (
            <tr
              key={batch}
              className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${bi % 2 ? "bg-gray-50/30 dark:bg-gray-800/10" : ""}`}
            >
              <td className="border border-gray-100 dark:border-gray-700 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 z-10">
                {batch}
              </td>
              {lectureSlots.map((sl) => {
                const entry = getEntry(sl.slot_name, batch);
                if (!entry)
                  return (
                    <td
                      key={sl.slot_name}
                      className="border border-gray-100 dark:border-gray-700 px-3 py-2 text-center"
                    >
                      <span className="text-[10px] text-gray-200 dark:text-gray-700">
                        —
                      </span>
                    </td>
                  );
                const code = entry.course_code ?? entry.course ?? "—";
                const fac = entry.faculty_code ?? entry.faculty ?? "";
                const color = SLOT_COLORS[sl.slot_name] ?? SLOT_COLORS.A;
                return (
                  <td
                    key={sl.slot_name}
                    className="border border-gray-100 dark:border-gray-700 px-1.5 py-1.5"
                  >
                    <div
                      className={`rounded-md border px-2 py-1.5 text-center ${color}`}
                    >
                      <p className="text-[11px] font-bold leading-none">
                        {code}
                      </p>
                      {fac && (
                        <p className="text-[9px] mt-0.5 opacity-60 leading-none">
                          {fac}
                        </p>
                      )}
                    </div>
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
