import React from "react";
import {
  Mail,
  LogOut,
  Camera,
  Calendar,
  Building2,
  UserCircle,
  BadgeCheck,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const Profile = ({ onClose }) => {
  const { authUser, logout } = useAuthStore();
  const navigate = useNavigate();
  // console.log(authUser)

  const handleLogout = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await logout();
      navigate("/login");
      if (onClose) onClose();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const roleConfigs = {
    admin: {
      label: "Department Incharge",
      color: "emerald",
      gradient:
        "from-emerald-500/20 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/5",
      icon: (
        <ShieldCheck
          className="text-emerald-500 dark:text-emerald-400"
          size={16}
        />
      ),
    },
    faculty: {
      label: "Faculty Member",
      color: "blue",
      gradient:
        "from-blue-500/20 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/5",
      icon: (
        <BadgeCheck className="text-blue-500 dark:text-blue-400" size={16} />
      ),
    },
    student: {
      label: "Student",
      color: "amber",
      gradient:
        "from-amber-500/20 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/5",
      icon: (
        <UserCircle className="text-amber-500 dark:text-amber-400" size={16} />
      ),
    },
  };

  // Use authUser data or fallback to NIT Goa defaults
  const userData = authUser || {
    institute: {
      name: "NIT Goa",
      short_name: "NITG",
    },
    username: "Alex Broken",
    email: "alex.broken@nitgoa.ac.in",
    role: "admin",
    invite_status: "accepted",
    createdAt: new Date(),
    _id: "NITG2024001",
  };

  const config = roleConfigs[userData?.role] || {
    label: "User",
    color: "slate",
    gradient:
      "from-slate-500/20 to-slate-500/5 dark:from-slate-500/10 dark:to-slate-500/5",
    icon: (
      <UserCircle className="text-slate-500 dark:text-slate-400" size={16} />
    ),
  };

  const getAvatarUrl = () => {
    if (userData?.profilePicture) {
      return userData.profilePicture;
    }
    const seed = userData?.username || userData?.email || "User";
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f1f5f9`;
  };

  const truncateUsername = (username, maxLength = 20) => {
    if (!username) return "User";
    if (username.length <= maxLength) return username;
    return username.substring(0, maxLength) + "...";
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900">
      {/* Header / Banner */}
      <div
        className={`h-24 bg-gradient-to-br ${config.gradient} relative w-full`}
      />

      <div className="px-4 sm:px-6 md:px-8 pb-6 sm:pb-8">
        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-4 -mt-16 mb-4 sm:mb-6">
          {/* Left Column - Avatar */}
          <div className="flex justify-start">
            <div className="relative group">
              <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 p-1.5 shadow-xl ring-1 ring-slate-200/50 dark:ring-slate-700">
                <img
                  src={getAvatarUrl()}
                  alt="Profile"
                  className="rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-700 h-full w-full object-cover"
                />
              </div>
              <button
                className="absolute -bottom-2 -right-2 p-1.5 sm:p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg sm:rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 hover:scale-110 transition-transform cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Change avatar clicked");
                }}
              >
                <Camera size={12} className="sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column - Sign Out Button */}
          <div className="flex justify-end items-start">
            <button
              onClick={handleLogout}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors border border-rose-100 dark:border-rose-500/20 z-20"
              type="button"
            >
              <LogOut size={14} className="sm:w-4 sm:h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* User Info Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
          {/* Left Column - Name and Email */}
          <div className="space-y-2 sm:space-y-3">
            <div className="space-y-1 sm:space-y-2">
              <h2
                className="text-base sm:text-lg md:text-lg font-bold text-slate-800 dark:text-white break-words"
                title={userData?.username || "User"}
              >
                {truncateUsername(userData?.username, 25)}
              </h2>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Email Address
              </p>
              <div className="flex items-start gap-1.5">
                <Mail
                  size={12}
                  className="text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0"
                />
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm break-all flex-1">
                  {userData?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Role Tag */}
          <div className="flex sm:justify-end items-start">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-${config.color}-50 dark:bg-${config.color}-500/10 text-${config.color}-700 dark:text-${config.color}-300 border border-${config.color}-200 dark:border-${config.color}-500/20 shadow-sm`}
            >
              {config.icon}
              {config.label}
            </span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <InfoCard
            icon={<Building2 className="text-blue-500 dark:text-blue-400" />}
            label="Institution"
            value={userData?.institute?.name || "NIT Goa"}
            subValue={userData?.institute?.short_name || "NITG"}
          />
          <InfoCard
            icon={<Calendar className="text-purple-500 dark:text-purple-400" />}
            label="Member Since"
            value={new Date(
              userData?.createdAt || Date.now(),
            ).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
            subValue="Lifetime Access"
          />
          <InfoCard
            icon={
              <BadgeCheck className="text-emerald-500 dark:text-emerald-400" />
            }
            label="Verification Status"
            value={
              userData?.invite_status === "accepted" ? "Verified" : "Pending"
            }
            subValue="Level 1 Profile"
          />
          <InfoCard
            icon={<MapPin className="text-orange-500 dark:text-orange-400" />}
            label="Primary Role"
            value={config.label}
            subValue="Active Session"
          />
        </div>

        {/* Footer Status */}
        <div className="mt-5 sm:mt-6 md:mt-8 pt-4 sm:pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              System Online
            </span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-medium italic">
            UID: {userData?._id?.slice(-8).toUpperCase() || "NITG2024"}
          </p>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon, label, value, subValue }) => (
  <div className="group p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-all hover:shadow-md dark:hover:shadow-slate-800/50">
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="p-1.5 sm:p-2 bg-white dark:bg-slate-700 rounded-lg sm:rounded-xl shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
        {React.cloneElement(icon, { size: 14, className: "sm:w-4 sm:h-4" })}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-0.5">
          {label}
        </p>
        <p
          className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 truncate"
          title={value}
        >
          {value}
        </p>
        {subValue && (
          <p
            className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate"
            title={subValue}
          >
            {subValue}
          </p>
        )}
      </div>
    </div>
  </div>
);

export default Profile;
