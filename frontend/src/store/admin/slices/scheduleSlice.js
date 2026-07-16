import axiosInstance from "../../../lib/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";

// ====================== Active Schedule Editing ======================
// Mutates activeScheduleData / generatedSlotsData (owned by
// timetableEngineSlice) via get()/set() against the merged store.
export const createScheduleSlice = (set, get) => ({
  isSavingSchedule: false,
  isEvaluatingSchedule: false,
  scheduleError: null,
  isSavingTrack: false,
  isSavingBatchWeek: false,
  batchCellError: null,
  scheduleWarnings: [],
  isFetchingAvailability: false,
  availabilityError: null,

  saveSchedule: async (timetable_id, gridObj) => {
    set({ isSavingSchedule: true, scheduleError: null });
    try {
      const response = await axiosInstance.post(
        API_PATHS.TIMETABLE.SAVE_SCHEDULE(timetable_id),
        { grid: gridObj },
      );
      const { score, warnings } = response.data.data;
      set((state) => ({
        activeScheduleData: state.activeScheduleData
          ? { ...state.activeScheduleData, grid: gridObj, score }
          : state.activeScheduleData,
        generatedSlotsData: state.generatedSlotsData
          ? { ...state.generatedSlotsData, score }
          : state.generatedSlotsData,
        isSavingSchedule: false,
      }));
      return { ok: true, score, warnings: warnings ?? [] };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to save schedule";
      set({ scheduleError: message, isSavingSchedule: false });
      return { ok: false, message };
    }
  },

  fetchAvailability: async (item_id) => {
    set({ isFetchingAvailability: true, availabilityError: null });
    try {
      const response = await axiosInstance.get(
        API_PATHS.TIMETABLE.MANUAL_REVIEW_AVAILABILITY(item_id),
      );
      set({ isFetchingAvailability: false });
      return { ok: true, data: response.data.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch availability";
      set({ availabilityError: message, isFetchingAvailability: false });
      return { ok: false, message };
    }
  },

  setBatchTrack: async (timetable_id, { day, batch_id, track }) => {
    set({ isSavingTrack: true, scheduleError: null });
    try {
      const response = await axiosInstance.patch(
        API_PATHS.TIMETABLE.SET_TRACK(timetable_id),
        { day, batch_id, track },
      );
      set((state) => ({
        activeScheduleData: state.activeScheduleData
          ? {
              ...state.activeScheduleData,
              track_assignments: response.data.data.track_assignments,
            }
          : state.activeScheduleData,
        isSavingTrack: false,
      }));
      return { ok: true };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update track";
      set({ scheduleError: message, isSavingTrack: false });
      return { ok: false, message };
    }
  },

  saveBatchWeek: async (timetable_id, payload) => {
    set({ isSavingBatchWeek: true, batchCellError: null });
    try {
      const response = await axiosInstance.patch(
        API_PATHS.TIMETABLE.SAVE_BATCH_WEEK(timetable_id),
        payload,
      );
      const { grid, warnings } = response.data.data;
      set((state) => ({
        activeScheduleData: state.activeScheduleData
          ? { ...state.activeScheduleData, grid }
          : state.activeScheduleData,
        scheduleWarnings: warnings ?? [],
        isSavingBatchWeek: false,
      }));
      return { ok: true, warnings: warnings ?? [] };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to save timetable changes";
      set({ batchCellError: message, isSavingBatchWeek: false });
      return { ok: false, message };
    }
  },
});
