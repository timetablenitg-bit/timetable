import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import ToastProvider from "./components/toastify";
import useThemeStore from "./store/useHomeStore";
import { useAuthStore } from "./store/useAuthStore";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Student from "./pages/Student";
import Faculty from "./pages/Faculty";
import Incharge from "./pages/Incharge";
import Homepage from "./pages/HomePage";
import TestPage from "./pages/TestPage";
import AcceptInvite from "./pages/AcceptInvite";
// import GenerateTable from "./pages/GenerateTable";
const App = () => {
  // 1. Pull the theme state from Zustand
  const { theme } = useThemeStore();

  // 2. Pull the checkAuth function from auth store
  const { checkAuth } = useAuthStore();

  // 3. Check if the user is logged in when the app first loads or refreshes
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 4. Handle the HTML class globally for light/dark mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return (
    <>
      <div className="bg-gray-300 dark:bg-black min-h-screen md:min-h-[100dvh] w-screen">
        <ToastProvider />

        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          {/* <Route path="/signup" element={<Signup />} /> */}
          {/* <Route path="/faculty" element={<Faculty />} /> */}
          {/* <Route path="/student" element={<Student />} /> */}
          {/* <Route path="/incharge" element={<Incharge />} /> */}
          {/* <Route path="/test" element={<TestPage />} /> */}
          <Route path="/accept-invite" element={<AcceptInvite />} />
          {/* <Route path="/generate" element={<GenerateTable />} /> */}

          {/* --- Protected Routes --- */}

          {/* Student Portal - Only 'student' tag can access */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <Student />
              </ProtectedRoute>
            }
          />

          {/* Faculty Portal - Only 'faculty' tag can access */}
          <Route
            path="/faculty"
            element={
              <ProtectedRoute allowedRoles={["faculty"]}>
                <Faculty />
              </ProtectedRoute>
            }
          />

          {/* Incharge Portal - Only 'incharge' tag can access */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Incharge />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </>
  );
};

export default App;
