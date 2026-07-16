import axiosInstance from "../../../lib/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";

// ====================== Courses ======================
export const createCourseSlice = (set) => ({
  courses: [],

  fetchCourses: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await axiosInstance.get(API_PATHS.COURSE.GET);

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

  createCourse: async (payload) => {
    set({ isSaving: true, error: null });

    try {
      const response = await axiosInstance.post(
        API_PATHS.COURSE.CREATE,
        payload,
      );

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

  bulkCreateCourses: async (rows) => {
    set({ isSaving: true, error: null });

    try {
      const response = await axiosInstance.post(API_PATHS.COURSE.BULK, {
        rows,
      });

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

  updateCourse: async (id, payload) => {
    set({ isSaving: true, error: null });

    try {
      const response = await axiosInstance.put(
        API_PATHS.COURSE.UPDATE(id),
        payload,
      );

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

  deleteCourse: async (id) => {
    try {
      await axiosInstance.delete(API_PATHS.COURSE.DELETE(id));

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
});
