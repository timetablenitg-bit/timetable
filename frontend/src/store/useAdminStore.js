import { create } from "zustand";
import axiosInstance from "../lib/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const useAdminStore = create((set, get) => ({
  // ====================== Global State ======================
  isLoading: false,
  isSaving: false,
  error: null,

  academicSessions: [],
  faculties: [],
  courses: [],
  courseAssignments: [],
  labAssignments: [],
  rooms: [],
  timeSlots: [],
  batches: [],

  // ====================== Timetable Engine State ======================
  isGeneratingTimetable: false,
  isEvaluatingTimetable: false,
  timetableData: null, // { slots, timetable, score }
  evaluationScore: null, // only for evaluation mode (drag‑drop)

  // ====================== Generic Helpers ======================
  setLoading: (value) => set({ isLoading: value }),
  setSaving: (value) => set({ isSaving: value }),
  clearError: () => set({ error: null }),

  // ====================== Academic Sessions ======================
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

  // ====================== Faculties ======================
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

      // ✅ Only update state if the request actually succeeded
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

  // ====================== Courses ======================
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
      console.log(id);
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

  // ====================== Course Assignments ======================
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
  // -----BATCHES--------
  fetchBatches: async () => {
    // set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get(API_PATHS.BATCH.GET);

      set({
        batches: res.data.data || [],
      });
    } catch (error) {
      console.error("Error fetching batches:", error);
      set({
        error: error.response?.data?.message || "Failed to fetch batches",
      });
    }
  },

  fetchBatchesByDept: async (selectedBranch) => {
    try {
      set({ isLoading: true, error: null });

      const res = await axiosInstance.get(API_PATHS.BATCH.GETBYDEPT, {
        params: {
          dept: selectedBranch,
        },
      });
      console.log(res);
      set({
        batches: res.data.data || [],
      });

      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch batches",
      });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  saveBatchesToBackend: async (batchData) => {
    try {
      set({ isLoading: true, error: null });

      let res;

      // If array is passed -> bulk upload
      if (Array.isArray(batchData) && batchData.length > 1) {
        res = await axiosInstance.post(API_PATHS.BATCH.BULK, {
          rows: batchData,
        });

        // You can either refetch after upload or append locally
        set((state) => ({
          batches: [...state.batches, ...(res.data.data || [])],
        }));
      } else {
        // Single batch create
        res = await axiosInstance.post(API_PATHS.BATCH.CREATE, batchData);

        set((state) => ({
          batches: [res.data.data, ...state.batches],
        }));
      }

      return {
        success: true,
        data: res.data,
      };
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to save batch",
      });

      return {
        success: false,
        message: error.response?.data?.message || "Failed to save batch",
      };
    } finally {
      set({ isLoading: false });
    }
  },

  updateBatchInBackend: async (id, batchData) => {
    try {
      set({ isLoading: true, error: null });

      const res = await axiosInstance.put(
        API_PATHS.BATCH.UPDATE(id),
        batchData,
      );

      set((state) => ({
        batches: state.batches.map((batch) =>
          batch._id === id ? res.data.data : batch,
        ),
      }));

      return {
        success: true,
        data: res.data.data,
      };
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to update batch",
      });

      return {
        success: false,
        message: error.response?.data?.message || "Failed to update batch",
      };
    } finally {
      set({ isLoading: false });
    }
  },

  deleteBatchFromBackend: async (id) => {
    try {
      set({ isLoading: true, error: null });

      await axiosInstance.delete(API_PATHS.BATCH.DELETE(id));

      set((state) => ({
        batches: state.batches.filter((batch) => batch._id !== id),
      }));

      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to delete batch",
      });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  // ====================== New Timetable Engine Actions ======================

  /**
   * Generate full timetable for a given academic session.
   * @param {string} session_id - ID of the academic session
   */
  generateTimetable: async (session_id) => {
    set({ isGeneratingTimetable: true, error: null, timetableData: null });

    try {
      const response = await axiosInstance.get(API_PATHS.TIMETABLE.GENERATE, {
        params: { session_id },
      });

      set({
        timetableData: response.data.data, // { slots, timetable, score }
        isGeneratingTimetable: false,
      });
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to generate timetable";
      set({
        error: message,
        isGeneratingTimetable: false,
      });
      throw new Error(message); // ← add this
    }
  },

  /**
   * Evaluate an existing timetable (e.g., after drag‑drop changes).
   * @param {Array} timetable - The timetable array to evaluate
   */
  evaluateTimetable: async (timetable) => {
    set({ isEvaluatingTimetable: true, error: null, evaluationScore: null });

    try {
      const response = await axiosInstance.post(API_PATHS.TIMETABLE.EVALUATE, {
        timetable,
      });

      set({
        evaluationScore: response.data.data?.score ?? null,
        isEvaluatingTimetable: false,
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to evaluate timetable",
        isEvaluatingTimetable: false,
      });
    }
  },
  fetchGeneratedSlots: async (session_id) => {
    set({ isFetchingSlots: true, error: null });
    try {
      const response = await axiosInstance.get(API_PATHS.TIMETABLE.SLOTS, {
        params: { session_id },
      });
      set({ generatedSlotsData: response.data.data, isFetchingSlots: false });
    } catch (error) {
      const status = error.response?.status;
      // 404 just means not generated yet — not a hard error
      if (status === 404) {
        set({ generatedSlotsData: null, isFetchingSlots: false });
      } else {
        set({
          error: error.response?.data?.message || "Failed to fetch slots",
          isFetchingSlots: false,
        });
      }
    }
  },

  fetchActiveSchedule: async (session_id) => {
    set({ isFetchingSchedule: true, error: null });
    try {
      const response = await axiosInstance.get(API_PATHS.TIMETABLE.SCHEDULE, {
        params: { session_id },
      });
      set({
        activeScheduleData: response.data.data,
        isFetchingSchedule: false,
      });
    } catch (error) {
      const status = error.response?.status;
      if (status === 404) {
        set({ activeScheduleData: null, isFetchingSchedule: false });
      } else {
        set({
          error: error.response?.data?.message || "Failed to fetch schedule",
          isFetchingSchedule: false,
        });
      }
    }
  },

  reworkTimetable: async ({ timetable_id, timetable, slots, locked_cells }) => {
    set({ isSaving: true, error: null });
    try {
      const response = await axiosInstance.post(
        API_PATHS.TIMETABLE.REWORK, // add this path to your apiPaths
        { timetable_id, timetable, slots, locked_cells },
      );
      set({ isSaving: false });
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || "Rework failed";
      set({ error: message, isSaving: false });
      return { success: false, message };
    }
  },

  /**
   * Clear all timetable‑related data from the store.
   */
  clearTimetableData: () => {
    set({
      timetableData: null,
      evaluationScore: null,
      isGeneratingTimetable: false,
      isEvaluatingTimetable: false,
    });
  },
  // in your admin store
  fetchRegistrationOverview: async (sessionId) => {
    try {
      const { data } = await axiosInstance.get(
        API_PATHS.ADMIN.COURSE_REGISTRATION_OVERVIEW(sessionId),
      );
      return data.data; // the array of { batch, students[] }
    } catch (err) {
      console.error("fetchRegistrationOverview failed:", err);
      // toast.error("Failed to load registration overview");
      return [];
    }
  },
  fetchBacklogStats: async (sessionId) => {
    try {
      const { data } = await axiosInstance.get(
        API_PATHS.ADMIN.BACKLOG_STATS(sessionId),
      );
      return data.data; // [{ course, count }]
    } catch (err) {
      console.error("fetchBacklogStats failed:", err);
      return [];
    }
  },
}));

export default useAdminStore;
