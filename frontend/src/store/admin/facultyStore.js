import { create } from "zustand";
import {
  getFaculties,
  createFacultyApi,
  bulkCreateFacultiesApi,
  updateFacultyApi,
  deleteFacultyApi,
  inviteFacultyApi,
} from "../../services/facultyService";

const useFacultyStore = create((set) => ({
  // State
  faculties: [],
  isLoading: false,
  isSaving: false,
  error: null,

  // Helpers
  clearError: () => set({ error: null }),

  // Fetch
  fetchFaculties: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await getFaculties();

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

  // Create
  createFaculty: async (payload) => {
    set({ isSaving: true, error: null });

    try {
      const response = await createFacultyApi(payload);

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

  // Bulk Upload
  bulkCreateFaculties: async (rows) => {
    set({ isSaving: true, error: null });

    try {
      const response = await bulkCreateFacultiesApi(rows);

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

  // Update
  updateFaculty: async (id, payload) => {
    set({ isSaving: true, error: null });

    try {
      const response = await updateFacultyApi(id, payload);

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

  // Delete
  deleteFaculty: async (id) => {
    try {
      await deleteFacultyApi(id);

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

  // Invite
  inviteFaculty: async (facultyId) => {
    try {
      const response = await inviteFacultyApi(facultyId);

      set((state) => ({
        faculties: state.faculties.map((faculty) =>
          faculty._id === facultyId
            ? {
                ...faculty,
                invite_status: "pending",
              }
            : faculty,
        ),
      }));

      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send invite";

      set({ error: message });

      return {
        success: false,
        message,
      };
    }
  },
}));

export default useFacultyStore;
