import React from "react";
import { Search, X } from "lucide-react";

const SearchBar = ({ searchQuery, onSearchChange, totalResults }) => {
  return (
    <div className="mb-6 animate-fadeInUp">
      <div className="relative max-w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by session name (e.g., 2024-25)..."
          className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-700 
                   rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                   focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                   placeholder-gray-400 dark:placeholder-gray-500
                   transition-all duration-200"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors" />
          </button>
        )}
      </div>

      {/* Search Results Info */}
      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {searchQuery ? (
          <span>
            Found{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {totalResults}
            </span>{" "}
            result{totalResults !== 1 ? "s" : ""} for "
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {searchQuery}
            </span>
            "
          </span>
        ) : (
          <span>
            Showing all {totalResults} session{totalResults !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
