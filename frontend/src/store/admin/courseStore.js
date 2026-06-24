import { create } from "zustand";

import {
  getCourses,
  createCourseApi,
  bulkCreateCoursesApi,
  updateCourseApi,
  deleteCourseApi,
} from "../../services/courseService";

const useCourseStore = create((set) => ({
  // State
  courses: [],
  isLoading: false,
  isSaving: false,
  error: null,

  // Helpers
  clearError: () => set({ error: null }),

  // Fetch
  fetchCourses: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await getCourses();

      set({
        courses: response.data.data || [],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch courses",
        isLoading: false,
      });
    }
  },

  // Create
  createCourse: async (payload) => {
    set({ isSaving: true, error: null });

    try {
      const response = await createCourseApi(payload);

      set((state) => ({
        courses: [response.data.data, ...state.courses],
        isSaving: false,
      }));

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to create course";

      set({ error: message, isSaving: false });

      return { success: false, message };
    }
  },

  // Bulk Create
  bulkCreateCourses: async (rows) => {
    set({ isSaving: true, error: null });

    try {
      const response = await bulkCreateCoursesApi(rows);

      set((state) => ({
        courses: [...response.data.data, ...state.courses],
        isSaving: false,
      }));

      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to bulk upload courses";

      set({ error: message, isSaving: false });

      return { success: false, message };
    }
  },

  // Update
  updateCourse: async (id, payload) => {
    set({ isSaving: true, error: null });

    try {
      const response = await updateCourseApi(id, payload);

      set((state) => ({
        courses: state.courses.map((course) =>
          course._id === id ? response.data.data : course,
        ),
        isSaving: false,
      }));

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update course";

      set({ error: message, isSaving: false });

      return { success: false, message };
    }
  },

  // Delete
  deleteCourse: async (id) => {
    try {
      await deleteCourseApi(id);

      set((state) => ({
        courses: state.courses.filter((course) => course._id !== id),
      }));

      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to delete course",
      });

      return false;
    }
  },
}));

export default useCourseStore;
