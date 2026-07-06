// src/components/PublicRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { getRoleHomePath } from "../utils/getRoleHome";

const PublicRoute = ({ children }) => {
  const { authUser, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Already logged in? Don't show the public page, send them home.
  if (authUser) {
    return <Navigate to={getRoleHomePath(authUser.role)} replace />;
  }

  return children;
};

export default PublicRoute;
