import React from "react";
import { Search, XCircle } from "lucide-react";

const NoSearchResults = ({ searchQuery, onClear }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fadeInUp">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full blur-2xl opacity-20"></div>
        <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full p-6 mb-6">
          <Search className="w-16 h-16 text-gray-500 dark:text-gray-400" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
        No Results Found
      </h2>

      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
        We couldn't find any session matching "
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          {searchQuery}
        </span>
        "
      </p>

      <button
        onClick={onClear}
        className="group flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-500 
                   hover:from-gray-700 hover:to-gray-600 dark:from-gray-600 dark:to-gray-500
                   text-white font-medium rounded-xl transition-all duration-300 
                   transform hover:scale-105 active:scale-95 shadow-lg"
      >
        <XCircle className="w-5 h-5" />
        Clear Search
      </button>

      <div className="mt-8 text-sm text-gray-500 dark:text-gray-500">
        <p>Try searching with different keywords</p>
      </div>
    </div>
  );
};

export default NoSearchResults;
