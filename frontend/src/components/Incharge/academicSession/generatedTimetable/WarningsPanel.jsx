// WarningsPanel.jsx
//
// Persistent panel (not a toast) listing every clash/consecutive-run
// warning the backend found on the last batch-cell edit. Non-blocking —
// matches the rest of the app's "admin can override, but sees what
// they're overriding" stance.
import React from "react";
import { AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";

const SEVERITY_STYLE = {
  error: { icon: ShieldAlert, text: "text-red-700 dark:text-red-400" },
  warning: { icon: AlertTriangle, text: "text-amber-700 dark:text-amber-400" },
};

const WarningsPanel = ({ warnings = [], batchName }) => {
  if (!warnings.length) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 size={13} className="shrink-0" />
        <span>
          No clashes detected{batchName ? ` for ${batchName}` : ""}. Edits so
          far look clean.
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-amber-200/70 dark:border-amber-800/70 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
        <AlertTriangle size={12} />
        {warnings.length} arrangement{warnings.length !== 1 ? "s" : ""} may need
        a look
      </div>
      <ul className="max-h-48 overflow-y-auto divide-y divide-amber-200/50 dark:divide-amber-800/50">
        {warnings.map((w, i) => {
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
    </div>
  );
};

export default WarningsPanel;
