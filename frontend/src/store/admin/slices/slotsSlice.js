import axiosInstance from "../../../lib/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";

// ====================== Editable Slots ======================
// Mutates generatedSlotsData (owned by timetableEngineSlice) via get().
export const createSlotsSlice = (set, get) => ({
  isSavingSlots: false,
  slotsError: null,

  bulkUpdateSlots: async (session_id, slots) => {
    set({ isSavingSlots: true, slotsError: null });
    try {
      const response = await axiosInstance.put(
        API_PATHS.TIMETABLE.BULK_UPDATE(session_id),
        { slots },
      );
      set({
        generatedSlotsData: {
          ...get().generatedSlotsData,
          slots: response.data.slots,
        },
        isSavingSlots: false,
      });
      return { ok: true, warnings: response.data.warnings ?? [] };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to save slots";
      set({ slotsError: message, isSavingSlots: false });
      return { ok: false, message };
    }
  },

  createSlot: async (
    session_id,
    { slot_name, slot_type = "lecture", entries = [] },
  ) => {
    set({ isSavingSlots: true, slotsError: null });
    try {
      const response = await axiosInstance.post(
        API_PATHS.TIMETABLE.CREATE_SLOT(session_id),
        { slot_name, slot_type, entries },
      );
      const prev = get().generatedSlotsData;
      set({
        generatedSlotsData: prev
          ? { ...prev, slots: [...prev.slots, response.data.slot] }
          : prev,
        isSavingSlots: false,
      });
      return { ok: true, warnings: response.data.warnings ?? [] };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to create slot";
      set({ slotsError: message, isSavingSlots: false });
      return { ok: false, message };
    }
  },

  patchSlot: async (session_id, slot_name, updates) => {
    set({ isSavingSlots: true, slotsError: null });
    try {
      const response = await axiosInstance.patch(
        API_PATHS.TIMETABLE.PATCH_SLOT(session_id, slot_name),
        updates,
      );
      const updatedSlot = response.data.slot;
      const prev = get().generatedSlotsData;
      set({
        generatedSlotsData: prev
          ? {
              ...prev,
              slots: prev.slots.map((s) =>
                s.slot_name === slot_name ? updatedSlot : s,
              ),
            }
          : prev,
        isSavingSlots: false,
      });
      return { ok: true, warnings: response.data.warnings ?? [] };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update slot";
      set({ slotsError: message, isSavingSlots: false });
      return { ok: false, message };
    }
  },

  deleteSlot: async (session_id, slot_name) => {
    set({ isSavingSlots: true, slotsError: null });
    try {
      await axiosInstance.delete(
        API_PATHS.TIMETABLE.DELETE_SLOT(session_id, slot_name),
      );
      const prev = get().generatedSlotsData;
      set({
        generatedSlotsData: prev
          ? {
              ...prev,
              slots: prev.slots.filter((s) => s.slot_name !== slot_name),
            }
          : prev,
        isSavingSlots: false,
      });
      return { ok: true };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete slot";
      set({ slotsError: message, isSavingSlots: false });
      return { ok: false, message };
    }
  },
});
