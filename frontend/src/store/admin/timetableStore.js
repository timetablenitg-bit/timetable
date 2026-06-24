import { create } from "zustand";

import {
  generateTimetableApi,
  evaluateTimetableApi,
  getGeneratedSlotsApi,
  getActiveScheduleApi,
  reworkTimetableApi,
  getRegistrationOverviewApi,
  getBacklogStatsApi,
  bulkUpdateSlotsApi,
  createSlotApi,
  patchSlotApi,
  deleteSlotApi,
  saveScheduleApi,
  evaluateScheduleApi,
  exportTimetableExcelApi,
} from "../../services/timetableService";

const useTimetableStore = create((set) => ({
  // Loading States
  isGeneratingTimetable: false,
  isEvaluatingTimetable: false,
  isFetchingSlots: false,
  isFetchingSchedule: false,
  isSaving: false,

  // Data
  timetableData: null,
  evaluationScore: null,
  generatedSlotsData: null,
  activeScheduleData: null,

  isSavingSlots: false,
  slotsError: null,

  isSavingSchedule: false,
  isEvaluatingSchedule: false,
  scheduleError: null,

  // Error
  error: null,

  clearError: () => set({ error: null }),

  // Generate Timetable
  generateTimetable: async (session_id) => {
    set({
      isGeneratingTimetable: true,
      error: null,
      timetableData: null,
    });

    try {
      const response = await generateTimetableApi(session_id);

      set({
        timetableData: response.data.data,
        isGeneratingTimetable: false,
      });
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to generate timetable";

      set({
        error: message,
        isGeneratingTimetable: false,
      });

      throw new Error(message);
    }
  },

  // Evaluate Timetable
  evaluateTimetable: async (timetable) => {
    set({
      isEvaluatingTimetable: true,
      error: null,
      evaluationScore: null,
    });

    try {
      const response = await evaluateTimetableApi(timetable);

      set({
        evaluationScore: response.data.data?.score ?? null,
        isEvaluatingTimetable: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to evaluate timetable",
        isEvaluatingTimetable: false,
      });
    }
  },

  // Fetch Generated Slots
  fetchGeneratedSlots: async (session_id) => {
    set({
      isFetchingSlots: true,
      error: null,
    });

    try {
      const response = await getGeneratedSlotsApi(session_id);

      set({
        generatedSlotsData: response.data.data,
        isFetchingSlots: false,
      });
    } catch (error) {
      const status = error.response?.status;

      if (status === 404) {
        set({
          generatedSlotsData: null,
          isFetchingSlots: false,
        });
      } else {
        set({
          error: error.response?.data?.message || "Failed to fetch slots",
          isFetchingSlots: false,
        });
      }
    }
  },

  // Fetch Active Schedule
  fetchActiveSchedule: async (session_id) => {
    set({
      isFetchingSchedule: true,
      error: null,
    });

    try {
      const response = await getActiveScheduleApi(session_id);

      set({
        activeScheduleData: response.data.data,
        isFetchingSchedule: false,
      });
    } catch (error) {
      const status = error.response?.status;

      if (status === 404) {
        set({
          activeScheduleData: null,
          isFetchingSchedule: false,
        });
      } else {
        set({
          error: error.response?.data?.message || "Failed to fetch schedule",
          isFetchingSchedule: false,
        });
      }
    }
  },

  // Rework Timetable
  reworkTimetable: async ({ timetable_id, timetable, slots, locked_cells }) => {
    set({
      isSaving: true,
      error: null,
    });

    try {
      const response = await reworkTimetableApi({
        timetable_id,
        timetable,
        slots,
        locked_cells,
      });

      set({
        isSaving: false,
      });

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      const message = error.response?.data?.message || "Rework failed";

      set({
        error: message,
        isSaving: false,
      });

      return {
        success: false,
        message,
      };
    }
  },

  // Registration Overview
  fetchRegistrationOverview: async (sessionId) => {
    try {
      const { data } = await getRegistrationOverviewApi(sessionId);

      return data.data;
    } catch (err) {
      console.error("fetchRegistrationOverview failed:", err);
      return [];
    }
  },

  // Backlog Stats
  fetchBacklogStats: async (sessionId) => {
    try {
      const { data } = await getBacklogStatsApi(sessionId);

      return data.data;
    } catch (err) {
      console.error("fetchBacklogStats failed:", err);
      return [];
    }
  },

  // Reset
  clearTimetableData: () => {
    set({
      timetableData: null,
      evaluationScore: null,
      generatedSlotsData: null,
      activeScheduleData: null,
      isGeneratingTimetable: false,
      isEvaluatingTimetable: false,
    });
  },

  bulkUpdateSlots: async (session_id, slots) => {
    set({ isSavingSlots: true, slotsError: null });

    try {
      const response = await bulkUpdateSlotsApi(session_id, slots);

      set((state) => ({
        generatedSlotsData: state.generatedSlotsData
          ? {
              ...state.generatedSlotsData,
              slots: response.data.slots,
            }
          : state.generatedSlotsData,
        isSavingSlots: false,
      }));

      return {
        ok: true,
        warnings: response.data.warnings ?? [],
      };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to save slots";

      set({
        slotsError: message,
        isSavingSlots: false,
      });

      return { ok: false, message };
    }
  },

  createSlot: async (session_id, payload) => {
    set({ isSavingSlots: true, slotsError: null });

    try {
      const response = await createSlotApi(session_id, payload);

      set((state) => ({
        generatedSlotsData: state.generatedSlotsData
          ? {
              ...state.generatedSlotsData,
              slots: [...state.generatedSlotsData.slots, response.data.slot],
            }
          : state.generatedSlotsData,
        isSavingSlots: false,
      }));

      return {
        ok: true,
        warnings: response.data.warnings ?? [],
      };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to create slot";

      set({
        slotsError: message,
        isSavingSlots: false,
      });

      return { ok: false, message };
    }
  },

  patchSlot: async (session_id, slot_name, updates) => {
    set({ isSavingSlots: true, slotsError: null });

    try {
      const response = await patchSlotApi(session_id, slot_name, updates);

      const updatedSlot = response.data.slot;

      set((state) => ({
        generatedSlotsData: state.generatedSlotsData
          ? {
              ...state.generatedSlotsData,
              slots: state.generatedSlotsData.slots.map((slot) =>
                slot.slot_name === slot_name ? updatedSlot : slot,
              ),
            }
          : state.generatedSlotsData,
        isSavingSlots: false,
      }));

      return {
        ok: true,
        warnings: response.data.warnings ?? [],
      };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update slot";

      set({
        slotsError: message,
        isSavingSlots: false,
      });

      return { ok: false, message };
    }
  },

  deleteSlot: async (session_id, slot_name) => {
    set({ isSavingSlots: true, slotsError: null });

    try {
      await deleteSlotApi(session_id, slot_name);

      set((state) => ({
        generatedSlotsData: state.generatedSlotsData
          ? {
              ...state.generatedSlotsData,
              slots: state.generatedSlotsData.slots.filter(
                (slot) => slot.slot_name !== slot_name,
              ),
            }
          : state.generatedSlotsData,
        isSavingSlots: false,
      }));

      return { ok: true };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete slot";

      set({
        slotsError: message,
        isSavingSlots: false,
      });

      return { ok: false, message };
    }
  },

  saveSchedule: async (session_id, timetable_id, gridObj) => {
    set({
      isSavingSchedule: true,
      scheduleError: null,
    });

    try {
      await saveScheduleApi(timetable_id, gridObj);

      set((state) => ({
        activeScheduleData: state.activeScheduleData
          ? {
              ...state.activeScheduleData,
              grid: gridObj,
            }
          : state.activeScheduleData,
        isSavingSchedule: false,
      }));

      return { ok: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to save schedule";

      set({
        scheduleError: message,
        isSavingSchedule: false,
      });

      return { ok: false, message };
    }
  },

  saveAndEvaluateSchedule: async (session_id, timetable_id, gridObj) => {
    set({
      isEvaluatingSchedule: true,
      scheduleError: null,
    });

    try {
      const response = await evaluateScheduleApi(timetable_id, gridObj);

      const { score } = response.data;

      set((state) => ({
        activeScheduleData: state.activeScheduleData
          ? {
              ...state.activeScheduleData,
              grid: gridObj,
              score,
            }
          : state.activeScheduleData,

        generatedSlotsData: state.generatedSlotsData
          ? {
              ...state.generatedSlotsData,
              score,
            }
          : state.generatedSlotsData,

        isEvaluatingSchedule: false,
      }));

      return {
        ok: true,
        score,
      };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to evaluate schedule";

      set({
        scheduleError: message,
        isEvaluatingSchedule: false,
      });

      return { ok: false, message };
    }
  },

  exportTimetableExcel: async (generation_id, sessionTerm) => {
    try {
      const response = await exportTimetableExcelApi(generation_id);

      const url = URL.createObjectURL(response.data);

      const a = document.createElement("a");

      a.href = url;
      a.download = `timetable_${sessionTerm ?? generation_id}.xlsx`;

      a.click();

      URL.revokeObjectURL(url);

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error.response?.data?.message || "Failed to export timetable",
      };
    }
  },
}));

export default useTimetableStore;
