import React, { useEffect, useState } from "react";
import { Menu, X, GraduationCap, Bell, Sun, Moon } from "lucide-react";
import useThemeStore from "../store/useHomeStore";
import Notification from "./Notification";
import Profile from "./Profile";
import { useAuthStore } from "../store/useAuthStore";

const InchargeNavbaar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openNotification, setOpenNotification] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);

  const { checkAuth, authUser } = useAuthStore();

  const { theme, toggleTheme } = useThemeStore();

  const navLinks = [
    { name: "Home", href: "/incharge" },
    { name: "About Us", href: "#" },
    { name: "Documentation", href: "#" },
  ];

  useEffect(() => {
    checkAuth();
    // console.log(authUser);
  }, [checkAuth]);

  return (
    <div>
      <nav className="bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800 px-5 py-2 transition-colors duration-300">
        <div className="flex items-center justify-between">
          {/* Left Side: Title & Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer group">
            <div className=" bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 ">
              <img
                src="images\Logo.png"
                alt=""
                className="h-12 w-12 object-cover"
              />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Chronex
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="relative text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 group-hover:w-full rounded-full"></span>
              </a>
            ))}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="group relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-300 cursor-pointer"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              <span className="absolute top-12 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all duration-200 bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap shadow-xl z-50">
                Switch theme
              </span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => setOpenNotification(true)}
              className="relative text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-2 cursor-pointer"
            >
              <div className="relative">
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative h-2.5 w-2.5 bg-red-500 rounded-full"></span>
                </span>
              </div>
              <span className="text-sm font-medium">Inbox</span>
            </button>

            {/* Desktop User profile trigger */}
            <div
              onClick={() => setOpenProfile(true)}
              className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700 cursor-pointer group"
            >
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-blue-600 transition-colors">
                {authUser ? authUser.username : "My Profile"}
              </span>
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden ring-2 ring-transparent group-hover:ring-blue-400 transition-all">
                <img
                  src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=e2e8f0"
                  alt="User"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Mobile Right Side Controls */}
          <div className="md:hidden flex items-center gap-2">
            {/* 🔥 Mobile Notification Icon (Moved here) */}
            <button
              onClick={() => setOpenNotification(true)}
              className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative h-2 w-2 bg-red-500 rounded-full"></span>
              </span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen
              ? "max-h-[400px] opacity-100 mt-3"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col space-y-2 pt-2 pb-3 border-t border-gray-100 dark:border-gray-800">
            {/* Profile Link in Mobile */}
            <button
              onClick={() => {
                setOpenProfile(true);
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-left"
            >
              <div className="h-6 w-6 rounded-full overflow-hidden">
                <img
                  src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix"
                  alt="User"
                />
              </div>
              My Profile
            </button>

            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                {link.name}
              </a>
            ))}

            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-left"
            >
              {theme === "light" ? (
                <>
                  <Moon size={18} /> Dark Mode
                </>
              ) : (
                <>
                  <Sun size={18} /> Light Mode
                </>
              )}
            </button>
            {/* Note: Notification removed from dropdown since it's now in the header */}
          </div>
        </div>
      </nav>

      {/* --- MODALS --- */}
      <Notification open={openNotification} setOpen={setOpenNotification} />

      {/* Profile Modal Logic */}
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 ${
          openProfile ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            openProfile ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpenProfile(false)}
        ></div>

        <div
          className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl transform transition-all duration-[600ms] ${
            openProfile
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-0 translate-y-10"
          }`}
        >
          <button
            onClick={() => setOpenProfile(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/10 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-black/20 dark:hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>

          <Profile />
        </div>
      </div>
    </div>
  );
};

export default InchargeNavbaar;
