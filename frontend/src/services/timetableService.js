import axiosInstance from "../lib/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

// Existing APIs
export const generateTimetableApi = (session_id) =>
  axiosInstance.get(API_PATHS.TIMETABLE.GENERATE, {
    params: { session_id },
  });

export const evaluateTimetableApi = (timetable) =>
  axiosInstance.post(API_PATHS.TIMETABLE.EVALUATE, { timetable });

export const getGeneratedSlotsApi = (session_id) =>
  axiosInstance.get(API_PATHS.TIMETABLE.SLOTS, {
    params: { session_id },
  });

export const getActiveScheduleApi = (session_id) =>
  axiosInstance.get(API_PATHS.TIMETABLE.SCHEDULE, {
    params: { session_id },
  });

export const reworkTimetableApi = (payload) =>
  axiosInstance.post(API_PATHS.TIMETABLE.REWORK, payload);

export const getRegistrationOverviewApi = (sessionId) =>
  axiosInstance.get(API_PATHS.ADMIN.COURSE_REGISTRATION_OVERVIEW(sessionId));

export const getBacklogStatsApi = (sessionId) =>
  axiosInstance.get(API_PATHS.ADMIN.BACKLOG_STATS(sessionId));

// ================= SLOT MANAGEMENT =================

export const bulkUpdateSlotsApi = (session_id, slots) =>
  axiosInstance.put(API_PATHS.TIMETABLE.BULK_UPDATE(session_id), { slots });

export const createSlotApi = (
  session_id,
  { slot_name, slot_type = "lecture", entries = [] },
) =>
  axiosInstance.post(API_PATHS.TIMETABLE.CREATE_SLOT(session_id), {
    slot_name,
    slot_type,
    entries,
  });

export const patchSlotApi = (session_id, slot_name, updates) =>
  axiosInstance.patch(
    API_PATHS.TIMETABLE.PATCH_SLOT(session_id, slot_name),
    updates,
  );

export const deleteSlotApi = (session_id, slot_name) =>
  axiosInstance.delete(API_PATHS.TIMETABLE.DELETE_SLOT(session_id, slot_name));

// ================= SCHEDULE MANAGEMENT =================

export const saveScheduleApi = (timetable_id, grid) =>
  axiosInstance.put(API_PATHS.TIMETABLE.SAVE_SCHEDULE(timetable_id), { grid });

export const evaluateScheduleApi = (timetable_id, grid) =>
  axiosInstance.post(API_PATHS.TIMETABLE.EVALUATE_SCHEDULE(timetable_id), {
    grid,
  });

// ================= EXPORT =================

export const exportTimetableExcelApi = (generation_id) =>
  axiosInstance.get(API_PATHS.EXPORT.EXCEL(generation_id), {
    responseType: "blob",
  });
