import React from "react";
import { Mail, LogOut, Camera } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useStudentStore } from "../store/useStudentStore";
import { useNavigate } from "react-router-dom";

const Profile = ({ onClose }) => {
  const { authUser, logout } = useAuthStore();
  const { currentRegistration } = useStudentStore();
  const navigate = useNavigate();

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

  const roleLabels = {
    admin: "Department Incharge",
    faculty: "Faculty Member",
    student: "Student",
  };

  const userData = authUser;

  const roleLabel = roleLabels[userData?.role] || "User";
  const isStudent = userData?.role === "student";
  const rollLabel = isStudent ? "Roll No." : "Faculty Code";
  const rollValue = userData?.email
    ? userData.email.split("@")[0].toUpperCase()
    : "NaN";

  const getAvatarUrl = () => {
    if (userData?.profilePicture) return userData.profilePicture;
    const seed = userData?.username || userData?.email || "User";
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f1f5f9`;
  };

  const truncateUsername = (username, maxLength = 25) => {
    if (!username) return "User";
    if (username.length <= maxLength) return username;
    return username.substring(0, maxLength) + "...";
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 px-6 py-8 sm:px-8">
      {/* Top row: avatar + sign out */}
      <div className="flex items-start justify-between mb-6">
        <div className="relative group">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">
            <img
              src={getAvatarUrl()}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </div>
          <button
            className="absolute -bottom-1 -right-1 p-1.5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Change avatar clicked");
            }}
            aria-label="Change avatar"
          >
            <Camera size={12} />
          </button>
        </div>

        <button
          onClick={handleLogout}
          type="button"
          className="cursor-pointer flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg font-semibold text-xs sm:text-sm shadow-sm shadow-red-600/30 transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>

      {/* Name, role, email */}
      <div className="mb-8">
        <div className="flex items-center gap-2 flex-wrap">
          <h2
            className="text-lg font-semibold text-slate-900 dark:text-white"
            title={userData?.username || "User"}
          >
            {truncateUsername(userData?.username)}
          </h2>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            {roleLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 text-slate-500 dark:text-slate-400">
          <Mail size={13} />
          <p className="text-sm break-all">{userData?.email}</p>
        </div>
      </div>

      {/* Details */}
      <dl className="space-y-3 text-sm border-t border-slate-100 dark:border-slate-800 pt-5">
        <Row label={rollLabel} value={rollValue} />
        <Row label="Department" value={userData?.department || "NaN"} />
        {isStudent && (
          <>
            <Row
              label="Current Semester"
              value={
                userData?.current_sem ? `Sem ${userData.current_sem}` : "NaN"
              }
            />
            <Row
              label="Registration Status"
              value={currentRegistration?.status ?? "NaN"}
            />
          </>
        )}
      </dl>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <dt className="text-slate-400 dark:text-slate-500">{label}</dt>
    <dd className="text-slate-700 dark:text-slate-200 font-medium">{value}</dd>
  </div>
);

export default Profile;
