import React from "react";

const UnsavedChangesBanner = ({ count, onSave, isSaving }) => {
  if (count === 0) return null;

  return (
    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
          <span className="text-blue-600 dark:text-blue-400 text-lg font-bold">
            {count}
          </span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
            Unsaved Batches
          </h3>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            You have {count} batch(es) waiting to be saved to the database.
          </p>
        </div>
      </div>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? "Saving..." : "Save All to Database"}
      </button>
    </div>
  );
};

export default UnsavedChangesBanner;
