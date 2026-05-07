import React, { useState, useRef, useEffect } from "react";

const CustomDropdown = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button" // Prevents form submission when clicked
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        <div className="flex items-center gap-2 truncate">
          {label && (
            <span className="text-sm font-semibold text-gray-400 dark:text-gray-500 shrink-0">
              {label}
            </span>
          )}
          <span
            className={`text-sm font-bold truncate ${value ? "text-indigo-600 dark:text-indigo-400" : "text-gray-800 dark:text-gray-200"}`}
          >
            {value || placeholder}
          </span>
        </div>

        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-xl z-50 animate-fade-in-up origin-top max-h-60 overflow-y-auto custom-scrollbar">
          <ul className="py-1">
            {options.map((opt, idx) => {
              // Allows passing either an array of strings OR an array of objects {label, value}
              const optLabel = typeof opt === "object" ? opt.label : opt;
              const optValue = typeof opt === "object" ? opt.value : opt;

              return (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => handleSelect(optValue)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between
                      ${
                        value === optValue
                          ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                      }
                    `}
                  >
                    {optLabel}
                    {value === optValue && (
                      <svg
                        className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
