import axiosInstance from "../lib/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

export const getBatches = () => axiosInstance.get(API_PATHS.BATCH.GET);

export const getBatchesByDept = (dept) =>
  axiosInstance.get(API_PATHS.BATCH.GETBYDEPT, {
    params: { dept },
  });

export const createBatch = (batchData) =>
  axiosInstance.post(API_PATHS.BATCH.CREATE, batchData);

export const bulkCreateBatches = (rows) =>
  axiosInstance.post(API_PATHS.BATCH.BULK, { rows });

export const updateBatch = (id, batchData) =>
  axiosInstance.put(API_PATHS.BATCH.UPDATE(id), batchData);

export const deleteBatch = (id) =>
  axiosInstance.delete(API_PATHS.BATCH.DELETE(id));
