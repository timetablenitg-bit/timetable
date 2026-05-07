import React, { useState, useMemo } from "react";
import { Filter, Search, X, SlidersHorizontal } from "lucide-react";

const GenericFilter = ({
  // Data and display
  items = [],
  filterConfig = [],
  searchFields = [],
  renderItem,
  emptyMessage = "No items found",

  // Optional configurations
  quickFilters = [], // For quick filter buttons like branches
  quickFilterKey = null, // The key to use for quick filter (e.g., 'department', 'type')
  onFilterChange = null,

  // UI customization
  title = "Items",
  showSearch = true,
  showQuickFilters = true,
  searchPlaceholder = "Search...",
  itemsPerRow = "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",

  // Additional classes
  containerClassName = "",
  itemClassName = "",
}) => {
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [quickFilterValue, setQuickFilterValue] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get unique values for quick filters
  const uniqueQuickFilterOptions = useMemo(() => {
    if (!quickFilterKey) return [];
    const values = [
      ...new Set(items.map((item) => item[quickFilterKey]).filter(Boolean)),
    ];
    return values.sort();
  }, [items, quickFilterKey]);

  // Get unique values for advanced filters
  const filterOptions = useMemo(() => {
    const options = {};
    filterConfig.forEach((config) => {
      if (config.getOptions) {
        options[config.key] = config.getOptions(items);
      } else if (config.options) {
        // Use provided options directly
        options[config.key] = config.options;
      } else {
        // Extract unique values from items
        const values = [
          ...new Set(items.map((item) => item[config.key]).filter(Boolean)),
        ];
        options[config.key] = values.sort();
      }
    });
    return options;
  }, [items, filterConfig]);

  // Apply all filters
  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Apply quick filter
    if (quickFilterValue && quickFilterKey) {
      filtered = filtered.filter(
        (item) => item[quickFilterKey] === quickFilterValue,
      );
    }

    // Apply search
    if (searchQuery && searchFields.length > 0) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        searchFields.some((field) =>
          item[field]?.toString().toLowerCase().includes(query),
        ),
      );
    }

    // Apply advanced filters
    Object.entries(advancedFilters).forEach(([key, value]) => {
      if (value && value !== "") {
        filtered = filtered.filter((item) => {
          const itemValue = item[key];
          if (typeof value === "string") {
            return itemValue?.toString() === value;
          }
          return itemValue === value;
        });
      }
    });

    return filtered;
  }, [
    items,
    quickFilterValue,
    quickFilterKey,
    searchQuery,
    searchFields,
    advancedFilters,
  ]);

  const activeAdvancedFiltersCount = Object.values(advancedFilters).filter(
    (v) => v && v !== "",
  ).length;
  const totalActiveFilters =
    activeAdvancedFiltersCount +
    (quickFilterValue ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery("");
    setQuickFilterValue("");
    setAdvancedFilters({});
    if (onFilterChange) onFilterChange({});
  };

  const clearQuickFilter = () => {
    setQuickFilterValue("");
  };

  const updateAdvancedFilter = (key, value) => {
    setAdvancedFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearAdvancedFilter = (key) => {
    setAdvancedFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const applyFiltersAndClose = () => {
    if (onFilterChange) onFilterChange(advancedFilters);
    setIsFilterOpen(false);
  };

  // Get color for different filter types
  const getFilterColor = (key, value) => {
    const colors = {
      type: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      nature:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      department:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      status:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      semester:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
      default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    };
    return colors[key] || colors.default;
  };

  return (
    <div
      className={`bg-gray-100 dark:bg-slate-900 p-6 rounded-lg z-[101] ${containerClassName}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            {title}
            <span className="text-sm font-medium bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 px-2.5 py-0.5 rounded-full">
              {filteredItems.length} / {items.length}
            </span>
          </h2>
        </div>

        <div className="flex gap-2">
          {totalActiveFilters > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 px-2 py-1"
            >
              Clear all
            </button>
          )}

          {filterConfig.length > 0 && (
            <button
              onClick={() => setIsFilterOpen(true)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                activeAdvancedFiltersCount > 0
                  ? "bg-cyan-600 text-white"
                  : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700"
              }`}
            >
              <SlidersHorizontal size={16} />
              <span className="text-sm font-medium">Advanced Filters</span>
              {activeAdvancedFiltersCount > 0 && (
                <span className="ml-1 bg-white text-cyan-600 rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
                  {activeAdvancedFiltersCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="mb-4 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-200 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Quick Filter Buttons */}
      {showQuickFilters && quickFilters.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Quick Filters
            </label>
            {quickFilterValue && (
              <button
                onClick={clearQuickFilter}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setQuickFilterValue("")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                !quickFilterValue
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50"
              }`}
            >
              All
            </button>
            {quickFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setQuickFilterValue(filter.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                  quickFilterValue === filter.value
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {totalActiveFilters > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
            Active filters:
          </span>

          {quickFilterValue && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
              {quickFilters.find((f) => f.value === quickFilterValue)?.label ||
                quickFilterValue}
              <button
                onClick={() => setQuickFilterValue("")}
                className="hover:opacity-70"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {Object.entries(advancedFilters).map(
            ([key, value]) =>
              value && (
                <span
                  key={key}
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getFilterColor(key)}`}
                >
                  {filterConfig.find((f) => f.key === key)?.label || key}:{" "}
                  {value}
                  <button
                    onClick={() => clearAdvancedFilter(key)}
                    className="hover:opacity-70"
                  >
                    <X size={12} />
                  </button>
                </span>
              ),
          )}

          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
              Search: "{searchQuery}"
              <button
                onClick={() => setSearchQuery("")}
                className="hover:text-gray-900"
              >
                <X size={12} />
              </button>
            </span>
          )}

          <button
            onClick={clearAllFilters}
            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 ml-auto"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results */}
      {filteredItems.length === 0 ? (
        <div className="py-12 text-center bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700">
          <p className="text-gray-500 dark:text-slate-400">{emptyMessage}</p>
          {totalActiveFilters > 0 && (
            <button
              onClick={clearAllFilters}
              className="mt-3 text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${itemsPerRow} gap-2`}>
          {filteredItems.map((item, index) => (
            <div key={item.id || item._id || index} className={itemClassName}>
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}

      {/* Advanced Filters Modal */}
      {isFilterOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setIsFilterOpen(false)}
          />

          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    Advanced Filters
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Refine your search
                  </p>
                </div>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {filterConfig.map((config) => (
                <div
                  key={config.key}
                  className="border-t border-gray-100 dark:border-slate-700 pt-4 first:border-0 first:pt-0"
                >
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                    {config.label}
                  </label>

                  {config.type === "select" ? (
                    <select
                      value={advancedFilters[config.key] || ""}
                      onChange={(e) =>
                        updateAdvancedFilter(config.key, e.target.value)
                      }
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-200 text-sm focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer"
                    >
                      <option value="">All {config.label}</option>
                      {filterOptions[config.key]?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => updateAdvancedFilter(config.key, "")}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                          !advancedFilters[config.key]
                            ? "bg-cyan-600 text-white"
                            : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                        }`}
                      >
                        All {config.label}
                      </button>
                      {filterOptions[config.key]?.map((option) => (
                        <button
                          key={option}
                          onClick={() =>
                            updateAdvancedFilter(config.key, option)
                          }
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                            advancedFilters[config.key] === option
                              ? `${getFilterColor(config.key)} ring-2 ring-cyan-500`
                              : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 p-6">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setAdvancedFilters({});
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Clear Filters
                </button>
                <button
                  onClick={applyFiltersAndClose}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GenericFilter;
