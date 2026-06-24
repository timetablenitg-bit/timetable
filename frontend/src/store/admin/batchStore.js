import { create } from "zustand";

import {
  getBatches,
  getBatchesByDept,
  createBatch,
  bulkCreateBatches,
  updateBatch,
  deleteBatch,
} from "../../services/batchService";

const useBatchStore = create((set) => ({
  batches: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchBatches: async () => {
    try {
      const res = await getBatches();

      set({
        batches: res.data.data || [],
      });

      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || "Failed to fetch batches",
      });

      return false;
    }
  },

  fetchBatchesByDept: async (dept) => {
    try {
      set({
        isLoading: true,
        error: null,
      });

      const res = await getBatchesByDept(dept);

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
      set({
        isLoading: false,
      });
    }
  },

  saveBatch: async (batchData) => {
    try {
      set({
        isLoading: true,
        error: null,
      });

      let res;

      if (Array.isArray(batchData) && batchData.length > 1) {
        res = await bulkCreateBatches(batchData);

        set((state) => ({
          batches: [...state.batches, ...(res.data.data || [])],
        }));
      } else {
        res = await createBatch(batchData);

        set((state) => ({
          batches: [res.data.data, ...state.batches],
        }));
      }

      return {
        success: true,
        data: res.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to save batch",
      };
    } finally {
      set({
        isLoading: false,
      });
    }
  },

  updateBatch: async (id, batchData) => {
    try {
      set({
        isLoading: true,
        error: null,
      });

      const res = await updateBatch(id, batchData);

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
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update batch",
      };
    } finally {
      set({
        isLoading: false,
      });
    }
  },

  deleteBatch: async (id) => {
    try {
      set({
        isLoading: true,
        error: null,
      });

      await deleteBatch(id);

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
      set({
        isLoading: false,
      });
    }
  },
}));

export default useBatchStore;
