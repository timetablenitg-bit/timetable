import React from "react";

const CustomLoader = ({ variant = "cyan" }) => {
  const colorMap = {
    cyan: "#06b6d4",
    indigo: "#6366f1",
    voilet: "#8b5cf6",
    green: "#10b981",
    blue: "#3b82f6",
    amber: "#f59e0b",
  };

  const selectedColor = colorMap[variant] || colorMap.cyan;

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="loader-cross" style={{ "--clr": selectedColor }} />

      {/* Refined Loading Text */}
      <div className="mt-12 flex flex-col items-center gap-1">
        <p
          className="text-[10px] font-bold tracking-[0.5em] uppercase opacity-80"
          style={{ color: selectedColor }}
        >
          Processing
        </p>
        <div
          className="h-1 w-12 rounded-full opacity-20"
          style={{ backgroundColor: selectedColor }}
        />
      </div>
    </div>
  );
};

export default CustomLoader;
