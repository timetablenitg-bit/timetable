// src/utils/getRoleHome.js
export const getRoleHomePath = (role) => {
  switch (role) {
    case "admin":
      return "/admin";
    case "faculty":
      return "/faculty";
    case "student":
      return "/student";
    default:
      return "/";
  }
};
