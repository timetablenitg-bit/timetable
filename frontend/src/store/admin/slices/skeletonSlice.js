import axiosInstance from "../../../lib/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";

// ====================== Timetable Skeleton ======================
export const createSkeletonSlice = (set) => ({
  isFetchingSkeleton: false,
  isSavingSkeleton: false,
  skeletonData: null,
  skeletonError: null,

  fetchSkeleton: async (session_id) => {
    set({ isFetchingSkeleton: true, skeletonError: null });
    try {
      const response = await axiosInstance.get(API_PATHS.TIMETABLE.SKELETON, {
        params: { session_id },
      });
      set({ skeletonData: response.data.data, isFetchingSkeleton: false });
      return { ok: true, data: response.data.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch skeleton";
      set({ skeletonError: message, isFetchingSkeleton: false });
      return { ok: false, message };
    }
  },

  // cells: [{ day, track, period_index, time_label, slot_label }]
  // skeleton_id: pass to edit an existing draft, omit to create a new one
  saveSkeletonDraft: async (session_id, cells, skeleton_id = null) => {
    set({ isSavingSkeleton: true, skeletonError: null });
    try {
      const response = await axiosInstance.post(API_PATHS.TIMETABLE.SKELETON, {
        session_id,
        cells,
        skeleton_id,
      });
      set({ skeletonData: response.data.data, isSavingSkeleton: false });
      return { ok: true, data: response.data.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to save skeleton";
      set({ skeletonError: message, isSavingSkeleton: false });
      return { ok: false, message };
    }
  },

  activateSkeleton: async (skeleton_id) => {
    set({ isSavingSkeleton: true, skeletonError: null });
    try {
      const response = await axiosInstance.patch(
        API_PATHS.TIMETABLE.SKELETON_ACTIVATE(skeleton_id),
      );
      set({ skeletonData: response.data.data, isSavingSkeleton: false });
      return { ok: true, data: response.data.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to activate skeleton";
      set({ skeletonError: message, isSavingSkeleton: false });
      return { ok: false, message };
    }
  },
});
