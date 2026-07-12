import React, { useState, useEffect } from "react";
// Removed the external import causing the error
import { Menu, X, ArrowRight, Calendar, Clock, Zap } from "lucide-react";

const HomePage = () => {
  // Inline the document title logic
  useEffect(() => {
    document.title = "Get Started | ATMS";
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-white relative overflow-x-hidden selection:bg-cyan-500/30">
      {/* 🌟 Ambient Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* 🌟 Navbar with Glassmorphism */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isMenuOpen
            ? "bg-gray-900"
            : "bg-gray-900/60 backdrop-blur-xl border-b border-white/5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <a href="/" className="flex items-center gap-2 group">
              <div className="h-12 w-12 relative overflow-hidden rounded-xl bg-white/5 p-1 border border-white/10 group-hover:border-cyan-500/50 transition-colors">
                <img
                  src="images/NavbaarLogoWithNoBackgrond.png"
                  alt="ATTS Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML =
                      '<span class="text-2xl">🎓</span>';
                  }}
                />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:from-cyan-400 group-hover:to-blue-400 transition-all duration-300">
                ATMS
              </span>
            </a>

            {/* Desktop Menu Links */}
            <div className="hidden md:flex items-center space-x-8">
              {["Documentation", "About Us", "Contact"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(" ", "")}`}
                  className="text-sm font-medium text-gray-300 hover:text-cyan-400 transition-colors duration-300 relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-500 transition-all duration-300 group-hover:w-full"></span>
                </a>
              ))}
            </div>

            {/* Desktop Login/Signup */}
            <div className="hidden md:flex items-center space-x-4">
              <a
                href="/login"
                className="group relative px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-semibold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 -skew-x-12 -translate-x-full" />
                <span>Get Started</span>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`md:hidden absolute w-full bg-gray-900 border-b border-gray-800 transition-all duration-300 ease-in-out overflow-hidden ${
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 pt-2 pb-6 space-y-2">
            {["Documentation", "About Us", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "")}`}
                className="block py-3 px-4 rounded-lg text-base font-medium text-gray-300 hover:bg-gray-800 hover:text-cyan-400 transition-all"
              >
                {item}
              </a>
            ))}
            <div className="pt-4 grid grid-cols-2 gap-3">
              <a
                href="/login"
                className="flex justify-center py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 font-medium transition-colors"
              >
                Login
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* 🌟 Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-6 animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          Next Gen Scheduling
        </div>

        {/* Main Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
          <span className="block text-white mb-2">Academic Scheduling</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
            Reimagined.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-lg md:text-xl text-gray-400 mb-10 leading-relaxed">
          The Academic Timetable Management System (ATMS) automates complexity.
          Create conflict-free schedules, manage resources, and optimize
          academic time with AI-driven precision.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <a
            href="/login"
            className="group flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
          >
            Start Now
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </a>
          <a
            href="#documentation"
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-800/50 border border-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all backdrop-blur-sm"
          >
            Read Docs
          </a>
        </div>

        {/* Features Grid (Quick Preview) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-5xl">
          {[
            {
              icon: Calendar,
              title: "Smart Scheduling",
              desc: "Automated conflict detection algorithms.",
            },
            {
              icon: Clock,
              title: "Real-time Updates",
              desc: "Instant notifications for timetable changes.",
            },
            {
              icon: Zap,
              title: "Effortless Setup",
              desc: "Get started in minutes, not days.",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-gray-800/30 border border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/50 transition-colors text-left group"
            >
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="text-cyan-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
