import axiosInstance from "../../../lib/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";

// ====================== Batches ======================
export const createBatchSlice = (set) => ({
  batches: [],

  fetchBatches: async () => {
    try {
      const res = await axiosInstance.get(API_PATHS.BATCH.GET);

      set({
        batches: res.data.data || [],
      });
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch batches",
      });
    }
  },

  fetchBatchesByDept: async (selectedBranch) => {
    try {
      set({ isLoading: true, error: null });

      const res = await axiosInstance.get(API_PATHS.BATCH.GETBYDEPT, {
        params: { dept: selectedBranch },
      });

      set({ batches: res.data.data || [] });

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

  // Single batch -> POST one row. Array of >1 -> bulk endpoint.
  // Returns { success, data } on success, { success: false, message } on failure.
  saveBatchesToBackend: async (batchData) => {
    try {
      set({ isLoading: true, error: null });

      let res;

      if (Array.isArray(batchData) && batchData.length > 1) {
        res = await axiosInstance.post(API_PATHS.BATCH.BULK, {
          rows: batchData,
        });

        set((state) => ({
          batches: [...state.batches, ...(res.data.data || [])],
        }));
      } else {
        const payload = Array.isArray(batchData) ? batchData[0] : batchData;
        res = await axiosInstance.post(API_PATHS.BATCH.CREATE, payload);

        set((state) => ({
          batches: [res.data.data, ...state.batches],
        }));
      }

      return {
        success: true,
        data: res.data.data,
      };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to save batch";
      set({ error: message });

      return { success: false, message };
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
      const message = error.response?.data?.message || "Failed to update batch";
      set({ error: message });

      return { success: false, message };
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

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete batch";
      set({ error: message });

      return { success: false, message };
    } finally {
      set({ isLoading: false });
    }
  },
});
