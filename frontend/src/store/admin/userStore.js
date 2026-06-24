import { create } from "zustand";
import { toast } from "react-toastify";

import {
  fetchUsersApi,
  deleteUserApi,
  updateUserRoleApi,
  deleteUserBySemesterApi,
  fetchUserByRoleApi,
} from "../../services/userService";

const useUserStore = create((set) => ({
  // State
  users: [],
  facultyUsers: [],
  studentUsers: [],
  adminUsers: [],

  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  // Fetch All Users
  fetchUsers: async () => {
    set({
      loading: true,
      error: null,
    });

    try {
      const res = await fetchUsersApi();

      set({
        users: res.data.data,
        loading: false,
      });
    } catch (error) {
      const message = error.response?.data?.message || "Failed to fetch users";

      set({
        error: message,
        loading: false,
      });

      toast.error(message);
    }
  },

  // Delete User
  deleteUser: async (userId) => {
    set({
      loading: true,
      error: null,
    });

    try {
      await deleteUserApi(userId);

      set((state) => ({
        users: state.users.filter((u) => u._id !== userId),
        loading: false,
      }));

      toast.success("User deleted successfully");
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete user";

      set({
        error: message,
        loading: false,
      });

      toast.error(message);
    }
  },

  // Update Role
  updateUserRole: async (userId, newRole) => {
    set({
      loading: true,
      error: null,
    });

    try {
      const res = await updateUserRoleApi(userId, newRole);

      set((state) => ({
        users: state.users.map((u) => (u._id === userId ? res.data.data : u)),
        loading: false,
      }));

      toast.success("User role updated");
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update user role";

      set({
        error: message,
        loading: false,
      });

      toast.error(message);
    }
  },

  // Delete Semester
  deleteUserBySemester: async (current_sem) => {
    set({
      loading: true,
      error: null,
    });

    try {
      const res = await deleteUserBySemesterApi(current_sem);

      set((state) => ({
        users: state.users.filter((u) => u.current_sem !== current_sem),
        loading: false,
      }));

      toast.success(res.data.message);
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete users by semester";

      set({
        error: message,
        loading: false,
      });

      toast.error(message);
    }
  },

  // Fetch By Role
  fetchUserByRole: async (role) => {
    set({
      loading: true,
      error: null,
    });

    try {
      const res = await fetchUserByRoleApi(role);

      if (role === "faculty") {
        set({
          facultyUsers: res.data.data,
        });
      } else if (role === "student") {
        set({
          studentUsers: res.data.data,
        });
      } else if (role === "admin") {
        set({
          adminUsers: res.data.data,
        });
      }

      set({
        loading: false,
      });
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch users by role";

      set({
        error: message,
        loading: false,
      });

      toast.error(message);
    }
  },
}));

export default useUserStore;
