import axios from "axios";
import { BASE_URL } from "../utils/apiPaths";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: false, // set true only if using cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Optional: global error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute =
      error.config?.url?.includes("/auth/login") ||
      error.config?.url?.includes("/auth/register");

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.clear();
      window.location.href = "/auth";
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
