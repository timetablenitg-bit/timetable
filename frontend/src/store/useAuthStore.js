import { create } from "zustand";
import axiosInstance from "../lib/axiosInstance";
import { toast } from "react-toastify";
import { API_PATHS } from "../utils/apiPaths";
export const useAuthStore = create((set, get) => ({
  // --- INITIAL STATE ---
  authUser: null,
  isSigningUp: false,
  isCheckingAuth: true,

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("needsProfileSetup");

    set({ authUser: null });
  },

  checkAuth: async () => {
    try {
      // const res = await axiosInstance.get("/auth/check");
      // set({ authUser: res.data });
      const user = localStorage.getItem("user");
      if (user) {
        set({ authUser: JSON.parse(user) });
      }
    } catch (error) {
      console.log("Error in authCheck:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  rehydrateAuth: async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.AUTH.GETME);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("needsProfileSetup", res.data.needsProfileSetup);
    } catch (error) {
      console.log("Error in rehydrating", error);
    }
  },

  setAuthUser: (user) => {
    set({ authUser: user });
  },
}));
