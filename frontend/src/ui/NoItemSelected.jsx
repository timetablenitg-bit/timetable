import React from "react";

const NoItemSelected = ({ icon, message, step, variant = "cyan" }) => {
  // Mapping of variants to specific Tailwind classes
  const variants = {
    cyan: {
      glow: "from-cyan-500/10 to-blue-500/10",
      iconBg: "from-cyan-500 to-blue-600",
      iconShadow: "shadow-cyan-500/30",
      pulse: "bg-cyan-400/20",
    },
    indigo: {
      glow: "from-indigo-500/10 to-purple-500/10",
      iconBg: "from-indigo-500 to-purple-600",
      iconShadow: "shadow-indigo-500/30",
      pulse: "bg-indigo-400/20",
    },
    amber: {
      glow: "from-amber-500/10 to-orange-500/10",
      iconBg: "from-amber-500 to-orange-600",
      iconShadow: "shadow-amber-500/30",
      pulse: "bg-amber-400/20",
    },
    // New Color Variations requested
    green: {
      glow: "from-emerald-500/10 to-teal-500/10",
      iconBg: "from-emerald-500 to-teal-600",
      iconShadow: "shadow-emerald-500/30",
      pulse: "bg-emerald-400/20",
    },
    violet: {
      glow: "from-violet-500/10 to-fuchsia-500/10",
      iconBg: "from-violet-600 to-fuchsia-700",
      iconShadow: "shadow-violet-500/30",
      pulse: "bg-violet-400/20",
    },
    blue: {
      glow: "from-blue-600/10 to-indigo-600/10",
      iconBg: "from-blue-600 to-indigo-700",
      iconShadow: "shadow-blue-500/30",
      pulse: "bg-blue-400/20",
    },
  };

  const selectedVariant = variants[variant] || variants.cyan;

  return (
    <div className="shadow-lg shadow-gray-500 flex flex-col items-center justify-center min-h-[480px] w-full p-8 text-center transition-all duration-300 bg-gray-100 dark:bg-[#00022c] dark:shadow-none rounded-lg">
      <div
        className="relative group flex flex-col items-center justify-center w-full max-w-md p-10 
        bg-white/50 dark:bg-slate-800/10 backdrop-blur-md
        rounded-[2.5rem] border border-white dark:border-slate-700/50
        shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
      >
        {/* Decorative Background Glow */}
        <div
          className={`absolute -z-10 inset-0 bg-gradient-to-tr ${selectedVariant.glow} blur-3xl rounded-full`}
        />

        {/* Icon Container with Pulse Effect */}
        <div className="relative mb-6">
          <div
            className={`absolute inset-0 ${selectedVariant.pulse} blur-2xl rounded-full animate-pulse`}
          />
          <div
            className={`relative w-20 h-20 bg-gradient-to-br ${selectedVariant.iconBg} 
            text-white rounded-2xl flex items-center justify-center 
            shadow-lg ${selectedVariant.iconShadow} transform group-hover:scale-110 transition-transform duration-500`}
          >
            {React.isValidElement(icon)
              ? React.cloneElement(icon, { size: 32, strokeWidth: 2 })
              : icon}
          </div>
        </div>

        {/* Text Content */}
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 mb-2">
          {message}
        </h2>

        <p className="text-slate-500 dark:text-slate-400 max-w-[240px] leading-relaxed">
          {step}
        </p>

        {/* Bottom Decorative Line */}
        <div className="mt-8 w-12 h-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
      </div>
    </div>
  );
};

export default NoItemSelected;
