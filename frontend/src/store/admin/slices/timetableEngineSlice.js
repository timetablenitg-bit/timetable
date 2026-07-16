import axiosInstance from "../../../lib/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";

// ====================== Timetable Engine ======================
// NOTE: generatedSlotsData, activeScheduleData, isFetchingSlots, and
// isFetchingSchedule were used via get()/set() in the original store but
// never declared in initial state. Declared explicitly here.
export const createTimetableEngineSlice = (set) => ({
  isGeneratingTimetable: false,
  isEvaluatingTimetable: false,
  timetableData: null, // { slots, timetable, score }
  evaluationScore: null, // only for evaluation mode (drag-drop)

  generatedSlotsData: null,
  activeScheduleData: null,
  isFetchingSlots: false,
  isFetchingSchedule: false,

  generateTimetable: async (session_id) => {
    set({ isGeneratingTimetable: true, error: null, timetableData: null });

    try {
      const response = await axiosInstance.post(
        API_PATHS.TIMETABLE.GENERATE,
        {},
        { params: { session_id } },
      );

      set({
        timetableData: response.data.data, // { slots, timetable, score, manual_review_count, suggested_track_assignments, meta }
        isGeneratingTimetable: false,
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to generate timetable";
      set({ error: message, isGeneratingTimetable: false });
      throw new Error(message);
    }
  },

  fetchGeneratedSlots: async (session_id) => {
    set({ isFetchingSlots: true, error: null });
    try {
      const response = await axiosInstance.get(API_PATHS.TIMETABLE.SLOTS, {
        params: { session_id },
      });
      set({ generatedSlotsData: response.data.data, isFetchingSlots: false });
    } catch (error) {
      const status = error.response?.status;
      // 404 just means not generated yet — not a hard error
      if (status === 404) {
        set({ generatedSlotsData: null, isFetchingSlots: false });
      } else {
        set({
          error: error.response?.data?.message || "Failed to fetch slots",
          isFetchingSlots: false,
        });
      }
    }
  },

  fetchActiveSchedule: async (session_id) => {
    set({ isFetchingSchedule: true, error: null });
    try {
      const response = await axiosInstance.get(API_PATHS.TIMETABLE.SCHEDULE, {
        params: { session_id },
      });
      set({
        activeScheduleData: response.data.data,
        isFetchingSchedule: false,
      });
    } catch (error) {
      const status = error.response?.status;
      if (status === 404) {
        set({ activeScheduleData: null, isFetchingSchedule: false });
      } else {
        set({
          error: error.response?.data?.message || "Failed to fetch schedule",
          isFetchingSchedule: false,
        });
      }
    }
  },

  clearTimetableData: () => {
    set({
      timetableData: null,
      isGeneratingTimetable: false,
    });
  },

  fetchRegistrationOverview: async (sessionId) => {
    try {
      const { data } = await axiosInstance.get(
        API_PATHS.ADMIN.COURSE_REGISTRATION_OVERVIEW(sessionId),
      );
      return data.data; // array of { batch, students[] }
    } catch (err) {
      console.error("fetchRegistrationOverview failed:", err);
      return [];
    }
  },

  fetchBacklogStats: async (sessionId) => {
    try {
      const { data } = await axiosInstance.get(
        API_PATHS.ADMIN.BACKLOG_STATS(sessionId),
      );
      return data.data; // [{ course, count }]
    } catch (err) {
      console.error("fetchBacklogStats failed:", err);
      return [];
    }
  },

  exportTimetableExcel: async (generation_id, sessionTerm) => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.EXPORT.EXCEL(generation_id),
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `timetable_${sessionTerm ?? generation_id}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      return { ok: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to export timetable";
      return { ok: false, message };
    }
  },
});
