// ScoreBadge.jsx
import React from "react";
import { Star } from "lucide-react";

const ScoreBadge = ({ score }) => {
  const cls =
    score >= 80
      ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400"
      : score >= 55
        ? "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400"
        : "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400";

  return (
    <span
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}
    >
      <Star size={11} />
      Score {score}
    </span>
  );
};

export default ScoreBadge;
