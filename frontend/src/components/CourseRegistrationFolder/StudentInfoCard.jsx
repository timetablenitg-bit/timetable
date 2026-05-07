import React from "react";
import {
  User,
  Mail,
  Hash,
  GraduationCap,
  Calendar,
  MapPin,
  Phone,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

const StudentInfoCard = () => {
  const { authUser } = useAuthStore();
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <User size={16} className="text-indigo-600" />
          Student Information
        </h3>
      </div>
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex-shrink-0">
              <User
                size={14}
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Full Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {authUser.username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex-shrink-0">
              <Mail
                size={14}
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {authUser.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex-shrink-0">
              <Hash
                size={14}
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Roll Number
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                Render roll number
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex-shrink-0">
              <Hash
                size={14}
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cuurent Semester
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {authUser.current_sem}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex-shrink-0">
              <GraduationCap
                size={14}
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Department
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {authUser.department}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex-shrink-0">
              <Calendar
                size={14}
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Academic Year
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {Math.ceil(authUser.current_sem / 2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentInfoCard;
