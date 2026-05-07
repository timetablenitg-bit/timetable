import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, User, MapPin, BookOpen, Clock, Layers } from "lucide-react";

const getContrastYIQ = (hexcolor) => {
  if (!hexcolor) return "text-white";
  hexcolor = hexcolor.replace("#", "");
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "text-slate-900" : "text-white";
};

const Grid = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const textColor = getContrastYIQ(data.Color);
  const borderColor =
    textColor === "text-white" ? "border-white/20" : "border-black/10";
  const iconColor =
    textColor === "text-white" ? "text-white/80" : "text-slate-800/70";

  const handleClose = (e) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  // --- CUSTOM ANIMATION STYLES ---
  // We inject these keyframes to get that specific "Spring Pop" effect
  // mimicking a physical bounce (scale up + slight overshoot + settle)
  const animationStyles = `
    @keyframes spring-pop {
      0% {
        opacity: 0;
        transform: scale(0.9) translateY(10px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    @keyframes fade-in-backdrop {
      0% { opacity: 0; backdrop-filter: blur(0px); }
      100% { opacity: 1; backdrop-filter: blur(4px); }
    }
    .animate-spring-pop {
      animation: spring-pop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-fade-in-backdrop {
      animation: fade-in-backdrop 0.3s ease-out forwards;
    }
  `;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Inject Styles */}
      <style>{animationStyles}</style>

      {/* 1. Backdrop (Smooth Fade + Blur) */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-slate-950/60 animate-fade-in-backdrop"
      />

      {/* 2. The Card (Spring Animation) */}
      <div
        style={{ backgroundColor: data.Color }}
        className={`
          relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden 
          animate-spring-pop ${textColor}
        `}
      >
        {/* Texture Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

        {/* Header */}
        <div
          className={`p-6 border-b ${borderColor} flex justify-between items-start relative z-10`}
        >
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-1">
              {data.Subject_Code}
            </h2>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-black/10 backdrop-blur-md shadow-sm">
              <Layers size={10} />
              {data.Type}
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-full hover:bg-black/10 transition-colors duration-200 ${textColor}`}
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4 relative z-10">
          <div className="col-span-2">
            <div
              className={`flex items-center gap-2 text-xs font-semibold uppercase opacity-70 mb-1 ${textColor}`}
            >
              <BookOpen size={14} /> Subject Name
            </div>
            <p className="text-lg font-medium leading-tight">
              {/* Fallback if Subject_Name is missing */}
              {data.Subject_Name || `Advanced ${data.Subject_Code} Studies`}
            </p>
          </div>

          <div>
            <div
              className={`flex items-center gap-2 text-xs font-semibold uppercase opacity-70 mb-1 ${textColor}`}
            >
              <User size={14} /> Instructor
            </div>
            <p className="font-mono text-base tracking-wide">
              {/* Fallback if Teacher_Name is missing */}
              {data.Teacher_Name || data.Teacher_Code}
            </p>
          </div>

          <div>
            <div
              className={`flex items-center gap-2 text-xs font-semibold uppercase opacity-70 mb-1 ${textColor}`}
            >
              <MapPin size={14} /> Room
            </div>
            <p className="font-mono text-base tracking-wide">
              {data.Room_No || "R-404"}
            </p>
          </div>

          <div className="col-span-2 pt-2 border-t border-black/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className={iconColor} />
                <span className="text-sm font-medium opacity-90">
                  3 Credit Hours
                </span>
              </div>
              <span className="text-xs font-bold opacity-60">AY 2024</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        onClick={() => setIsExpanded(true)}
        style={{ backgroundColor: data.Color }}
        className={`
          relative h-full w-full rounded-md cursor-pointer shadow-sm
          hover:brightness-110 hover:shadow-lg hover:scale-[1.02] active:scale-95
          transition-all duration-300 ease-out flex flex-col justify-center items-center p-1 group
        `}
      >
        <div
          className={`font-bold text-sm md:text-[13px] leading-tight ${textColor} text-center break-words`}
        >
          {data.Subject_Code}
        </div>
        <div className={`h-px w-8 mx-auto my-1 bg-current opacity-20`} />
        <div
          className={`text-[10px] uppercase font-medium tracking-wider ${textColor} opacity-80`}
        >
          {data.Type ? data.Type.slice(0, 3) : "LEC"}
        </div>
      </div>

      {mounted && isExpanded && createPortal(modalContent, document.body)}
    </>
  );
};

export default Grid;
