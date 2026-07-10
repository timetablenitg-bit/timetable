// SkeletonEditor.jsx
//
// Lets the admin edit the active TimetableSkeleton — the grid of
// {day, track, period_index, slot_label} cells that drives generation (see
// utils/skeletonDerivation.js on the backend). Without this, the skeleton is
// permanently stuck on buildDefaultSkeletonCells().
//
// Flow matches skeletonController.js exactly:
//   1. GET  /skeleton?session_id=          — fetch (or auto-seed) the active one
//   2. POST /skeleton                      — save as a new DRAFT (is_active: false)
//   3. PATCH /skeleton/:id/activate        — make a draft the live one
//
// This is intentionally a plain table editor, not a drag/drop grid — the
// skeleton changes rarely, so simplicity beats polish here.

import React, { useEffect, useState, useMemo } from "react";
import { Loader2, Plus, Trash2, CheckCircle2, Save } from "lucide-react";
import useAdminStore from "../../../../store/useAdminStore";
import { DAYS } from "./constants";

const TIME_LABELS = {
  0: "9:00-9:55",
  1: "10:00-10:55",
  2: "11:00-11:55",
  3: "12:00-12:55",
  4: "LUNCH",
  5: "14:00-14:55",
  6: "15:00-15:55",
  7: "16:00-16:55",
};

const RESERVED_LABELS = ["BREAK", "LUNCH", "LAB", "G", "H", "TUT", "1-CREDIT"];

const cellKey = (day, track, pi) => `${day}::${track}::${pi}`;

const SkeletonEditor = ({ session }) => {
  const {
    skeletonData,
    isFetchingSkeleton,
    isSavingSkeleton,
    skeletonError,
    fetchSkeleton,
    saveSkeletonDraft,
    activateSkeleton,
  } = useAdminStore();

  const [cells, setCells] = useState({}); // cellKey -> slot_label
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (session?._id) fetchSkeleton(session._id);
  }, [session?._id]);

  useEffect(() => {
    if (!skeletonData?.cells) return;
    const map = {};
    skeletonData.cells.forEach((c) => {
      map[cellKey(c.day, c.track, c.period_index)] = c.slot_label ?? "";
    });
    setCells(map);
    setDirty(false);
  }, [skeletonData]);

  const hasTrack2 = useMemo(
    () => new Set(["Monday", "Tuesday", "Thursday"]),
    [],
  );

  const updateCell = (day, track, pi, value) => {
    setCells((prev) => ({ ...prev, [cellKey(day, track, pi)]: value }));
    setDirty(true);
  };

  const cellsToArray = () => {
    const out = [];
    for (const [key, slot_label] of Object.entries(cells)) {
      const [day, trackStr, piStr] = key.split("::");
      const track = Number(trackStr);
      const period_index = Number(piStr);
      out.push({
        day,
        track,
        period_index,
        time_label: TIME_LABELS[period_index],
        slot_label: slot_label || null,
      });
    }
    return out;
  };

  const handleSaveDraft = async () => {
    const result = await saveSkeletonDraft(
      session._id,
      cellsToArray(),
      skeletonData?.is_active ? null : skeletonData?._id,
    );
    if (result.ok) setDirty(false);
  };

  const handleActivate = async () => {
    // Save first if there are unsaved edits, then activate whatever comes back.
    let target = skeletonData;
    if (dirty) {
      const result = await saveSkeletonDraft(
        session._id,
        cellsToArray(),
        skeletonData?.is_active ? null : skeletonData?._id,
      );
      if (!result.ok) return;
      target = result.data;
    }
    if (target?._id) await activateSkeleton(target._id);
  };

  if (isFetchingSkeleton) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <Loader2 size={20} className="animate-spin text-emerald-500" />
        <span className="text-sm text-gray-400">Loading skeleton…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Slot skeleton
          </h4>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            {skeletonData?.is_active
              ? "Editing the active skeleton — saving creates a new draft, it won't go live until you activate it."
              : "Editing an inactive draft."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {skeletonError && (
            <span className="text-[11px] text-red-500">{skeletonError}</span>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={!dirty || isSavingSkeleton}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            {isSavingSkeleton ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Save size={11} />
            )}
            Save draft
          </button>
          <button
            onClick={handleActivate}
            disabled={isSavingSkeleton}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-60"
          >
            <CheckCircle2 size={11} />
            Save &amp; activate
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
        <table
          className="border-collapse"
          style={{ minWidth: 820, width: "100%" }}
        >
          <thead>
            <tr>
              <th className="border border-gray-100 dark:border-gray-800 px-2 py-2 text-left text-[11px] font-medium text-gray-400 dark:text-gray-500">
                Day
              </th>
              {Object.values(TIME_LABELS).map((label, i) => (
                <th
                  key={i}
                  className="border border-gray-100 dark:border-gray-800 px-1 py-2 text-center text-[11px] font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => {
              const tracksForDay = hasTrack2.has(day) ? [1, 2] : [1];
              return tracksForDay.map((track, ti) => (
                <tr key={`${day}-${track}`}>
                  {ti === 0 && (
                    <td
                      rowSpan={tracksForDay.length}
                      className="border border-gray-100 dark:border-gray-800 px-2 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 align-middle"
                    >
                      {day.slice(0, 3)}
                    </td>
                  )}
                  {Object.keys(TIME_LABELS).map((piStr) => {
                    const pi = Number(piStr);
                    const isLunch = pi === 4;
                    const value = cells[cellKey(day, track, pi)] ?? "";
                    if (isLunch) {
                      return (
                        <td
                          key={pi}
                          className="border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-center px-1 py-1 text-[10px] text-gray-300 dark:text-gray-600"
                        >
                          LUNCH
                        </td>
                      );
                    }
                    return (
                      <td
                        key={pi}
                        className="border border-gray-100 dark:border-gray-800 px-1 py-1"
                      >
                        <input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            updateCell(
                              day,
                              track,
                              pi,
                              e.target.value.toUpperCase(),
                            )
                          }
                          placeholder="—"
                          className="w-full text-[11px] text-center px-1 py-1 rounded border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500 bg-transparent focus:outline-none"
                        />
                      </td>
                    );
                  })}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-gray-400 dark:text-gray-500">
        Reserved labels: {RESERVED_LABELS.join(", ")}. Anything else (A, B, C…)
        is treated as a regular theory slot. Leave a cell blank for an
        intentionally empty period.
      </p>
    </div>
  );
};

export default SkeletonEditor;
