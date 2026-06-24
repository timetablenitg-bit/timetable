import axiosInstance from "../lib/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

export const getCourseAssignments = (filters = {}) =>
  axiosInstance.get(API_PATHS.COURSE_ASSIGNMENT.GET, {
    params: filters,
  });

export const createCourseAssignmentApi = (payload) =>
  axiosInstance.post(API_PATHS.COURSE_ASSIGNMENT.CREATE, payload);

export const bulkUpsertCourseAssignmentsApi = (
  academic_session_id,
  assignments,
) =>
  axiosInstance.post(API_PATHS.COURSE_ASSIGNMENT.BULK, {
    academic_session_id,
    assignments,
  });

export const updateCourseAssignmentApi = (id, payload) =>
  axiosInstance.put(API_PATHS.COURSE_ASSIGNMENT.UPDATE(id), payload);

export const deleteCourseAssignmentApi = (id) =>
  axiosInstance.delete(API_PATHS.COURSE_ASSIGNMENT.DELETE(id));
