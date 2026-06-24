import axiosInstance from "../lib/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

export const getCourses = () => axiosInstance.get(API_PATHS.COURSE.GET);

export const createCourseApi = (payload) =>
  axiosInstance.post(API_PATHS.COURSE.CREATE, payload);

export const bulkCreateCoursesApi = (rows) =>
  axiosInstance.post(API_PATHS.COURSE.BULK, { rows });

export const updateCourseApi = (id, payload) =>
  axiosInstance.put(API_PATHS.COURSE.UPDATE(id), payload);

export const deleteCourseApi = (id) =>
  axiosInstance.delete(API_PATHS.COURSE.DELETE(id));
