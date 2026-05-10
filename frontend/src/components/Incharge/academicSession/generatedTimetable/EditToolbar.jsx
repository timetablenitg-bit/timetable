// EditToolbar.jsx  — schedule edit toolbar
// Actions: Cancel (handled by parent), Save to DB, Save + Re-evaluate
import React from "react";
import { Loader2, Save, Zap, Info } from "lucide-react";

const EditToolbar = ({
  onCancel,
  onSave,
  onSaveAndEvaluate,
  isSaving,
  isEvaluating,
  saveError,
}) => (
  <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
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
      {/* Cancel — just exits edit mode, no save */}
      <button
        onClick={onCancel}
        disabled={isSaving || isEvaluating}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        Cancel
      </button>

      {/* Save only */}
      <button
        onClick={onSave}
        disabled={isSaving || isEvaluating}
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

      {/* Save + re-evaluate */}
      <button
        onClick={onSaveAndEvaluate}
        disabled={isSaving || isEvaluating}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isEvaluating ? (
          <>
            <Loader2 size={11} className="animate-spin" />
            Evaluating…
          </>
        ) : (
          <>
            <Zap size={11} />
            Save &amp; Re-evaluate
          </>
        )}
      </button>
    </div>
  </div>
);

export default EditToolbar;
