import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_PATHS } from "../utils/apiPaths";
import axiosInstance from "../lib/axiosInstance";

const useAuthStore = () => ({
  signup: async (data) => {
    try {
      const res = await axiosInstance.post(API_PATHS.AUTH.REGISTER, data);
      console.log("Signup successful", res.data);

      localStorage.setItem(
        "needsProfileSetup",
        res.data.user.needsProfileSetup,
      );
    } catch (error) {
      console.error("Signup failed", error);
    }
  },
  login: async (data) => {
    try {
      const res = await axiosInstance.post(API_PATHS.AUTH.LOGIN, data);
      console.log("Login successful", res.data);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem(
        "needsProfileSetup",
        res.data.user.needsProfileSetup,
      );
    } catch (error) {
      console.error("Login failed", error);
    }
  },
  isLoading: false,
});

const Signup = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  const { signup, login, isLoading } = useAuthStore();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (mode === "signup") {
        if (formData.password !== formData.confirmPassword) {
          return setError("Passwords do not match");
        }

        await signup({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });

        setMode("login"); // switch after signup
      } else {
        await login({
          email: formData.email,
          password: formData.password,
        });

        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.role === "student") {
          navigate("/student");
        } else if (user && user.role === "faculty") {
          navigate("/faculty");
        } else if (user && user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      setError("Something went wrong", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg">
        {/* Toggle */}
        <div className="flex mb-6 border rounded-md overflow-hidden">
          <button
            onClick={() => setMode("login")}
            className={`w-1/2 py-2 text-sm font-semibold ${
              mode === "login"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`w-1/2 py-2 text-sm font-semibold ${
              mode === "signup"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            Signup
          </button>
        </div>

        <h2 className="text-xl text-white font-bold text-center mb-4">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username only for signup */}
          {mode === "signup" && (
            <input
              id="username"
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="w-full text-white px-3 py-2 rounded-md border"
              required
            />
          )}

          {/* Email */}
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full text-white px-3 py-2 rounded-md border"
            required
          />

          {/* Password */}
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full text-white px-3 py-2 rounded-md border"
            required
          />

          {/* Confirm Password only for signup */}
          {mode === "signup" && (
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full text-white px-3 py-2 rounded-md border"
              required
            />
          )}

          {/* Role only for signup */}
          {mode === "signup" && (
            <select
              id="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full text-white  px-3 py-2 rounded-md border"
            >
              <option className="text-black" value="student">
                Student
              </option>
            </select>
          )}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md"
          >
            {isLoading
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
