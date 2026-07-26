// EditToolbar.jsx  — schedule edit toolbar
//
// CHANGED: there's no longer a backend distinction between "save" and "save
// and re-evaluate" — POST .../schedule/:id/save always re-validates the
// edited grid (adjacency + double-booking warnings) AND rescores it in one
// call (see scheduleEditController.saveAndEvaluateSchedule). So this toolbar
// only needs Cancel + Save now.
import React from "react";
import { Loader2, Save, Info, AlertTriangle } from "lucide-react";

const EditToolbar = ({
  onCancel,
  onSave,
  isSaving,
  saveError,
  warnings = [],
}) => (
  <div className="space-y-2">
    <div
      data-tour="schedule-edit-toolbar"
      className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800"
    >
      {/* Hint */}
      <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-300 flex-1 min-w-0">
        <Info size={11} className="shrink-0" />
        <span>
          Drag any slot or lab block to swap. Click a cell to assign a slot from
          the picker. Changes are local until you save.
        </span>
      </div>

      {/* Error */}
      {saveError && (
        <span className="text-[10px] text-red-500 shrink-0">{saveError}</span>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? (
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

    {/* Non-blocking adjacency/double-booking warnings from the last save.
        The save still goes through — this is FYI, matching the backend's
        "admin can override, but sees what they're overriding" stance. */}
    {warnings.length > 0 && (
      <div className="flex flex-col gap-1 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
        {warnings.map((w, i) => (
          <div
            key={i}
            className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400"
          >
            <AlertTriangle size={11} className="shrink-0 mt-0.5" />
            <span>{w}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default EditToolbar;
