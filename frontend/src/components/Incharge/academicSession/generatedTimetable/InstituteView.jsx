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

// ── FilterSelect ──────────────────────────────────────────────────────────────
const FilterSelect = ({ label, value, onChange, options, colorClass }) => {
  const activeColors = {
    emerald: "bg-emerald-600 text-white border-emerald-600",
    violet: "bg-violet-600 text-white border-violet-600",
  };
  const ringColors = {
    emerald: "focus:ring-emerald-500",
    violet: "focus:ring-violet-500",
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 dark:text-gray-500">
        {label}
      </span>
      {value ? (
        <span
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${activeColors[colorClass]}`}
        >
          {value}
          <button
            onClick={() => onChange("")}
            className="ml-0.5 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-[10px] font-bold leading-none transition-colors"
            aria-label={`Clear ${label} filter`}
          >
            ×
          </button>
        </span>
      ) : (
        <select
          value=""
          onChange={(e) => onChange(e.target.value)}
          className={`text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 ${ringColors[colorClass]} cursor-pointer`}
        >
          <option value="">All {label}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

// ── InstituteView ─────────────────────────────────────────────────────────────
const InstituteView = ({ scheduleData, slotsData }) => {
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [batchFilter, setBatchFilter] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");

  const isFiltered = !!(batchFilter || facultyFilter);

  // ── derived data ────────────────────────────────────────────────────────────
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

  const allFaculty = useMemo(() => {
    if (!slotsData?.slots) return [];
    const seen = new Set();
    slotsData.slots.forEach((sl) =>
      sl.entries.forEach((e) => {
        // Trim to avoid invisible-char mismatches on strict ===
        const f = (e.faculty_code ?? e.faculty)?.trim();
        if (f) seen.add(f);
      }),
    );
    return [...seen].sort();
  }, [slotsData]);

  // Key fix: normalise faculty codes when matching so whitespace/case can't break ===
  const normFaculty = (code) => (code ?? "").trim();

  const filteredBatches = useMemo(() => {
    let list = allBatches;

    if (batchFilter) {
      list = list.filter((b) => b === batchFilter);
    }

    if (facultyFilter) {
      list = list.filter((batch) =>
        slotsData?.slots?.some((sl) =>
          sl.entries.some(
            (e) =>
              (e.batch_names ?? e.batches ?? []).includes(batch) &&
              normFaculty(e.faculty_code ?? e.faculty) ===
                normFaculty(facultyFilter),
          ),
        ),
      );
    }

    return list;
  }, [allBatches, batchFilter, facultyFilter, slotsData]);

  const track2Batches = new Set(scheduleData?.track2_batches ?? []);

  // ── shared cell helpers ─────────────────────────────────────────────────────
  const getEntryForBatchPeriod = (batch, cell) => {
    if (!cell?.slot_name || cell.slot_name === "BREAK") return null;
    const entries = slotMap[cell.slot_name] ?? [];
    return (
      entries.find((e) => (e.batch_names ?? e.batches ?? []).includes(batch)) ??
      null
    );
  };

  const getLabEntry = (labSlotName, batch) => {
    const slot = slotsData?.slots?.find((s) => s.slot_name === labSlotName);
    return (
      slot?.entries?.find((e) =>
        (e.batch_names ?? e.batches ?? []).includes(batch),
      ) ?? null
    );
  };

  const emptyCell = (key) => (
    <td
      key={key}
      className="border border-gray-100 dark:border-gray-700 px-1 py-1 text-center"
    >
      <span className="text-[10px] text-gray-200 dark:text-gray-700">—</span>
    </td>
  );

  // ── per-day track info (used by filtered all-days view) ─────────────────────
  const getDayTrackInfo = (day, batch) => {
    const dayGrid = scheduleData?.grid?.[day];
    const t1Cells = (dayGrid?.track1 ?? []).sort(
      (a, b) => a.period_index - b.period_index,
    );
    const t2Cells = (dayGrid?.track2 ?? []).sort(
      (a, b) => a.period_index - b.period_index,
    );
    const t1Map = Object.fromEntries(t1Cells.map((c) => [c.period_index, c]));
    const t2Map = Object.fromEntries(t2Cells.map((c) => [c.period_index, c]));
    const t1PmLab = getLabBlock(t1Map, PM_LAB_BLOCK);
    const t2AmLab = getLabBlock(t2Map, AM_LAB_BLOCK);
    const isT2 = track2Batches.has(batch) && !!t2AmLab;
    return {
      map: isT2 ? t2Map : t1Map,
      isT2,
      batchPmLab: isT2 ? null : t1PmLab,
      batchAmLab: isT2 ? t2AmLab : null,
    };
  };

  // ── period cells renderer — shared by both normal and filtered views ─────────
  const renderPeriodCells = (batch, isT2, map, batchPmLab, batchAmLab) =>
    Array.from({ length: 8 }, (_, pi) => {
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

      // AM lab block (T2)
      if (isT2 && batchAmLab) {
        if (pi === AM_LAB_BLOCK[0]) {
          const labEntry = getLabEntry(batchAmLab, batch);
          if (!labEntry) {
            return (
              <td
                key={pi}
                colSpan={3}
                className="border border-gray-100 dark:border-gray-700 px-1 py-1 text-center"
              >
                <span className="text-[10px] text-gray-200 dark:text-gray-700">
                  —
                </span>
              </td>
            );
          }
          const code = labEntry.course_code ?? batchAmLab;
          const fac = labEntry.faculty_code ?? "";
          const isHighlighted =
            facultyFilter && normFaculty(fac) === normFaculty(facultyFilter);
          return (
            <td
              key={pi}
              colSpan={3}
              className="border border-gray-100 dark:border-gray-700 px-1 py-1 align-middle"
            >
              <div
                className={`rounded-md border px-2 py-1 text-center ${LAB_COLOR} ${isHighlighted ? "ring-2 ring-offset-1 ring-amber-400 dark:ring-amber-500" : ""}`}
              >
                <p className="text-[11px] font-bold leading-none">{code}</p>
                {fac && (
                  <p
                    className={`text-[9px] mt-0.5 leading-none ${isHighlighted ? "font-semibold opacity-90" : "opacity-60"}`}
                  >
                    {fac}
                  </p>
                )}
                <p className="text-[9px] mt-0.5 opacity-50 leading-none">
                  Lab (AM)
                </p>
              </div>
            </td>
          );
        }
        if (AM_LAB_BLOCK.slice(1).includes(pi)) return null;
      }

      // PM lab block (T1)
      if (!isT2 && batchPmLab) {
        if (pi === PM_LAB_BLOCK[0]) {
          const labEntry = getLabEntry(batchPmLab, batch);
          if (!labEntry) {
            return (
              <td
                key={pi}
                colSpan={3}
                className="border border-gray-100 dark:border-gray-700 px-1 py-1 text-center"
              >
                <span className="text-[10px] text-gray-200 dark:text-gray-700">
                  —
                </span>
              </td>
            );
          }
          const code = labEntry.course_code ?? batchPmLab;
          const fac = labEntry.faculty_code ?? "";
          const isHighlighted =
            facultyFilter && normFaculty(fac) === normFaculty(facultyFilter);
          return (
            <td
              key={pi}
              colSpan={3}
              className="border border-gray-100 dark:border-gray-700 px-1 py-1 align-middle"
            >
              <div
                className={`rounded-md border px-2 py-1 text-center ${LAB_COLOR} ${isHighlighted ? "ring-2 ring-offset-1 ring-amber-400 dark:ring-amber-500" : ""}`}
              >
                <p className="text-[11px] font-bold leading-none">{code}</p>
                {fac && (
                  <p
                    className={`text-[9px] mt-0.5 leading-none ${isHighlighted ? "font-semibold opacity-90" : "opacity-60"}`}
                  >
                    {fac}
                  </p>
                )}
                <p className="text-[9px] mt-0.5 opacity-50 leading-none">
                  Lab (PM)
                </p>
              </div>
            </td>
          );
        }
        if (PM_LAB_BLOCK.slice(1).includes(pi)) return null;
      }

      // Regular theory cell
      const cell = map[pi] ?? null;
      const entry = getEntryForBatchPeriod(batch, cell);
      const name = cell?.slot_name;
      const isHighlighted =
        facultyFilter &&
        entry &&
        normFaculty(entry.faculty_code ?? entry.faculty) ===
          normFaculty(facultyFilter);

      if (
        !entry &&
        (!name ||
          name === "BREAK" ||
          name === null ||
          cell?.slot_type === "free" ||
          cell?.slot_type === "lab")
      ) {
        return emptyCell(pi);
      }

      if (!entry) return emptyCell(pi);

      const code = entry.course_code ?? entry.course ?? "—";
      const fac = entry.faculty_code ?? entry.faculty ?? "";
      const color = slotColor(name);

      return (
        <td
          key={pi}
          className="border border-gray-100 dark:border-gray-700 px-1 py-1"
        >
          <div
            className={`rounded-md border px-1.5 py-1 text-center ${color} ${isHighlighted ? "ring-2 ring-offset-1 ring-amber-400 dark:ring-amber-500" : ""}`}
          >
            <p className="text-[11px] font-bold leading-none">{code}</p>
            {fac && (
              <p
                className={`text-[9px] mt-0.5 leading-none ${isHighlighted ? "font-semibold opacity-90" : "opacity-60"}`}
              >
                {fac}
              </p>
            )}
          </div>
        </td>
      );
    });

  // ── FILTERED VIEW — all 5 days stacked, no day toggle ──────────────────────
  const renderFilteredView = () => (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <table
        className="border-collapse"
        style={{ minWidth: 780, width: "100%" }}
      >
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/80">
            <th
              className="border border-gray-100 dark:border-gray-700 px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-800/80 z-10"
              style={{ minWidth: 120 }}
            >
              Batch
            </th>
            <th
              className="border border-gray-100 dark:border-gray-700 px-2 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400"
              style={{ minWidth: 44 }}
            >
              Day
            </th>
            {TIME_LABELS.map((t, i) => (
              <th
                key={i}
                className={`border border-gray-100 dark:border-gray-700 px-1 py-2.5 text-center text-[9px] font-semibold whitespace-nowrap ${
                  i === LUNCH_PI
                    ? "text-gray-300 dark:text-gray-600"
                    : "text-gray-400 dark:text-gray-500"
                }`}
                style={{ minWidth: i === LUNCH_PI ? 40 : 68 }}
              >
                {t}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filteredBatches.length === 0 ? (
            <tr>
              <td
                colSpan={TIME_LABELS.length + 2}
                className="py-12 text-center text-sm text-gray-400 dark:text-gray-600"
              >
                No batches match the selected filters.
              </td>
            </tr>
          ) : (
            filteredBatches.map((batch, bi) =>
              DAYS.map((day, di) => {
                const { map, isT2, batchPmLab, batchAmLab } = getDayTrackInfo(
                  day,
                  batch,
                );
                const isFirstDay = di === 0;

                return (
                  <tr
                    key={`${batch}-${day}`}
                    className={[
                      "transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/30",
                      isT2 ? "bg-purple-50/20 dark:bg-purple-900/5" : "",
                      bi % 2 && !isT2
                        ? "bg-gray-50/20 dark:bg-gray-800/10"
                        : "",
                    ].join(" ")}
                    style={
                      isFirstDay && bi > 0
                        ? { borderTop: "2px solid #e5e7eb" }
                        : undefined
                    }
                  >
                    {/* Batch — rowSpan covers all 5 days */}
                    {isFirstDay && (
                      <td
                        rowSpan={DAYS.length}
                        className="border border-gray-100 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 z-10 align-middle"
                        style={
                          bi > 0
                            ? { borderTop: "2px solid #e5e7eb" }
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-1.5">
                          {batch}
                          {track2Batches.has(batch) && (
                            <span className="text-[8px] px-1 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">
                              T2
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Day label */}
                    <td
                      className={`border border-gray-100 dark:border-gray-700 px-2 py-1.5 text-center text-[10px] font-semibold whitespace-nowrap ${
                        isT2
                          ? "text-purple-400 dark:text-purple-500"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </td>

                    {/* Period cells */}
                    {renderPeriodCells(
                      batch,
                      isT2,
                      map,
                      batchPmLab,
                      batchAmLab,
                    )}
                  </tr>
                );
              }),
            )
          )}
        </tbody>
      </table>
    </div>
  );

  // ── NORMAL VIEW — single selected day with day toggle ───────────────────────
  const dayGrid = scheduleData?.grid?.[selectedDay];
  const t1Cells = (dayGrid?.track1 ?? []).sort(
    (a, b) => a.period_index - b.period_index,
  );
  const t2Cells = (dayGrid?.track2 ?? []).sort(
    (a, b) => a.period_index - b.period_index,
  );
  const t1Map = Object.fromEntries(t1Cells.map((c) => [c.period_index, c]));
  const t2Map = Object.fromEntries(t2Cells.map((c) => [c.period_index, c]));
  const t1PmLab = getLabBlock(t1Map, PM_LAB_BLOCK);
  const t2AmLab = getLabBlock(t2Map, AM_LAB_BLOCK);
  const hasT2 = !!t2AmLab;

  const renderTimeGrid = () => (
    <>
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

      {/* Track info */}
      {hasT2 && (
        <div className="flex gap-2 text-xs flex-wrap">
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
                  className={`border border-gray-100 dark:border-gray-700 px-1 py-2.5 text-center text-[9px] font-semibold whitespace-nowrap ${
                    i === LUNCH_PI
                      ? "text-gray-300 dark:text-gray-600"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
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
              const map = isT2 ? t2Map : t1Map;
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

                  {renderPeriodCells(batch, isT2, map, batchPmLab, batchAmLab)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-4 flex-wrap rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 px-4 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Filter
        </span>

        <FilterSelect
          label="Batch"
          value={batchFilter}
          onChange={setBatchFilter}
          options={allBatches}
          colorClass="emerald"
        />

        <FilterSelect
          label="Faculty"
          value={facultyFilter}
          onChange={setFacultyFilter}
          options={allFaculty}
          colorClass="violet"
        />

        {isFiltered && (
          <>
            <span className="text-gray-200 dark:text-gray-700 select-none">
              |
            </span>
            <button
              onClick={() => {
                setBatchFilter("");
                setFacultyFilter("");
              }}
              className="text-[11px] text-gray-400 hover:text-red-500 dark:hover:text-red-400 font-medium transition-colors"
            >
              Clear all
            </button>
            <span className="ml-auto text-[10px] italic text-gray-400 dark:text-gray-500">
              All 5 days · {filteredBatches.length} batch
              {filteredBatches.length !== 1 ? "es" : ""}
            </span>
          </>
        )}
      </div>

      {isFiltered ? renderFilteredView() : renderTimeGrid()}
    </div>
  );
};

export default InstituteView;
