import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore"; // Update this path if needed

const ProtectedRoute = ({ children, allowedRoles }) => {
  // Pull the current user and loading state from Zustand
  const { authUser, isCheckingAuth } = useAuthStore();

  // 1. Wait for the initial authentication check to finish
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 2. Not Logged In? Send them to the login page immediately.
  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  // 3. Role Checking: If this route requires specific roles, check if the user has one
  if (allowedRoles && !allowedRoles.includes(authUser.role)) {
    // If they try to access a page they shouldn't, kick them back to their own portal
    if (authUser.role === "admin") return <Navigate to="/admin" replace />;
    if (authUser.role === "faculty") return <Navigate to="/faculty" replace />;
    if (authUser.role === "student") return <Navigate to="/student" replace />;

    // Ultimate fallback if the role is weird
    return <Navigate to="/" replace />;
  }

  // 4. If they pass all checks, render the page they asked for!
  return children;
};

export default ProtectedRoute;
