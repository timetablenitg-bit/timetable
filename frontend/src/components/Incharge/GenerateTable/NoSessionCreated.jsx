import React from "react";
import { Calendar, PlusCircle } from "lucide-react";

const NoSessionCreated = ({ onAddSession }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fadeInUp">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-gray-800 dark:to-gray-700 rounded-full p-6 mb-6">
          <Calendar className="w-16 h-16 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
        No Academic Sessions Yet
      </h2>

      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
        Get started by creating your first academic session. Manage even/odd
        semesters and track your academic progress.
      </p>

      <button
        onClick={onAddSession}
        className="group flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 
                   hover:from-emerald-700 hover:to-teal-600 dark:from-emerald-500 dark:to-teal-500
                   text-white font-medium rounded-xl transition-all duration-300 
                   transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-emerald-500/25"
      >
        <PlusCircle className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
        Create Your First Session
      </button>

      <div className="mt-12 flex gap-4 text-sm text-gray-500 dark:text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span>Manage Sessions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-500"></div>
          <span>Track Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span>Stay Organized</span>
        </div>
      </div>
    </div>
  );
};

export default NoSessionCreated;
