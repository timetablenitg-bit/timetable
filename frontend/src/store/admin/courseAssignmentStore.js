import { create } from "zustand";

import {
  getCourseAssignments,
  createCourseAssignmentApi,
  bulkUpsertCourseAssignmentsApi,
  updateCourseAssignmentApi,
  deleteCourseAssignmentApi,
} from "../../services/courseAssignmentService";

const useCourseAssignmentStore = create((set) => ({
  // State
  courseAssignments: [],
  isLoading: false,
  isSaving: false,
  error: null,

  clearError: () => set({ error: null }),

  // Fetch
  fetchCourseAssignments: async (filters = {}) => {
    set({ isLoading: true, error: null });

    try {
      const response = await getCourseAssignments(filters);

      set({
        courseAssignments: response.data.data || [],
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error.response?.data?.message || "Failed to fetch course assignments",
        isLoading: false,
      });
    }
  },

  // Create
  createCourseAssignment: async (payload) => {
    set({ isSaving: true, error: null });

    try {
      const response = await createCourseAssignmentApi(payload);

      set((state) => ({
        courseAssignments: [response.data.data, ...state.courseAssignments],
        isSaving: false,
      }));

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to create course assignment";

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

  // Bulk Save
  bulkUpsertCourseAssignments: async (academic_session_id, assignments) => {
    set({ isSaving: true, error: null });

    try {
      const response = await bulkUpsertCourseAssignmentsApi(
        academic_session_id,
        assignments,
      );

      set({ isSaving: false });

      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to save course assignments";

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

  // Update
  updateCourseAssignment: async (id, payload) => {
    set({ isSaving: true, error: null });

    try {
      const response = await updateCourseAssignmentApi(id, payload);

      set((state) => ({
        courseAssignments: state.courseAssignments.map((assignment) =>
          assignment._id === id ? response.data.data : assignment,
        ),
        isSaving: false,
      }));

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update course assignment";

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

  // Delete
  deleteCourseAssignment: async (id) => {
    try {
      await deleteCourseAssignmentApi(id);

      set((state) => ({
        courseAssignments: state.courseAssignments.filter(
          (assignment) => assignment._id !== id,
        ),
      }));

      return true;
    } catch (error) {
      set({
        error:
          error.response?.data?.message || "Failed to delete course assignment",
      });

      return false;
    }
  },
}));

export default useCourseAssignmentStore;
