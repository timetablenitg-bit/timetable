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
      // 1️⃣ Active session — returns a single object { _id, term, academic_year, isActive }
      let session = null;
      try {
        const sessRes = await axiosInstance.get(
          API_PATHS.TIMETABLE_PUBLIC.ACTIVE_SESSION,
        );
        session = sessRes.data?.data ?? null;
      } catch (err) {
        // No active session is a normal empty state, not an error
        if (err?.response?.status !== 404) throw err;
      }

      if (!session?._id) {
        // Nothing to fetch — just show the empty state, no error
        setPresetBatch(null);
        setScheduleData(null);
        setSlotsData(null);
        return;
      }

      // 2️⃣ Batch + schedule + slots in parallel — each handled independently
      // so a missing schedule/slots doesn't kill the whole page
      const safeGet = async (url) => {
        try {
          const res = await axiosInstance.get(url);
          return res.data?.data ?? res.data ?? null;
        } catch (err) {
          if (err?.response?.status === 404) return null;
          throw err;
        }
      };

      const [bp, sched, slots] = await Promise.all([
        safeGet(API_PATHS.STUDENT.MY_BATCH),
        safeGet(
          `${API_PATHS.TIMETABLE_PUBLIC.SCHEDULE}?session_id=${session._id}`,
        ),
        safeGet(
          `${API_PATHS.TIMETABLE_PUBLIC.SLOTS}?session_id=${session._id}`,
        ),
      ]);

      const batchName =
        typeof bp === "string" ? bp : (bp?.name ?? bp?.batch_name ?? null);

      setPresetBatch(batchName);
      setScheduleData(sched);
      setSlotsData(slots);
    } catch (err) {
      // Only genuine failures (5xx, network errors, etc.) land here
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
