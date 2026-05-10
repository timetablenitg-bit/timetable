import { create } from "zustand";
import { toast } from "react-toastify";

export const useFacultyStore = create((set, get) => ({
  // ================= STATE =================
  requests: [],
  isLoading: true,
  isSubmitting: false,
  attendanceData: {}, // 🆕 Added attendance state
  leaves: [],
  isLeavesLoading: true,
  isLeaveSubmitting: false,
  workloadStats: null,
  isWorkloadLoading: true,

  // ================= ATTENDANCE ACTIONS =================

  // --- FETCH ATTENDANCE ---
  fetchAttendance: () => {
    try {
      // 🔗 BACKEND LOGIC (When ready)
      // const response = await axios.get("/api/faculty/attendance");
      // set({ attendanceData: response.data });

      // 🛠️ LOCAL STORAGE LOGIC (Current implementation)
      const saved = JSON.parse(localStorage.getItem("attendance")) || {};
      set({ attendanceData: saved });
    } catch (error) {
      console.error("Error loading attendance:", error);
      toast.error("Failed to load attendance data ❌");
      set({ attendanceData: {} });
    }
  },

  // --- MARK ATTENDANCE ---
  markAttendance: async (date, status) => {
    try {
      // 🔗 BACKEND LOGIC (When ready)
      // await axios.post("/api/faculty/attendance", { date, status });

      // 🛠️ LOCAL STORAGE LOGIC
      const currentData = get().attendanceData;
      const updated = { ...currentData, [date]: status };

      // Update Zustand state and LocalStorage simultaneously
      set({ attendanceData: updated });
      localStorage.setItem("attendance", JSON.stringify(updated));

      toast.success(`Marked ${status} for ${date}`);
      return true;
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Failed to mark attendance ❌");
      return false;
    }
  },

  // ================= ADMIN CONTACT REQUEST ACTIONS =================

  // --- FETCH REQUEST HISTORY ---
  fetchContactRequests: async () => {
    set({ isLoading: true });

    try {
      // 🔗 BACKEND LOGIC (Commented for now)
      // const response = await axios.get("/api/faculty/contact-requests");
      // set({ requests: response.data, isLoading: false });

      // 🛠️ MOCK LOGIC (Simulates backend fetch)
      setTimeout(() => {
        set({
          isLoading: false,
        });
      }, 800);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load request history ❌");
      set({ isLoading: false });
    }
  },

  // --- SUBMIT NEW REQUEST ---
  submitContactRequest: async (formData) => {
    set({ isSubmitting: true });
    toast.dismiss(); // Clear any existing toasts to prevent stacking

    try {
      // 🔗 BACKEND LOGIC (Commented for now)
      // const response = await axios.post("/api/faculty/contact", formData);
      // const newRequest = response.data;

      // 🛠️ MOCK LOGIC (Simulates backend post)
      const newRequest = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: Date.now(),
            date: new Date().toISOString(),
            ...formData,
            status: "Pending",
          });
        }, 1000);
      });

      // Update state: Add the new request to the top of the list
      set((state) => ({
        requests: [newRequest, ...state.requests],
        isSubmitting: false,
      }));

      toast.success("Request sent to admin successfully!");
      return true; // Return true to let the component know it succeeded
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to send request. Please try again");
      set({ isSubmitting: false });
      return false; // Return false to prevent component success UI
    }
  },

  // ================= LEAVE MANAGEMENT STATE =================
  fetchLeaves: async () => {
    set({ isLeavesLoading: true });
    try {
      // 🔗 BACKEND LOGIC (When ready)
      // const response = await axios.get("/api/faculty/leaves");
      // set({ leaves: response.data, isLeavesLoading: false });

      // 🛠️ MOCK LOGIC (Simulates backend fetch)
      setTimeout(() => {
        set({
          leaves: [],
          isLeavesLoading: false,
        });
      }, 800);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      toast.error("Failed to load leave history ❌");
      set({ isLeavesLoading: false });
    }
  },

  // --- SUBMIT LEAVE REQUEST ---
  submitLeave: async (leaveData) => {
    set({ isLeaveSubmitting: true });
    toast.dismiss();

    try {
      // 🔗 BACKEND LOGIC (When ready)
      // const response = await axios.post("/api/faculty/leaves", leaveData);
      // const savedLeave = response.data;

      // 🛠️ MOCK LOGIC (Simulates backend post)
      const savedLeave = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: Date.now(),
            status: "Pending",
            ...leaveData,
          });
        }, 800);
      });

      // Prepend the new leave request to the existing list
      set((state) => ({
        leaves: [savedLeave, ...state.leaves],
        isLeaveSubmitting: false,
      }));

      toast.success("Leave request submitted successfully! ✅");
      return true; // Return success so component can reset form
    } catch (error) {
      console.error("Error submitting leave:", error);
      toast.error("Failed to submit leave request ❌");
      set({ isLeaveSubmitting: false });
      return false; // Return failure so component doesn't clear form
    }
  },

  // ================= WORKLOAD STATE =================
  // --- FETCH WORKLOAD ---
  fetchWorkload: async () => {
    set({ isWorkloadLoading: true });
    try {
      // 🔗 BACKEND LOGIC (When ready)
      // const response = await axios.get("/api/faculty/workload");
      // set({ workloadStats: response.data, isWorkloadLoading: false });

      // 🛠️ MOCK LOGIC (Simulates backend fetch)
      setTimeout(() => {
        set({
          workloadStats: {
            completed: 18,
            remaining: 6,
            freeSlots: 4,
          },
          isWorkloadLoading: false,
        });
      }, 800); // Simulated delay
    } catch (error) {
      console.error("Error fetching workload:", error);
      toast.error("Failed to load workload data ❌");
      set({ isWorkloadLoading: false });
    }
  },
}));
