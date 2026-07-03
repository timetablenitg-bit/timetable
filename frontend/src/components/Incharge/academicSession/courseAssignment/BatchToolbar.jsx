import React from "react";
import { ArrowUpDown, X } from "lucide-react";

const SORT_OPTIONS = [
  { value: "department", label: "Sort: Department" },
  { value: "year", label: "Sort: Year" },
  { value: "name", label: "Sort: Batch Name" },
];

// Search + filter (department/year) + sort controls for the batch list.
const BatchToolbar = ({
  departments,
  filterDepartment,
  onFilterDepartmentChange,
  years,
  filterYear,
  onFilterYearChange,
  sortBy,
  onSortByChange,
  sortDir,
  onToggleSortDir,
  resultCount,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
    {/* Department filter */}
    <select
      value={filterDepartment}
      onChange={(e) => onFilterDepartmentChange(e.target.value)}
      className="text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
    >
      <option value="">All Departments</option>
      {departments.map((d) => (
        <option key={d} value={d}>
          {d}
        </option>
      ))}
    </select>

    {/* Year filter */}
    <select
      value={filterYear}
      onChange={(e) => onFilterYearChange(e.target.value)}
      className="text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
    >
      <option value="">All Years</option>
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>

    {/* Sort */}
    <div className="flex items-center gap-1">
      <select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value)}
        className="text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onToggleSortDir}
        title={sortDir === "asc" ? "Ascending" : "Descending"}
        className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-emerald-600 hover:border-emerald-300 transition-colors"
      >
        <ArrowUpDown
          size={14}
          className={sortDir === "desc" ? "scale-y-[-1]" : ""}
        />
      </button>
    </div>

    {/* Result count */}
    <span className="text-xs text-gray-400 whitespace-nowrap sm:ml-auto">
      {resultCount} batch{resultCount === 1 ? "" : "es"}
    </span>
  </div>
);

export default BatchToolbar;
