// src/components/NotFoundRedirect.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { getRoleHomePath } from "../utils/getRoleHome";

const NotFoundRedirect = () => {
  const { authUser, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) return null;

  return (
    <Navigate to={authUser ? getRoleHomePath(authUser.role) : "/"} replace />
  );
};

export default NotFoundRedirect;
