// store/useManualReviewStore.js
//
// Manual review queue: items slot_generator.py couldn't auto-place
// ("overflow") or over-placed relative to what's needed ("choose_occurrences").
// Mirrors useAdminStore's pattern — axios call, set loading/error state,
// return { ok, ... } so callers can await and branch without try/catch
// littered everywhere.
//
// NOTE: this is a reconstruction. The original file's contents were never
// shown to me directly — only inferred from how ManualReviewPanel.jsx and
// GeneratedTimetableTab.jsx call into it. Method names/shapes below match
// that usage plus the fetchAvailability addition from the availability-map
// feature. If your actual store differs (extra fields, different error
// shape, etc.), reconcile against that rather than trusting this blindly.

import { create } from "zustand";
import axiosInstance from "../../lib/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const useManualReviewStore = create((set, get) => ({
  // ── state ──────────────────────────────────────────────────────────────
  items: [],
  isFetching: false,
  isResolving: false,
  error: null,

  isFetchingAvailability: false,
  availabilityError: null,

  // ── GET /manual-review?session_id= ────────────────────────────────────
  fetchPendingItems: async (session_id) => {
    if (!session_id) return { ok: false, message: "session_id is required" };
    set({ isFetching: true, error: null });
    try {
      const response = await axiosInstance.get(
        API_PATHS.TIMETABLE.MANUAL_REVIEW_LIST,
        { params: { session_id } },
      );
      const items = response.data.data ?? [];
      set({ items, isFetching: false });
      return { ok: true, items };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch review items";
      set({ error: message, isFetching: false });
      return { ok: false, message };
    }
  },

  // ── PATCH /manual-review/:item_id/overflow ────────────────────────────
  resolveOverflow: async (item_id, placements) => {
    set({ isResolving: true, error: null });
    try {
      const response = await axiosInstance.patch(
        API_PATHS.TIMETABLE.RESOLVE_OVERFLOW(item_id),
        { placements },
      );
      set((state) => ({
        // Optimistically drop it from the local queue; caller also
        // re-fetches via fetchPendingItems, this just avoids a flash of
        // the stale item before that refetch resolves.
        items: state.items.filter((i) => i._id !== item_id),
        isResolving: false,
      }));
      return { ok: true, data: response.data.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to resolve overflow item";
      set({ error: message, isResolving: false });
      return { ok: false, message };
    }
  },

  // ── PATCH /manual-review/:item_id/choose-occurrences ──────────────────
  resolveChooseOccurrences: async (item_id, chosen_days) => {
    set({ isResolving: true, error: null });
    try {
      const response = await axiosInstance.patch(
        API_PATHS.TIMETABLE.RESOLVE_CHOOSE_OCCURRENCES(item_id),
        { chosen_days },
      );
      set((state) => ({
        items: state.items.filter((i) => i._id !== item_id),
        isResolving: false,
      }));
      return { ok: true, data: response.data.data };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to resolve choose_occurrences item";
      set({ error: message, isResolving: false });
      return { ok: false, message };
    }
  },

  // ── GET /manual-review/:item_id/availability ──────────────────────────
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

  // ── reset (optional convenience, e.g. on session switch) ──────────────
  resetReviewState: () =>
    set({
      items: [],
      isFetching: false,
      isResolving: false,
      error: null,
      isFetchingAvailability: false,
      availabilityError: null,
    }),
  // ── PATCH /manual-review/:item_id/unplaced ─────────────────────────────
  resolveUnplaced: async (item_id, placements) => {
    set({ isResolving: true, error: null });
    try {
      const response = await axiosInstance.patch(
        API_PATHS.TIMETABLE.RESOLVE_UNPLACED(item_id),
        { placements },
      );
      set((state) => ({
        items: state.items.filter((i) => i._id !== item_id),
        isResolving: false,
      }));
      return { ok: true, data: response.data.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to resolve unplaced item";
      set({ error: message, isResolving: false });
      return { ok: false, message };
    }
  },

  // ── GET /manual-review/:item_id/minor-oe-availability ──────────────────
  fetchMinorOeAvailability: async (item_id) => {
    set({ isFetchingAvailability: true, availabilityError: null });
    try {
      const response = await axiosInstance.get(
        API_PATHS.TIMETABLE.MANUAL_REVIEW_MINOR_OE_AVAILABILITY(item_id),
      );
      set({ isFetchingAvailability: false });
      return { ok: true, data: response.data.data };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to fetch minor/OE availability";
      set({ availabilityError: message, isFetchingAvailability: false });
      return { ok: false, message };
    }
  },
}));

export default useManualReviewStore;
