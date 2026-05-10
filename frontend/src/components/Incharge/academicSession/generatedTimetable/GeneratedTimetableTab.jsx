// GeneratedTimetableTab.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Loader2,
  LayoutGrid,
  Rows3,
  CalendarDays,
  Pencil,
  RefreshCw,
} from "lucide-react";
import useAdminStore from "../../../../store/useAdminStore";
import ScoreBadge from "./ScoreBadge";
import EditToolbar from "./EditToolbar";
import DualTrackScheduleView from "./DualTrackScheduleView";
import EditableSlotsView from "./EditableSlotsView";
import InstituteView from "./InstituteView";

const GeneratedTimetableTab = ({ session }) => {
  const {
    generatedSlotsData,
    activeScheduleData,
    isFetchingSlots,
    isFetchingSchedule,
    timetableData,
    fetchGeneratedSlots,
    fetchActiveSchedule,
    saveSchedule,
    saveAndEvaluateSchedule,
    isSavingSchedule,
    isEvaluatingSchedule,
    scheduleError,
  } = useAdminStore();

  const [activeTab, setActiveTab] = useState("schedule");
  const [scheduleEditMode, setScheduleEditMode] = useState(false);
  const [slotsEditMode, setSlotsEditMode] = useState(false);
  const [localGrid, setLocalGrid] = useState(null);

  const editMode =
    activeTab === "schedule"
      ? scheduleEditMode
      : activeTab === "slots"
        ? slotsEditMode
        : false;

  useEffect(() => {
    if (activeScheduleData?.grid)
      setLocalGrid(structuredClone(activeScheduleData.grid));
  }, [activeScheduleData]);

  useEffect(() => {
    if (!session?._id) return;
    fetchGeneratedSlots(session._id);
    fetchActiveSchedule(session._id);
  }, [session?._id, timetableData]);

  // ── tab switch cancels active edit ────────────────────────────────────────
  const handleTabChange = (key) => {
    if (activeTab === "schedule" && scheduleEditMode) {
      setScheduleEditMode(false);
      if (activeScheduleData?.grid)
        setLocalGrid(structuredClone(activeScheduleData.grid));
    }
    if (activeTab === "slots" && slotsEditMode) setSlotsEditMode(false);
    setActiveTab(key);
  };

  const handleEditToggle = () => {
    if (activeTab === "schedule") {
      if (scheduleEditMode && activeScheduleData?.grid)
        setLocalGrid(structuredClone(activeScheduleData.grid));
      setScheduleEditMode((v) => !v);
    } else if (activeTab === "slots") {
      setSlotsEditMode((v) => !v);
    }
  };

  const handleCancelScheduleEdit = () => {
    if (activeScheduleData?.grid)
      setLocalGrid(structuredClone(activeScheduleData.grid));
    setScheduleEditMode(false);
  };

  // ── theory cell swap ──────────────────────────────────────────────────────
  const handleSwapCells = useCallback(
    (srcDay, srcTrack, srcPi, dstDay, dstTrack, dstPi) => {
      setLocalGrid((prev) => {
        const next = structuredClone(prev);
        const srcArr = next[srcDay]?.[`track${srcTrack}`];
        const dstArr = next[dstDay]?.[`track${dstTrack}`];
        if (!srcArr || !dstArr) return prev;
        const s = srcArr.find((c) => c.period_index === srcPi);
        const d = dstArr.find((c) => c.period_index === dstPi);
        if (!s || !d) return prev;
        [s.slot_name, d.slot_name] = [d.slot_name, s.slot_name];
        [s.slot_type, d.slot_type] = [d.slot_type, s.slot_type];
        [s.is_lab_anchor, d.is_lab_anchor] = [d.is_lab_anchor, s.is_lab_anchor];
        return next;
      });
    },
    [],
  );

  // ── lab block swap ────────────────────────────────────────────────────────
  const handleLabSwap = useCallback((srcDay, srcTrack, dstDay, dstTrack) => {
    setLocalGrid((prev) => {
      const next = structuredClone(prev);
      const srcArr = next[srcDay]?.[`track${srcTrack}`];
      const dstArr = next[dstDay]?.[`track${dstTrack}`];
      if (!srcArr || !dstArr) return prev;
      const isLab = (c) => c.is_lab_anchor || c.slot_type === "lab";
      const sPIs = srcArr.filter(isLab).map((c) => c.period_index);
      const dPIs = dstArr.filter(isLab).map((c) => c.period_index);
      const len = Math.min(sPIs.length, dPIs.length);
      for (let i = 0; i < len; i++) {
        const sc = srcArr.find((c) => c.period_index === sPIs[i]);
        const dc = dstArr.find((c) => c.period_index === dPIs[i]);
        if (!sc || !dc) continue;
        [sc.slot_name, dc.slot_name] = [dc.slot_name, sc.slot_name];
        [sc.slot_type, dc.slot_type] = [dc.slot_type, sc.slot_type];
        [sc.is_lab_anchor, dc.is_lab_anchor] = [
          dc.is_lab_anchor,
          sc.is_lab_anchor,
        ];
        [sc.lab_group, dc.lab_group] = [dc.lab_group, sc.lab_group];
      }
      return next;
    });
  }, []);

  // ── click-to-assign ───────────────────────────────────────────────────────
  const handleCellChange = useCallback(
    (day, track, pi, slot_name, slot_type) => {
      setLocalGrid((prev) => {
        const next = structuredClone(prev);
        const arr = next[day]?.[`track${track}`];
        if (!arr) return prev;
        const cell = arr.find((c) => c.period_index === pi);
        if (!cell) return prev;
        cell.slot_name = slot_name ?? null;
        cell.slot_type = slot_type ?? "free";
        cell.is_lab_anchor = slot_type === "lab";
        return next;
      });
    },
    [],
  );

  // ── save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!localGrid) return;
    const result = await saveSchedule(
      session._id,
      activeScheduleData?.timetable_id,
      localGrid,
    );
    if (result.ok) {
      await fetchActiveSchedule(session._id);
      setScheduleEditMode(false);
    }
  };

  const handleSaveAndEvaluate = async () => {
    if (!localGrid) return;
    const result = await saveAndEvaluateSchedule(
      session._id,
      activeScheduleData?.timetable_id,
      localGrid,
      generatedSlotsData,
    );
    if (result.ok) {
      await fetchGeneratedSlots(session._id);
      await fetchActiveSchedule(session._id);
      setScheduleEditMode(false);
    }
  };

  const handleSlotsUpdated = async () => {
    await fetchGeneratedSlots(session._id);
    setSlotsEditMode(false);
  };

  const isLoading = isFetchingSlots || isFetchingSchedule;
  const hasData = generatedSlotsData || activeScheduleData;
  const score = generatedSlotsData?.score ?? activeScheduleData?.score;

  const displayScheduleData = useMemo(() => {
    if (!activeScheduleData) return null;
    return localGrid
      ? { ...activeScheduleData, grid: localGrid }
      : activeScheduleData;
  }, [activeScheduleData, localGrid]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <Loader2 size={22} className="animate-spin text-emerald-500" />
        <span className="text-sm text-gray-400">Loading timetable…</span>
      </div>
    );

  if (!hasData)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <CalendarDays size={40} className="opacity-30" />
        <p className="text-sm text-center">
          No timetable generated yet.
          <br />
          Head to the Finalized Assignments tab and click{" "}
          <span className="font-medium text-emerald-500">
            Generate Timetable
          </span>
          .
        </p>
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-800/50 rounded-xl p-4 border border-emerald-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
            Generated Timetable
          </p>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {session?.term} Term · {generatedSlotsData?.slots?.length ?? 0}{" "}
            slots
            {(activeScheduleData?.track2_batches?.length ?? 0) > 0 && (
              <span className="ml-2 text-xs font-normal text-purple-500 dark:text-purple-400">
                · {activeScheduleData.track2_batches.length} batch
                {activeScheduleData.track2_batches.length !== 1 ? "es" : ""} on
                Track 2
              </span>
            )}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {score != null && <ScoreBadge score={score} />}

          {/* Edit button — hidden when toolbar is already showing */}
          {(activeTab === "schedule" || activeTab === "slots") && !editMode && (
            <button
              onClick={handleEditToggle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Pencil size={12} />
              {activeTab === "slots" ? "Edit slots" : "Edit"}
            </button>
          )}

          <button
            onClick={() => {
              fetchGeneratedSlots(session._id);
              fetchActiveSchedule(session._id);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Schedule edit toolbar — Cancel / Save / Save+Evaluate */}
      {activeTab === "schedule" && scheduleEditMode && (
        <EditToolbar
          onCancel={handleCancelScheduleEdit}
          onSave={handleSave}
          onSaveAndEvaluate={handleSaveAndEvaluate}
          isSaving={isSavingSchedule}
          isEvaluating={isEvaluatingSchedule}
          saveError={scheduleError}
        />
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        {[
          { key: "schedule", label: "Schedule", icon: <Rows3 size={13} /> },
          { key: "slots", label: "Slots", icon: <LayoutGrid size={13} /> },
          {
            key: "institute",
            label: "Institute",
            icon: <CalendarDays size={13} />,
          },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === key
                ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {icon}
            {label}
            {key === "schedule" && scheduleEditMode && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />
            )}
            {key === "slots" && slotsEditMode && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "schedule" && displayScheduleData && (
        <DualTrackScheduleView
          scheduleData={displayScheduleData}
          slotsData={generatedSlotsData}
          editMode={scheduleEditMode}
          onSwapCells={handleSwapCells}
          onLabSwap={handleLabSwap}
          onCellChange={handleCellChange}
        />
      )}

      {activeTab === "slots" && generatedSlotsData && (
        <EditableSlotsView
          slotsData={generatedSlotsData}
          editMode={slotsEditMode}
          sessionId={session._id}
          onSlotsUpdated={handleSlotsUpdated}
        />
      )}

      {activeTab === "institute" &&
        displayScheduleData &&
        generatedSlotsData && (
          <InstituteView
            scheduleData={displayScheduleData}
            slotsData={generatedSlotsData}
          />
        )}

      {activeTab === "schedule" && !displayScheduleData && (
        <p className="text-sm text-gray-400 text-center py-10">
          Schedule data unavailable.
        </p>
      )}
      {activeTab === "slots" && !generatedSlotsData && (
        <p className="text-sm text-gray-400 text-center py-10">
          Slot data unavailable.
        </p>
      )}
      {activeTab === "institute" &&
        (!displayScheduleData || !generatedSlotsData) && (
          <p className="text-sm text-gray-400 text-center py-10">
            Both slots and schedule data are needed.
          </p>
        )}
    </div>
  );
};

export default GeneratedTimetableTab;
