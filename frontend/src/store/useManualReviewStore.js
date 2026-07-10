// store/useManualReviewStore.js
//
// Backs the Manual Review tab. Holds whatever slot_generator.py couldn't
// auto-place: overflow sessions (4-credit-and-similar, sync-group excess)
// and choose_occurrences items (2-credit courses, sync-group shortfall).
// Resolving an item writes straight into the active generation's grid on
// the backend — there is no separate draft/preview step here either.

import { create } from "zustand";
import axiosInstance from "../lib/axiosInstance"; // adjust path to match your project
import { API_PATHS } from "../utils/apiPaths";

const useManualReviewStore = create((set, get) => ({
  items: [],
  isFetching: false,
  isResolving: false,
  error: null,

  fetchPendingItems: async (session_id) => {
    set({ isFetching: true, error: null });
    try {
      const response = await axiosInstance.get(
        API_PATHS.TIMETABLE.MANUAL_REVIEW,
        { params: { session_id } },
      );
      set({ items: response.data.data, isFetching: false });
      return { ok: true, count: response.data.data.length };
    } catch (error) {
      const status = error.response?.status;
      if (status === 404) {
        set({ items: [], isFetching: false });
        return { ok: true, count: 0 };
      }
      const message =
        error.response?.data?.message || "Failed to fetch review items";
      set({ error: message, isFetching: false });
      return { ok: false, message };
    }
  },

  // placements: [{ day, period_index, track }], one per item.sessions_needed
  resolveOverflow: async (item_id, placements) => {
    set({ isResolving: true, error: null });
    try {
      const response = await axiosInstance.patch(
        API_PATHS.TIMETABLE.RESOLVE_OVERFLOW(item_id),
        { placements },
      );
      set((state) => ({
        items: state.items.map((it) =>
          it._id === item_id ? response.data.data.item : it,
        ),
        isResolving: false,
      }));
      return { ok: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to resolve overflow item";
      set({ error: message, isResolving: false });
      return { ok: false, message };
    }
  },

  // chosen_days: string[] — must have length === item.sessions_to_choose,
  // and every entry must be one of item.available_days
  resolveChooseOccurrences: async (item_id, chosen_days) => {
    set({ isResolving: true, error: null });
    try {
      const response = await axiosInstance.patch(
        API_PATHS.TIMETABLE.RESOLVE_CHOOSE_OCCURRENCES(item_id),
        { chosen_days },
      );
      set((state) => ({
        items: state.items.map((it) =>
          it._id === item_id ? response.data.data.item : it,
        ),
        isResolving: false,
      }));
      return { ok: true };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to resolve choose_occurrences item";
      set({ error: message, isResolving: false });
      return { ok: false, message };
    }
  },

  clear: () => set({ items: [], error: null }),
}));

export default useManualReviewStore;
