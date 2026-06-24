import axiosInstance from "../lib/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

export const getAcademicSessions = async () => {
  return axiosInstance.get(API_PATHS.ACADEMIC_SESSION.GET);
};

export const createAcademicSessionApi = async (payload) => {
  return axiosInstance.post(API_PATHS.ACADEMIC_SESSION.CREATE, payload);
};

export const updateAcademicSessionApi = async (id, payload) => {
  return axiosInstance.put(API_PATHS.ACADEMIC_SESSION.UPDATE(id), payload);
};

export const deleteAcademicSessionApi = async (id) => {
  return axiosInstance.delete(API_PATHS.ACADEMIC_SESSION.DELETE(id));
};
