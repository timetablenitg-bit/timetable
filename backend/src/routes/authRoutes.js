import express from "express";
import {
  googleLogin,
  setUpProfile,
  logout,
  getMe,
  login,
  register,
  inviteFaculty,
  acceptInvite,
} from "../controllers/authController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/getMe", protect, getMe);
router.post("/google", googleLogin);
router.post("/setupProfile", protect, setUpProfile);
router.post("/logout", protect, logout);
router.post("/login", login);
router.post("/register", register);
// router.post("/invite-faculty", protect, authorizeRoles("admin"), inviteFaculty); // admin only
// router.post("/accept-invite", acceptInvite);

export default router;
