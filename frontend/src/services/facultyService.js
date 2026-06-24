import axiosInstance from "../lib/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

export const getFaculties = () => axiosInstance.get(API_PATHS.FACULTY.GET);

export const createFacultyApi = (payload) =>
  axiosInstance.post(API_PATHS.FACULTY.CREATE, payload);

export const bulkCreateFacultiesApi = (rows) =>
  axiosInstance.post(API_PATHS.FACULTY.BULK, { rows });

export const updateFacultyApi = (id, payload) =>
  axiosInstance.put(API_PATHS.FACULTY.UPDATE(id), payload);

export const deleteFacultyApi = (id) =>
  axiosInstance.delete(API_PATHS.FACULTY.DELETE(id));

export const inviteFacultyApi = (facultyId) =>
  axiosInstance.post(API_PATHS.AUTH.INVITE, { facultyId });
