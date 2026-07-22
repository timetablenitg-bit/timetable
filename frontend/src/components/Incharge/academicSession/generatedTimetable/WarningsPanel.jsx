// WarningsPanel.jsx
//
// Persistent panel (not a toast) listing clash/consecutive-run warnings.
// CHANGED:
//  - Filters warnings to the current batch/faculty selection instead of
//    dumping every institute-wide warning — relies on batch_names /
//    faculty_codes now attached in scheduleWarnings.js. If neither filter
//    is active (institute-wide view), everything is shown, same as before.
//  - Collapsible, defaulting to collapsed — the panel opens with just a
//    one-line summary; the admin expands it when they actually want to
//    read the list.
import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

const SEVERITY_STYLE = {
  error: { icon: ShieldAlert, text: "text-red-700 dark:text-red-400" },
  warning: { icon: AlertTriangle, text: "text-amber-700 dark:text-amber-400" },
};

const WarningsPanel = ({
  warnings = [],
  batchName,
  facultyName,
  defaultCollapsed = true,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  // NEW — relevance filter. A warning is shown if it names the batch we're
  // looking at, or the faculty we're looking at. With no filter active
  // (plain institute view, nothing selected) everything still shows.
  const relevant = useMemo(() => {
    if (!batchName && !facultyName) return warnings;
    return warnings.filter((w) => {
      const matchesBatch =
        batchName && (w.batch_names ?? []).includes(batchName);
      const matchesFaculty =
        facultyName && (w.faculty_codes ?? []).includes(facultyName);
      return matchesBatch || matchesFaculty;
    });
  }, [warnings, batchName, facultyName]);

  if (!relevant.length) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 size={13} className="shrink-0" />
        <span>
          No clashes detected
          {batchName ? ` for ${batchName}` : ""}
          {facultyName ? ` (${facultyName})` : ""}. Edits so far look clean.
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between gap-1.5 px-3 py-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100/60 dark:hover:bg-amber-900/20 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <AlertTriangle size={12} />
          {relevant.length} arrangement{relevant.length !== 1 ? "s" : ""} may
          need a look
          {batchName ? ` — ${batchName}` : ""}
          {facultyName ? ` · ${facultyName}` : ""}
        </span>
        <ChevronDown
          size={13}
          className={`transition-transform ${collapsed ? "" : "rotate-180"}`}
        />
      </button>

      {!collapsed && (
        <ul className="max-h-48 overflow-y-auto divide-y divide-amber-200/50 dark:divide-amber-800/50 border-t border-amber-200/70 dark:border-amber-800/70">
          {relevant.map((w, i) => {
            const style = SEVERITY_STYLE[w.severity] ?? SEVERITY_STYLE.warning;
            const Icon = style.icon;
            return (
              <li
                key={i}
                className={`flex items-start gap-2 px-3 py-2 text-[11px] ${style.text}`}
              >
                <Icon size={12} className="shrink-0 mt-0.5" />
                <span>{w.message}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default WarningsPanel;
