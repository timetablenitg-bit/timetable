import axiosInstance from "../../../lib/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";
import { toast } from "react-toastify";

// ====================== User Management ======================
// NOTE: the original store used a `loading` flag here while every other
// slice uses `isLoading`. Renamed to `isLoading` for consistency — check
// any component reading `loading` directly off useAdminStore() and update
// it to `isLoading`.
export const createUserManagementSlice = (set) => ({
  users: [],
  studentUsers: [],
  adminUsers: [],
  facultyUsers: [],

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get(API_PATHS.USER.FETCH_ALL);
      set({ users: res.data.data, isLoading: false });
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch users";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  deleteUser: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(API_PATHS.USER.DELETE(userId));
      set((state) => ({
        users: state.users.filter((u) => u._id !== userId),
        isLoading: false,
      }));
      toast.success("User deleted successfully");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete user";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  updateUserRole: async (userId, newRole) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.put(API_PATHS.USER.UPDATE_ROLE(userId), {
        role: newRole,
      });
      set((state) => ({
        users: state.users.map((u) => (u._id === userId ? res.data.data : u)),
        isLoading: false,
      }));
      toast.success("User role updated");
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update user role";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  deleteUserBySemester: async (current_sem) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.post(
        API_PATHS.USER.DELETE_BY_SEMESTER(current_sem),
      );
      set((state) => ({
        users: state.users.filter((u) => u.current_sem !== current_sem),
        isLoading: false,
      }));
      toast.success(res.data.message);
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete users by semester";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  fetchUserByRole: async (role) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get(API_PATHS.USER.FETCH_BY_ROLE(role));

      // Store by role so different role fetches don't clobber each other
      if (role === "faculty") set({ facultyUsers: res.data.data });
      else if (role === "student") set({ studentUsers: res.data.data });
      else if (role === "admin") set({ adminUsers: res.data.data });

      set({ isLoading: false });
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch users by role";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },
});
