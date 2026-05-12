// components/Faculty/FacultyTimeTableModal.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import axiosInstance from "../../lib/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import TimetablePortalView from "../../pages/Timetableportalview";

const FacultyTimeTableModal = () => {
  const { authUser } = useAuthStore();

  const [scheduleData, setScheduleData] = useState(null);
  const [slotsData, setSlotsData] = useState(null);
  const [presetFaculty, setPresetFaculty] = useState(
    authUser?.faculty_code ?? null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1️⃣  Active session — returns a single object { _id, term, academic_year, isActive }
      const sessRes = await axiosInstance.get(
        API_PATHS.TIMETABLE_PUBLIC.ACTIVE_SESSION,
      );
      const session = sessRes.data?.data;
      if (!session?._id) throw new Error("No active academic session found.");

      // 2️⃣  Schedule + slots (+ profile only if faculty_code missing from auth store)
      const needsProfile = !authUser?.faculty_code;
      const [schedRes, slotsRes, profileRes] = await Promise.all([
        axiosInstance.get(
          `${API_PATHS.TIMETABLE_PUBLIC.SCHEDULE}?session_id=${session._id}`,
        ),
        axiosInstance.get(
          `${API_PATHS.TIMETABLE_PUBLIC.SLOTS}?session_id=${session._id}`,
        ),
        needsProfile
          ? axiosInstance.get(API_PATHS.FACULTY_SELF.PROFILE)
          : Promise.resolve(null),
      ]);

      if (needsProfile && profileRes) {
        const profile = profileRes.data?.data ?? profileRes.data;
        setPresetFaculty(profile?.faculty_code ?? null);
      }

      setScheduleData(schedRes.data?.data ?? null);
      setSlotsData(slotsRes.data?.data ?? null);
    } catch (err) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to load timetable.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [authUser?.faculty_code]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <TimetablePortalView
      scheduleData={scheduleData}
      slotsData={slotsData}
      presetFaculty={presetFaculty}
      isLoading={isLoading}
      error={error}
    />
  );
};

export default FacultyTimeTableModal;
