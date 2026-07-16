import axiosInstance from "../../../lib/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";

// ====================== Academic Sessions ======================
export const createAcademicSessionSlice = (set) => ({
  academicSessions: [],

  fetchAcademicSessions: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await axiosInstance.get(API_PATHS.ACADEMIC_SESSION.GET);

      set({
        academicSessions: response.data.data || [],
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error.response?.data?.message || "Failed to fetch academic sessions",
        isLoading: false,
      });
    }
  },

  createAcademicSession: async (payload) => {
    set({ isSaving: true, error: null });

    try {
      const response = await axiosInstance.post(
        API_PATHS.ACADEMIC_SESSION.CREATE,
        payload,
      );

      set((state) => ({
        academicSessions: [response.data.data, ...state.academicSessions],
        isSaving: false,
      }));

      return { success: true, data: response.data.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to create academic session";

      set({ error: message, isSaving: false });
      return { success: false, message };
    }
  },

  updateAcademicSession: async (id, payload) => {
    set({ isSaving: true, error: null });

    try {
      const response = await axiosInstance.put(
        API_PATHS.ACADEMIC_SESSION.UPDATE(id),
        payload,
      );

      set((state) => ({
        academicSessions: state.academicSessions.map((session) =>
          session._id === id ? response.data.data : session,
        ),
        isSaving: false,
      }));

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update academic session";

      set({ error: message, isSaving: false });
      return { success: false, message };
    }
  },

  deleteAcademicSession: async (id) => {
    try {
      await axiosInstance.delete(API_PATHS.ACADEMIC_SESSION.DELETE(id));

      set((state) => ({
        academicSessions: state.academicSessions.filter(
          (session) => session._id !== id,
        ),
      }));

      return true;
    } catch (error) {
      set({
        error:
          error.response?.data?.message || "Failed to delete academic session",
      });
      return false;
    }
  },
});
