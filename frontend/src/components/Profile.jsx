import React, { useEffect } from "react";
import {
  Mail,
  Phone,
  MapPin,
  LogOut,
  Camera,
  Calendar,
  LayoutGrid,
  Award,
  CheckCircle2,
  X,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const Profile = ({ onClose }) => {
  const { checkAuth, authUser, logout } = useAuthStore();
  // const user = {
  //   name: "Dr. Alex Broken",
  //   role: "Department Incharge",
  //   email: "alex.broken@university.edu",
  //   phone: "+1 555-0123",
  //   location: "Academic Block A",
  //   joined: "Joined 2022",
  //   avatar:
  //     "https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=f1f5f9",
  // };
  const handleLogout = () => {
    logout();
    onClose();
  };
  useEffect(() => {
    if (!authUser) {
      checkAuth();
    }
  });

  return (
    // overflow-hidden prevents the scrollbar on the modal itself
    <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 transition-all duration-900">
      {/* Upper Section: Soft Mint Background */}
      <div className="bg-[#f0f9f4] dark:bg-emerald-950/20 px-8 pt-10 pb-20 relative">
        <div className="flex justify-between items-center p-5">
          <div className="space-y-1">
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-widest rounded-full">
              System Administrator
            </span>
            <h1 className="text-3xl font-medium text-slate-800 dark:text-white tracking-tight">
              {authUser ? authUser.username : "My Profile"}
            </h1>
            <p className="text-slate-500 dark:text-emerald-200/50 text-sm font-medium">
              {authUser ? authUser.role : "System Administrator"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 p-3 bg-white dark:bg-slate-800 text-rose-500 rounded-2xl shadow-sm hover:bg-rose-50 transition-all active:scale-95 cursor-pointer"
          >
            <LogOut size={18} />
            <span className="text-xs font-bold hidden sm:block">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Lower Section: Content overlapping the top */}
      <div className="px-8 pb-10 -mt-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Avatar & Key Badge */}
          <div className="md:col-span-4 flex flex-col items-center">
            <div className="relative">
              <div className="h-32 w-32 rounded-[2rem] bg-white dark:bg-slate-800 p-2 shadow-xl border border-emerald-50">
                <img
                  src={authUser.avatar}
                  alt="Avatar"
                  className="rounded-[1.5rem] bg-slate-50 dark:bg-slate-700 h-full w-full object-cover"
                />
              </div>
              <button className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 text-white rounded-xl border-4 border-white dark:border-slate-900 shadow-lg">
                <Camera size={14} />
              </button>
            </div>

            <div className="mt-6 w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="h-10 w-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
                <Award size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  Status
                </p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Verified Member
                </p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="md:col-span-8 space-y-6 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
              <InfoBox icon={<Mail />} label="Email" value={authUser.email} />
              <InfoBox icon={<Phone />} label="Phone" value={authUser.phone} />
              <InfoBox
                icon={<MapPin />}
                label="Office"
                value={authUser.location}
              />
              <InfoBox
                icon={<Calendar />}
                label="Tenure"
                value={authUser.joined}
              />
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900"
                  />
                ))}
                <div className="h-8 px-2 flex items-center text-[10px] font-bold text-slate-400 italic">
                  + 12 Faculty Managed
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 size={14} />
                Live Sync Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Small Info Component
const InfoBox = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="text-emerald-500/70 mt-1">
      {React.cloneElement(icon, { size: 16 })}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
        {value}
      </p>
    </div>
  </div>
);

export default Profile;
