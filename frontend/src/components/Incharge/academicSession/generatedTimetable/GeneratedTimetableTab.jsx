// GeneratedTimetableTab.jsx
//
// CHANGED from the original:
//   - New "Review" tab (ManualReviewPanel) with a pending-count badge, since
//     overflow / choose_occurrences items now have nowhere else to be resolved.
//   - Schedule save collapsed to a single saveSchedule(timetable_id, grid)
//     call — no more separate "Save" vs "Save & Re-evaluate" (see EditToolbar).
//   - Save warnings (adjacency/double-booking clashes introduced by a manual
//     edit) are now displayed via EditToolbar's warnings prop.
//
// CHANGED (manual-review commit-to-grid model):
//   - handleSwapCells / handleLabSwap now carry cell.manual_entries and
//     cell.hidden_assignment_ids along with the swap. Previously only
//     slot_name/slot_type/is_lab_anchor moved, so dragging a manually
//     placed (overflow-resolved) cell in Schedule edit mode would strand
//     its manual_entries at the OLD position and leave the destination
//     cell showing nothing — a silent data loss on drag.
//   - handleCellChange (the click-to-assign picker) now clears
//     manual_entries/hidden_assignment_ids on the cell being reassigned.
//     An explicit manual override through the picker should win outright
//     over whatever a prior review resolution left there; leaving stale
//     manual_entries behind after the admin picks a different label would
//     make two different things "true" for the same cell at once.
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Loader2,
  LayoutGrid,
  Rows3,
  CalendarDays,
  Pencil,
  RefreshCw,
  FileSpreadsheet,
  Info,
  Save,
  ClipboardCheck,
} from "lucide-react";
import useAdminStore from "../../../../store/useAdminStore";
import useManualReviewStore from "../../../../store/useManualReviewStore";
import ScoreBadge from "./ScoreBadge";
import EditToolbar from "./EditToolbar";
import DualTrackScheduleView from "./DualTrackScheduleView";
import EditableSlotsView from "./EditableSlotsView";
import InstituteView from "./InstituteView";
import ManualReviewPanel from "./ManualReviewPanel";

const BASE_TABS = [
  { key: "schedule", label: "Schedule", icon: Rows3 },
  { key: "slots", label: "Slots", icon: LayoutGrid },
  { key: "institute", label: "Institute", icon: CalendarDays },
  { key: "review", label: "Review", icon: ClipboardCheck },
];

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
    isSavingSchedule,
    isSavingSlots,
    scheduleError,
    slotsError,
    exportTimetableExcel,
  } = useAdminStore();

  const { items: reviewItems, fetchPendingItems } = useManualReviewStore();

  const [activeTab, setActiveTab] = useState("schedule");
  const [scheduleEditMode, setScheduleEditMode] = useState(false);
  const [slotsEditMode, setSlotsEditMode] = useState(false);
  const [localGrid, setLocalGrid] = useState(null);
  const [saveWarnings, setSaveWarnings] = useState([]);

  // Ref onto EditableSlotsView's imperative API (save / cancel / isDirty),
  // so this parent's toolbar can drive it instead of it running its own
  // competing save UI.
  const slotsViewRef = useRef(null);

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
    fetchPendingItems(session._id);
  }, [session?._id, timetableData]);

  // ── tab switch cancels active edit ────────────────────────────────────────
  const handleTabChange = (key) => {
    if (activeTab === "schedule" && scheduleEditMode) {
      setScheduleEditMode(false);
      setSaveWarnings([]);
      if (activeScheduleData?.grid)
        setLocalGrid(structuredClone(activeScheduleData.grid));
    }
    if (activeTab === "slots" && slotsEditMode) {
      slotsViewRef.current?.cancel();
      setSlotsEditMode(false);
    }
    setActiveTab(key);
  };

  const handleEditToggle = () => {
    if (activeTab === "schedule") {
      if (scheduleEditMode && activeScheduleData?.grid)
        setLocalGrid(structuredClone(activeScheduleData.grid));
      setSaveWarnings([]);
      setScheduleEditMode((v) => !v);
    } else if (activeTab === "slots") {
      setSlotsEditMode((v) => !v);
    }
  };

  const handleCancelScheduleEdit = () => {
    if (activeScheduleData?.grid)
      setLocalGrid(structuredClone(activeScheduleData.grid));
    setSaveWarnings([]);
    setScheduleEditMode(false);
  };

  // ── slots cancel / save (drives EditableSlotsView via ref) ───────────────
  const handleCancelSlotsEdit = () => {
    slotsViewRef.current?.cancel();
    setSlotsEditMode(false);
  };

  const handleSaveSlots = async () => {
    const result = await slotsViewRef.current?.save();
    if (result?.ok) {
      await fetchGeneratedSlots(session._id);
      setSlotsEditMode(false);
    }
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
        // NEW — manual-review data belongs to the CELL, not the label, so it
        // has to travel with the swap just like slot_name does. Without
        // this, a dragged manual placement gets left behind at the old
        // position and the destination cell silently shows nothing.
        [s.manual_entries, d.manual_entries] = [
          d.manual_entries ?? [],
          s.manual_entries ?? [],
        ];
        [s.hidden_assignment_ids, d.hidden_assignment_ids] = [
          d.hidden_assignment_ids ?? [],
          s.hidden_assignment_ids ?? [],
        ];
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
        // NEW — same rationale as handleSwapCells. Labs are never valid
        // overflow/choose targets in practice, but if a review item ever
        // did reference one, this keeps the swap correct rather than
        // silently dropping the data.
        [sc.manual_entries, dc.manual_entries] = [
          dc.manual_entries ?? [],
          sc.manual_entries ?? [],
        ];
        [sc.hidden_assignment_ids, dc.hidden_assignment_ids] = [
          dc.hidden_assignment_ids ?? [],
          sc.hidden_assignment_ids ?? [],
        ];
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
        // NEW — an explicit reassignment through the picker supersedes
        // whatever a prior manual-review resolution left on this cell.
        // Leaving manual_entries/hidden_assignment_ids in place after the
        // admin picks a different label would make the cell mean two
        // contradictory things at once.
        cell.manual_entries = [];
        cell.hidden_assignment_ids = [];
        return next;
      });
    },
    [],
  );

  // ── save (single action now — always re-validates + rescores) ────────────
  const handleSave = async () => {
    if (!localGrid || !activeScheduleData?.timetable_id) return;
    const result = await saveSchedule(
      activeScheduleData.timetable_id,
      localGrid,
    );
    if (result.ok) {
      setSaveWarnings(result.warnings ?? []);
      await fetchActiveSchedule(session._id);
      if (!result.warnings?.length) setScheduleEditMode(false);
      // If there ARE warnings, stay in edit mode so the admin sees them
      // against the grid they just edited, rather than silently exiting.
    }
  };

  const handleSlotsUpdated = useCallback(async () => {
    await fetchGeneratedSlots(session._id);
    setSlotsEditMode(false);
  }, [fetchGeneratedSlots, session?._id]);

  const handleRefresh = () => {
    fetchGeneratedSlots(session._id);
    fetchActiveSchedule(session._id);
    fetchPendingItems(session._id);
  };

  const handleExportExcel = async () => {
    if (!activeScheduleData?.generation_id) return;
    await exportTimetableExcel(activeScheduleData.generation_id, session?.term);
  };

  const handleReviewResolved = useCallback(() => {
    // A resolved review item edits the saved grid server-side — refresh
    // both so Schedule/Institute views reflect it immediately.
    fetchActiveSchedule(session._id);
    fetchGeneratedSlots(session._id);
  }, [fetchActiveSchedule, fetchGeneratedSlots, session?._id]);

  const isLoading = isFetchingSlots || isFetchingSchedule;
  const hasData = generatedSlotsData || activeScheduleData;
  const score = generatedSlotsData?.score ?? activeScheduleData?.score;
  const pendingReviewCount = reviewItems.length;

  const displayScheduleData = useMemo(() => {
    if (!activeScheduleData) return null;
    return localGrid
      ? { ...activeScheduleData, grid: localGrid }
      : activeScheduleData;
  }, [activeScheduleData, localGrid]);

  // ── which panel (and empty-state message) belongs to the active tab ────────
  const panel = useMemo(() => {
    if (activeTab === "schedule") {
      return displayScheduleData
        ? {
            node: (
              <DualTrackScheduleView
                scheduleData={displayScheduleData}
                slotsData={generatedSlotsData}
                editMode={scheduleEditMode}
                onSwapCells={handleSwapCells}
                onLabSwap={handleLabSwap}
                onCellChange={handleCellChange}
              />
            ),
          }
        : { empty: "Schedule data unavailable." };
    }
    if (activeTab === "slots") {
      return generatedSlotsData
        ? {
            node: (
              <EditableSlotsView
                ref={slotsViewRef}
                slotsData={generatedSlotsData}
                editMode={slotsEditMode}
                sessionId={session._id}
                onSlotsUpdated={handleSlotsUpdated}
              />
            ),
          }
        : { empty: "Slot data unavailable." };
    }
    if (activeTab === "review") {
      return {
        node: (
          <ManualReviewPanel
            session={session}
            scheduleData={displayScheduleData} // NEW
            slotsData={generatedSlotsData}
            onResolved={handleReviewResolved}
          />
        ),
      };
    }
    // institute
    return displayScheduleData && generatedSlotsData
      ? {
          node: (
            <InstituteView
              scheduleData={displayScheduleData}
              slotsData={generatedSlotsData}
            />
          ),
        }
      : { empty: "Both slots and schedule data are needed." };
  }, [
    activeTab,
    displayScheduleData,
    generatedSlotsData,
    scheduleEditMode,
    slotsEditMode,
    session,
    handleSwapCells,
    handleLabSwap,
    handleCellChange,
    handleSlotsUpdated,
    handleReviewResolved,
  ]);

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
      {/* Header — session name on the left, score + actions on the right */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {session?.term} Term
        </h3>

        <div className="flex items-center gap-1.5">
          {score != null && <ScoreBadge score={score} />}

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
            onClick={handleExportExcel}
            disabled={!activeScheduleData?.generation_id}
            title="Export to Excel"
            className="p-1.5 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={14} />
          </button>

          <button
            onClick={handleRefresh}
            title="Refresh"
            className="p-1.5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Schedule edit toolbar — Cancel / Save (always re-validates + rescores) */}
      {activeTab === "schedule" && scheduleEditMode && (
        <EditToolbar
          onCancel={handleCancelScheduleEdit}
          onSave={handleSave}
          isSaving={isSavingSchedule}
          saveError={scheduleError}
          warnings={saveWarnings}
        />
      )}

      {/* Slots edit toolbar — Cancel / Save */}
      {activeTab === "slots" && slotsEditMode && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-300 flex-1 min-w-0">
            <Info size={11} className="shrink-0" />
            <span>
              Drag a course to move it, use + to add one, or the trash icon to
              remove a slot. Changes are local until you save.
            </span>
          </div>

          {slotsError && (
            <span className="text-[10px] text-red-500 shrink-0">
              {slotsError}
            </span>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCancelSlotsEdit}
              disabled={isSavingSlots}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSaveSlots}
              disabled={isSavingSlots}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSavingSlots ? (
                <>
                  <Loader2 size={11} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={11} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-4 border-b border-gray-100 dark:border-gray-700">
        {BASE_TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          const isDirty =
            (key === "schedule" && scheduleEditMode) ||
            (key === "slots" && slotsEditMode);
          return (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex items-center gap-1.5 pb-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? "border-emerald-500 text-gray-800 dark:text-gray-100"
                  : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <Icon size={13} />
              {label}
              {key === "review" && pendingReviewCount > 0 && (
                <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold leading-none">
                  {pendingReviewCount}
                </span>
              )}
              {isDirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {panel.node ?? (
        <p className="text-sm text-gray-400 text-center py-10">{panel.empty}</p>
      )}
    </div>
  );
};

export default GeneratedTimetableTab;
