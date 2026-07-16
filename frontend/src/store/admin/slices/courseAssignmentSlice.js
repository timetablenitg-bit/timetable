import axiosInstance from "../../../lib/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";

// ====================== Course Assignments ======================
export const createCourseAssignmentSlice = (set, get) => ({
  courseAssignments: [],

  fetchCourseAssignments: async (filters = {}) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axiosInstance.get(
        API_PATHS.COURSE_ASSIGNMENT.GET,
        {
          params: filters,
        },
      );

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

  createCourseAssignment: async (payload) => {
    set({ isSaving: true, error: null });

    try {
      const response = await axiosInstance.post(
        API_PATHS.COURSE_ASSIGNMENT.CREATE,
        payload,
      );

      set((state) => ({
        courseAssignments: [response.data.data, ...state.courseAssignments],
        isSaving: false,
      }));

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to create course assignment";

      set({ error: message, isSaving: false });
      return { success: false, message };
    }
  },

  bulkUpsertCourseAssignments: async (academic_session_id, assignments) => {
    set({ isSaving: true, error: null });

    try {
      const response = await axiosInstance.post(
        API_PATHS.COURSE_ASSIGNMENT.BULK,
        {
          academic_session_id,
          assignments,
        },
      );

      set({ isSaving: false });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to save course assignments";

      set({ error: message, isSaving: false });
      return { success: false, message };
    }
  },

  updateCourseAssignment: async (id, payload) => {
    set({ isSaving: true, error: null });

    try {
      const response = await axiosInstance.put(
        API_PATHS.COURSE_ASSIGNMENT.UPDATE(id),
        payload,
      );

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

      set({ error: message, isSaving: false });
      return { success: false, message };
    }
  },

  // Thin convenience wrappers over updateCourseAssignment — kept separate
  // for readability, since callers don't need to know it's the same call.
  // `get()` resolves against the merged store, so this works fine living
  // in its own slice.
  updateSharedLabWith: async (id, course_ids) => {
    return get().updateCourseAssignment(id, { shared_lab_with: course_ids });
  },

  updateSyncedWith: async (id, assignment_ids) => {
    return get().updateCourseAssignment(id, { synced_with: assignment_ids });
  },

  deleteCourseAssignment: async (id) => {
    try {
      await axiosInstance.delete(API_PATHS.COURSE_ASSIGNMENT.DELETE(id));

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
});
