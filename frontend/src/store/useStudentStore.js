import { create } from "zustand";
import { toast } from "react-toastify";
import axiosInstance from "../lib/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import { useAuthStore } from "./useAuthStore";

export const useStudentStore = create((set, get) => ({
  currentSemAvailableCourses: [],
  academicSessions: null,
  currentRegistration: null,
  myBatch: null,
  isLoading: false,
  error: null,
  allCourseCatalogue: [],

  fetchMyBatch: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get(API_PATHS.STUDENT.MY_BATCH);
      set({ myBatch: res.data.data });
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch batch";
      set({ error: message });
      toast.error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAllCourseCatalogue: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await axiosInstance.get(API_PATHS.COURSE.GET);

      set({
        allCourseCatalogue: response.data.data || [],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch courses",
        isLoading: false,
      });
    }
  },

  fetchAcademicSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get(API_PATHS.STUDENT.ACADEMICSESSIONS);
      set({ academicSessions: res.data.data });
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to fetch academic sessions";
      set({ error: message });
      toast.error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  getMyCourseRegistration: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get(
        API_PATHS.STUDENT.GETMYREGISTRATION(sessionId),
      );
      set({ currentRegistration: res.data.data });
      return res.data.data;
    } catch (err) {
      if (err.response?.status === 404) {
        set({ currentRegistration: null });
        return null; // not an error, just no registration yet
      }
      const message =
        err.response?.data?.message || "Failed to fetch registration";
      set({ error: message });
      toast.error(message);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  submitRegistration: async ({ sessionId, batchId, backlogCourses }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.post(
        API_PATHS.STUDENT.SUBMIT_REGISTRATION,
        {
          session: sessionId,
          batch: batchId,
          backlogCourses,
        },
      );
      set((state) => ({
        currentRegistration: {
          ...state.currentRegistration,
          ...res.data.registration,
          status: "COMPLETED",
        },
      }));
      toast.success("Registration submitted successfully!");
      return true;
    } catch (err) {
      const message = err.response?.data?.message || "Submission failed";
      set({ error: message });
      toast.error(message);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));
