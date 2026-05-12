// components/TableModal.jsx

import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "../lib/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import TimetablePortalView from "../pages/Timetableportalview";

const TableModal = () => {
  const [scheduleData, setScheduleData] = useState(null);
  const [slotsData, setSlotsData] = useState(null);
  const [presetBatch, setPresetBatch] = useState(null);
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

      // 2️⃣  Batch + schedule + slots in parallel
      const [batchRes, schedRes, slotsRes] = await Promise.all([
        axiosInstance.get(API_PATHS.STUDENT.MY_BATCH),
        axiosInstance.get(
          `${API_PATHS.TIMETABLE_PUBLIC.SCHEDULE}?session_id=${session._id}`,
        ),
        axiosInstance.get(
          `${API_PATHS.TIMETABLE_PUBLIC.SLOTS}?session_id=${session._id}`,
        ),
      ]);

      // MY_BATCH may return { data: "CSE-5" } or { data: { name: "CSE-5" } }
      const bp = batchRes.data?.data ?? batchRes.data;
      const batchName =
        typeof bp === "string" ? bp : (bp?.name ?? bp?.batch_name ?? null);

      setPresetBatch(batchName);
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
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <TimetablePortalView
      scheduleData={scheduleData}
      slotsData={slotsData}
      presetBatch={presetBatch}
      isLoading={isLoading}
      error={error}
    />
  );
};

export default TableModal;
