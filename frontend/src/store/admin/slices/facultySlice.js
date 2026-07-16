import axiosInstance from "../../../lib/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";

// ====================== Faculties ======================
export const createFacultySlice = (set) => ({
  faculties: [],

  fetchFaculties: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await axiosInstance.get(API_PATHS.FACULTY.GET);

      set({
        faculties: response.data.data || [],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch faculties",
        isLoading: false,
      });
    }
  },

  createFaculty: async (payload) => {
    set({ isSaving: true, error: null });

    try {
      const response = await axiosInstance.post(
        API_PATHS.FACULTY.CREATE,
        payload,
      );

      set((state) => ({
        faculties: [response.data.data, ...state.faculties],
        isSaving: false,
      }));

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to create faculty";

      set({ error: message, isSaving: false });
      return { success: false, message };
    }
  },

  bulkCreateFaculties: async (rows) => {
    set({ isSaving: true, error: null });

    try {
      const response = await axiosInstance.post(API_PATHS.FACULTY.BULK, {
        rows,
      });

      set((state) => ({
        faculties: [...response.data.data, ...state.faculties],
        isSaving: false,
      }));

      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to bulk upload faculties";

      set({ error: message, isSaving: false });
      return { success: false, message };
    }
  },

  updateFaculty: async (id, payload) => {
    set({ isSaving: true, error: null });

    try {
      const response = await axiosInstance.put(
        API_PATHS.FACULTY.UPDATE(id),
        payload,
      );

      set((state) => ({
        faculties: state.faculties.map((faculty) =>
          faculty._id === id ? response.data.data : faculty,
        ),
        isSaving: false,
      }));

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update faculty";

      set({ error: message, isSaving: false });
      return { success: false, message };
    }
  },

  deleteFaculty: async (id) => {
    try {
      await axiosInstance.delete(API_PATHS.FACULTY.DELETE(id));

      set((state) => ({
        faculties: state.faculties.filter((faculty) => faculty._id !== id),
      }));

      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to delete faculty",
      });
      return false;
    }
  },

  inviteFaculty: async (facultyId) => {
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.INVITE, {
        facultyId,
      });

      // Only update state if the request actually succeeded
      set((state) => ({
        faculties: state.faculties.map((f) =>
          f._id === facultyId ? { ...f, invite_status: "pending" } : f,
        ),
      }));

      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send invite";
      set({ error: message });
      return { success: false, message };
    }
  },
});
