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

  fetchCoursesOfCurrentSemester: async () => {
    const user = useAuthStore.getState().authUser; // wherever you store logged-in user
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get(
        API_PATHS.COURSE.GET_BY_SEM_AND_BRANCH(
          user.current_sem,
          user.department,
        ),
      );
      set({ currentSemAvailableCourses: res.data.courses });
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch courses";
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

  startCourseRegistration: async ({ sessionId, batchId, rollNo }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.post(
        API_PATHS.STUDENT.START_REGISTRATION,
        {
          sessionId,
          batchId,
          rollNo,
        },
      );
      set({ currentRegistration: res.data.data });
      return res.data.data;
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to start registration";
      set({ error: message });
      toast.error(message);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  saveCourses: async ({ sessionId, regularCourses, backlogCourses }) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.put(API_PATHS.STUDENT.SAVE_COURSES, {
        session: sessionId,
        regularCourses,
        backlogCourses,
      });
      set({ currentRegistration: res.data.registration });
      toast.success("Courses saved!");
      return true;
    } catch (err) {
      const message = err.response?.data?.message || "Failed to save courses";
      set({ error: message });
      toast.error(message);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  submitRegistration: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.post(API_PATHS.STUDENT.SUBMIT_REGISTRATION, {
        session: sessionId,
      });
      set((state) => ({
        currentRegistration: {
          ...state.currentRegistration,
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
