import axiosInstance from "../../../lib/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";

// ====================== Slot Locks ======================
// Locks persist across regenerations (see slotLockModel.js). This slice owns
// fetching/mutating them; the "regenerate" button itself just re-calls
// generateTimetable() from timetableEngineSlice — locks are read server-side
// at that point, nothing more to do here.
export const createLockSlice = (set, get) => ({
  locksData: [],
  isSavingLock: false,
  lockError: null,

  fetchLocks: async (session_id) => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.TIMETABLE.LOCKS(session_id),
      );
      set({ locksData: response.data.data });
    } catch (error) {
      set({
        lockError: error.response?.data?.message || "Failed to fetch locks",
      });
    }
  },

  lockCourseToSlot: async (session_id, assignment_id, slot_name) => {
    set({ isSavingLock: true, lockError: null });
    try {
      const response = await axiosInstance.post(
        API_PATHS.TIMETABLE.LOCK_COURSE,
        {
          session_id,
          assignment_id,
          slot_name,
        },
      );
      const prev = get().locksData;
      const withoutOld = prev.filter(
        (l) =>
          !(l.lock_type === "course" && l.assignment_id?._id === assignment_id),
      );
      set({
        locksData: [...withoutOld, response.data.data],
        isSavingLock: false,
      });
      return { ok: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to lock course";
      set({ lockError: message, isSavingLock: false });
      return { ok: false, message };
    }
  },

  lockSlotEmpty: async (session_id, slot_name, batch_ids) => {
    set({ isSavingLock: true, lockError: null });
    try {
      const response = await axiosInstance.post(
        API_PATHS.TIMETABLE.LOCK_EMPTY,
        {
          session_id,
          slot_name,
          batch_ids,
        },
      );
      set({
        locksData: [...get().locksData, response.data.data],
        isSavingLock: false,
      });
      return { ok: true, data: response.data.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to lock slot empty";
      set({ lockError: message, isSavingLock: false });
      return { ok: false, message };
    }
  },

  deleteLock: async (lock_id) => {
    try {
      await axiosInstance.delete(API_PATHS.TIMETABLE.DELETE_LOCK(lock_id));
      set({ locksData: get().locksData.filter((l) => l._id !== lock_id) });
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error.response?.data?.message || "Failed to remove lock",
      };
    }
  },

  clearAllLocks: async (session_id) => {
    try {
      await axiosInstance.delete(API_PATHS.TIMETABLE.CLEAR_LOCKS(session_id));
      set({ locksData: [] });
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error.response?.data?.message || "Failed to clear locks",
      };
    }
  },
});
