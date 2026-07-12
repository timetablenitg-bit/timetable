import { create } from "zustand";
import { toast } from "react-toastify";
import axiosInstance from "../lib/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

export const useFeedbackStore = create((set, get) => ({
  isSubmitting: false,
  isLoading: false,
  myFeedback: [],

  // admin
  allFeedback: [],

  submitFeedback: async ({ type, message, rating, page }) => {
    set({ isSubmitting: true });
    try {
      await axiosInstance.post(API_PATHS.FEEDBACK.SUBMIT, {
        type,
        message,
        rating,
        page,
      });
      toast.success("Thanks for your feedback!");
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit feedback";
      toast.error(msg);
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  fetchMyFeedback: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(API_PATHS.FEEDBACK.MY_FEEDBACK);
      set({ myFeedback: res.data.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load feedback");
    } finally {
      set({ isLoading: false });
    }
  },

  // ---- ADMIN ----
  fetchAllFeedback: async (filters = {}) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await axiosInstance.get(
        `${API_PATHS.FEEDBACK.ADMIN_GET_ALL}${params ? `?${params}` : ""}`,
      );
      set({ allFeedback: res.data.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load feedback");
    } finally {
      set({ isLoading: false });
    }
  },

  updateFeedbackStatus: async (id, status) => {
    try {
      const res = await axiosInstance.patch(
        API_PATHS.FEEDBACK.ADMIN_UPDATE_STATUS(id),
        { status },
      );
      set((state) => ({
        allFeedback: state.allFeedback.map((f) =>
          f._id === id ? res.data.data : f,
        ),
      }));
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  },

  deleteFeedback: async (id) => {
    try {
      await axiosInstance.delete(API_PATHS.FEEDBACK.ADMIN_DELETE(id));
      set((state) => ({
        allFeedback: state.allFeedback.filter((f) => f._id !== id),
      }));
      toast.success("Feedback deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  },
}));
