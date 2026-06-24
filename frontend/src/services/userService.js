import axiosInstance from "../lib/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

export const fetchUsersApi = () => axiosInstance.get(API_PATHS.USER.FETCH_ALL);

export const deleteUserApi = (userId) =>
  axiosInstance.delete(API_PATHS.USER.DELETE(userId));

export const updateUserRoleApi = (userId, role) =>
  axiosInstance.put(API_PATHS.USER.UPDATE_ROLE(userId), { role });

export const deleteUserBySemesterApi = (current_sem) =>
  axiosInstance.post(API_PATHS.USER.DELETE_BY_SEMESTER(current_sem));

export const fetchUserByRoleApi = (role) =>
  axiosInstance.get(API_PATHS.USER.FETCH_BY_ROLE(role));
