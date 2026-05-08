// InstituteView.jsx
import React, { useState, useMemo } from "react";
import {
  DAYS,
  TIME_LABELS,
  LUNCH_PI,
  AM_LAB_BLOCK,
  PM_LAB_BLOCK,
  AFTER_LUNCH,
} from "./constants";
import { LAB_COLOR, slotColor } from "./colors";
import { getLabBlock } from "./helpers";

const InstituteView = ({ scheduleData, slotsData }) => {
  const [selectedDay, setSelectedDay] = useState("Monday");

  const slotMap = useMemo(() => {
    if (!slotsData?.slots) return {};
    return Object.fromEntries(
      slotsData.slots.map((s) => [s.slot_name, s.entries]),
    );
  }, [slotsData]);

  const allBatches = useMemo(() => {
    if (!slotsData?.slots) return [];
    const seen = new Set();
    slotsData.slots.forEach((sl) =>
      sl.entries.forEach((e) =>
        (e.batch_names ?? e.batches ?? []).forEach((b) => seen.add(b)),
      ),
    );
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [slotsData]);

  const track2Batches = new Set(scheduleData?.track2_batches ?? []);
  const dayGrid = scheduleData?.grid?.[selectedDay];

  const t1Cells = (dayGrid?.track1 ?? []).sort(
    (a, b) => a.period_index - b.period_index,
  );
  const t2Cells = (dayGrid?.track2 ?? []).sort(
    (a, b) => a.period_index - b.period_index,
  );
  const t1Map = Object.fromEntries(t1Cells.map((c) => [c.period_index, c]));
  const t2Map = Object.fromEntries(t2Cells.map((c) => [c.period_index, c]));

  const t1PmLab = getLabBlock(t1Cells, PM_LAB_BLOCK);
  const t2AmLab = getLabBlock(t2Cells, AM_LAB_BLOCK);
  const hasT2 = !!t2AmLab;

  const getEntryForBatchPeriod = (batch, cell) => {
    if (!cell?.slot_name || cell.slot_name === "BREAK") return null;
    const entries = slotMap[cell.slot_name] ?? [];
    return (
      entries.find((e) => (e.batch_names ?? e.batches ?? []).includes(batch)) ??
      null
    );
  };

  const getBatchSchedule = (batch) => {
    const isT2 = track2Batches.has(batch) && hasT2;
    const map = isT2 ? t2Map : t1Map;
    return Array.from({ length: 8 }, (_, i) => ({
      period_index: i,
      cell: map[i] ?? null,
      isT2,
    }));
  };

  return (
    <div className="space-y-4">
      {/* Day selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Day
        </span>
        <div className="flex gap-1 flex-wrap">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedDay === day
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {day.slice(0, 3)}
              {scheduleData?.grid?.[day]?.track2 ? (
                <span className="ml-1 text-[8px] text-purple-400">T2</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Track info for selected day */}
      {hasT2 && (
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300">
            Track 1: theory 9–13, {t1PmLab ? `${t1PmLab} lab 14–17` : "free PM"}
          </span>
          <span className="px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 text-purple-600 dark:text-purple-300">
            Track 2: {t2AmLab} lab 9–12, theory 14–17
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <table
          className="border-collapse"
          style={{ minWidth: 720, width: "100%" }}
        >
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/80">
              <th
                className="border border-gray-100 dark:border-gray-700 px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-800/80 z-10"
                style={{ minWidth: 130 }}
              >
                Batch
              </th>
              {TIME_LABELS.map((t, i) => (
                <th
                  key={i}
                  className={`border border-gray-100 dark:border-gray-700 px-1 py-2.5 text-center text-[9px] font-semibold whitespace-nowrap ${i === LUNCH_PI ? "text-gray-300 dark:text-gray-600" : "text-gray-400 dark:text-gray-500"}`}
                  style={{ minWidth: i === LUNCH_PI ? 48 : 72 }}
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allBatches.map((batch, bi) => {
              const isT2 = track2Batches.has(batch) && hasT2;
              const schedule = getBatchSchedule(batch);
              const batchPmLab = isT2 ? null : t1PmLab;
              const batchAmLab = isT2 ? t2AmLab : null;

              return (
                <tr
                  key={batch}
                  className={[
                    "transition-colors",
                    bi % 2 ? "bg-gray-50/30 dark:bg-gray-800/10" : "",
                    isT2 ? "bg-purple-50/20 dark:bg-purple-900/5" : "",
                    "hover:bg-gray-50/50 dark:hover:bg-gray-800/30",
                  ].join(" ")}
                >
                  {/* Batch label */}
                  <td className="border border-gray-100 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 z-10">
                    <div className="flex items-center gap-1.5">
                      {batch}
                      {isT2 && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">
                          T2
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Render each period */}
                  {schedule.map(({ period_index: pi, cell }) => {
                    // LUNCH
                    if (pi === LUNCH_PI) {
                      return (
                        <td
                          key={pi}
                          className="border border-gray-100 dark:border-gray-700 px-1 py-1 bg-gray-50/80 dark:bg-gray-800/60 text-center"
                        >
                          <span className="text-[9px] text-gray-300 dark:text-gray-600 italic">
                            —
                          </span>
                        </td>
                      );
                    }

                    // AM lab block for T2: colSpan=3 on period 0, skip 1 & 2
                    if (isT2 && batchAmLab) {
                      if (pi === AM_LAB_BLOCK[0]) {
                        return (
                          <td
                            key={pi}
                            colSpan={3}
                            className="border border-gray-100 dark:border-gray-700 px-1 py-1 align-middle"
                          >
                            <div
                              className={`rounded-md border px-2 py-1 text-center ${LAB_COLOR}`}
                            >
                              <p className="text-[11px] font-bold leading-none">
                                {batchAmLab}
                              </p>
                              <p className="text-[9px] mt-0.5 opacity-60 leading-none">
                                Lab (AM)
                              </p>
                            </div>
                          </td>
                        );
                      }
                      if (AM_LAB_BLOCK.slice(1).includes(pi)) return null;
                    }

                    // PM lab block for T1: colSpan=3 on period 5, skip 6 & 7
                    if (!isT2 && batchPmLab) {
                      if (pi === PM_LAB_BLOCK[0]) {
                        return (
                          <td
                            key={pi}
                            colSpan={3}
                            className="border border-gray-100 dark:border-gray-700 px-1 py-1 align-middle"
                          >
                            <div
                              className={`rounded-md border px-2 py-1 text-center ${LAB_COLOR}`}
                            >
                              <p className="text-[11px] font-bold leading-none">
                                {batchPmLab}
                              </p>
                              <p className="text-[9px] mt-0.5 opacity-60 leading-none">
                                Lab (PM)
                              </p>
                            </div>
                          </td>
                        );
                      }
                      if (PM_LAB_BLOCK.slice(1).includes(pi)) return null;
                    }

                    // Regular theory cell
                    const entry = getEntryForBatchPeriod(batch, cell);
                    const name = cell?.slot_name;

                    if (
                      !entry &&
                      (!name || name === "BREAK" || name === null)
                    ) {
                      return (
                        <td
                          key={pi}
                          className="border border-gray-100 dark:border-gray-700 px-1 py-1 text-center"
                        >
                          <span className="text-[10px] text-gray-200 dark:text-gray-700">
                            —
                          </span>
                        </td>
                      );
                    }

                    const code =
                      entry?.course_code ?? entry?.course ?? name ?? "—";
                    const fac = entry?.faculty_code ?? entry?.faculty ?? "";
                    const color = slotColor(name);

                    return (
                      <td
                        key={pi}
                        className="border border-gray-100 dark:border-gray-700 px-1 py-1"
                      >
                        <div
                          className={`rounded-md border px-1.5 py-1 text-center ${color}`}
                        >
                          <p className="text-[11px] font-bold leading-none">
                            {code}
                          </p>
                          {fac && (
                            <p className="text-[9px] mt-0.5 opacity-60 leading-none">
                              {fac}
                            </p>
                          )}
                          {name && !entry && (
                            <p className="text-[8px] mt-0.5 opacity-40 font-mono">
                              {name}
                            </p>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InstituteView;
