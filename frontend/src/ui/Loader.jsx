import React from "react";
import { Loader2, Zap } from "lucide-react";

const Loader = ({
  text = "Loading resources...",
  subtext = "Please wait a moment",
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full p-8 transition-colors duration-500">
      {/* Animated Icon Container */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Outer Static Ring */}
        <div className="absolute w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>

        {/* Spinning Gradient Ring */}
        <div className="absolute w-24 h-24 rounded-full border-t-4 border-l-4 border-indigo-500 animate-spin shadow-lg shadow-indigo-500/20"></div>

        {/* Middle Pulse Ring */}
        <div className="absolute w-16 h-16 rounded-full bg-indigo-50 dark:bg-slate-800 animate-pulse border border-indigo-100 dark:border-slate-700"></div>

        {/* Center Icon */}
        <div className="relative">
          <Zap className="w-8 h-8 text-indigo-600 dark:text-indigo-400 fill-current" />
        </div>
      </div>

      {/* Text Content */}
      <div className="text-center space-y-2 max-w-xs">
        {text && (
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {text}
          </h3>
        )}

        {subtext && (
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {subtext}
            </p>
          </div>
        )}
      </div>

      {/* Subtle Background Glow */}
      <div className="absolute -z-10 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px] rounded-full"></div>
    </div>
  );
};

export default Loader;
