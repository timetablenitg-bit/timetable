import React, { useEffect, useState } from "react";
import {
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  ListChevronsDownUp,
  Home,
  FileText,
  Info,
} from "lucide-react";
import useThemeStore from "../store/useHomeStore";
import Notification from "./Notification";
import Profile from "./Profile";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const InchargeNavbaar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openNotification, setOpenNotification] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);

  const { checkAuth, authUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  // Function to get dashboard path based on user role
  const getDashboardPath = () => {
    const role = authUser?.role;
    console.log("User role:", role); // Debug log
    switch (role) {
      case "admin":
        return "/admin";
      case "faculty":
        return "/faculty";
      case "student":
        return "/student";
      default:
        console.log("No role found, redirecting to login");
        return "/login";
    }
  };

  // Handle navigation with role-based routing
  const handleNavigation = (href, linkName) => {
    console.log("Navigating to:", href, "Link:", linkName); // Debug log

    if (linkName === "Home") {
      // If it's the home link, redirect based on role
      const dashboardPath = getDashboardPath();
      console.log("Redirecting to dashboard:", dashboardPath);
      navigate(dashboardPath);
    } else if (href && href !== "#") {
      navigate(href);
    }
  };

  // Handle logo click
  const handleLogoClick = () => {
    const dashboardPath = getDashboardPath();
    console.log("Logo clicked, redirecting to:", dashboardPath);
    navigate(dashboardPath);
  };

  // Added Lucide icons to the navLinks array
  const navLinks = [
    { name: "Home", href: "/incharge", icon: <Home size={16} /> },
    { name: "About Us", href: "#", icon: <Info size={16} /> },
    {
      name: "Documentation",
      href: "/doc",
      icon: <FileText size={16} />,
    },
  ];

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="relative">
      <nav className="bg-white dark:bg-gray-900  border border-gray-300 dark:border-gray-800 px-2 py-3 transition-colors duration-300">
        <div className="flex items-center justify-between">
          {/* Left Side: Title & Logo */}
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-5 cursor-pointer group"
          >
            <div className="rounded-lg text-blue-600 dark:text-blue-400">
              <img
                src="images/logo_nitgoa.png"
                alt=""
                className="h-7 w-7 object-cover rounded-full"
                title="National Institute Of Technology, Goa"
              />
            </div>
            <span
              className="text-lg font-bold text-gray-900 dark:text-white"
              title="National Institute Of Technology, Goa"
            >
              NIT GOA
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavigation(link.href, link.name)}
                className="relative flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 group cursor-pointer"
              >
                {link.icon}
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 group-hover:w-full rounded-full"></span>
              </button>
            ))}

            {/* Theme Toggle */}
            <div className="relative group/theme">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-300 cursor-pointer"
              >
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 invisible group-hover/theme:opacity-100 group-hover/theme:visible transition-all duration-200 pointer-events-none z-50">
                <div className="bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap shadow-xl">
                  Switch theme
                </div>
              </div>
            </div>

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
              <span
                className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-blue-600 transition-colors max-w-[150px] truncate"
                title={authUser?.username || "My Profile"}
              >
                {authUser?.username?.length > 15
                  ? `${authUser.username.substring(0, 15)}...`
                  : authUser?.username || "My Profile"}
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

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X size={24} />
              ) : (
                <ListChevronsDownUp size={24} />
              )}
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
              <button
                key={link.name}
                onClick={() => {
                  handleNavigation(link.href, link.name);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 w-full text-left"
              >
                {link.icon}
                {link.name}
              </button>
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
          </div>
        </div>
      </nav>

      {/* --- MODALS --- */}
      <Notification open={openNotification} setOpen={setOpenNotification} />

      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${
          openProfile ? "visible" : "invisible pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
            openProfile ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpenProfile(false)}
        />

        <div
          className={`relative w-full max-w-2xl transform transition-all duration-[600ms] ease-out ${
            openProfile
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-0 translate-y-10"
          }`}
        >
          <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 z-[110]">
            <button
              onClick={() => setOpenProfile(false)}
              className="p-2 sm:p-2.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-full shadow-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl bg-white dark:bg-slate-900">
            <Profile onClose={() => setOpenProfile(false)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InchargeNavbaar;
