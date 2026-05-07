import User from "../models/userModel.js";
import { AcademicSession } from "../models/academicSessionModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { Faculty } from "../models/facultyModel.js";
import { sendInviteEmail } from "../utils/mailer.js";

const client = new OAuth2Client(process.env.OAUTH_CLIENT_ID);

// Helper to parse roll number
const parseRollNumber = (email) => {
  const roll = email.split("@")[0]; // "24EEE1002"
  const match = roll.match(/^(\d{2})([A-Za-z]+)(\d+)$/);
  if (!match) return null;
  return {
    enrollmentYear: 2000 + parseInt(match[1]), // 24 → 2024
    department: match[2].toUpperCase(), // "EEE"
  };
};

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Google credential missing" });
    }
    const googleRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${credential}`,
        },
      },
    );

    const payload = await googleRes.json();

    const { email, name, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({
        message: "Google email not verified",
      });
    }

    if (!email.endsWith("@nitgoa.ac.in")) {
      return res
        .status(403)
        .json({ message: "Only nitgoa.ac.in accounts are allowed" });
    }

    let user = await User.findOne({ email });

    if (user) {
      // Faculty was invited but hasn't signed in yet — activate them
      if (user.role === "faculty" && user.invite_status === "pending") {
        user.username = name; // set their real Google display name
        user.authProvider = "google";
        user.invite_status = "accepted";
        user.isActive = true;
        await user.save();
      }

      // Faculty exists but tried to log in without being invited
      if (user.role === "faculty" && user.invite_status === "uninvited") {
        return res.status(403).json({
          message:
            "Your account hasn't been set up yet. Please contact the admin.",
        });
      }
    }

    if (!user) {
      let department = null;
      let current_sem = null;
      let year = null;

      const parsed = parseRollNumber(email);

      if (parsed) {
        // Fetch the currently active academic session
        const activeSession = await AcademicSession.findOne({
          isActive: true,
        });

        if (activeSession) {
          const yearDiff =
            parseInt(activeSession.academic_year) - parsed.enrollmentYear;
          current_sem =
            activeSession.term === "ODD" ? yearDiff * 2 + 1 : yearDiff * 2;
          department = parsed.department;
          year = Math.ceil(current_sem / 2);
        }
      }

      user = await User.create({
        username: name,
        email,
        authProvider: "google",
        ...(department && { department }),
        ...(current_sem && { current_sem }),
        ...(year && { year }),
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.status(200).json({
      message: "Google login successful",
      token,
      user,
      needsProfileSetup: !user.department || !user.current_sem,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Google login failed",
      error: error.message,
    });
  }
};

export const setUpProfile = async (req, res) => {
  const { department, current_sem } = req.body;
  const email = req.user.email;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        department,
        current_sem,
      },
      { new: true },
    ).select("-password");
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Setup profile error:", error);
    res.status(500).json({
      success: false,
      message: "Profile update failed",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Rehydrate error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

export const logout = async (req, res) => {};

export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // 🚫 Prevent faculty self-registration
    if (role === "faculty") {
      return res.status(403).json({
        success: false,
        message: "Faculty must be invited by admin",
      });
    }

    // 🔍 Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    let department = null;
    let current_sem = null;
    let year = null;

    const parsed = parseRollNumber(email);

    if (parsed) {
      // Fetch the currently active academic session
      const activeSession = await AcademicSession.findOne({
        isActive: true,
      });

      if (activeSession) {
        const yearDiff =
          parseInt(activeSession.academic_year) - parsed.enrollmentYear;
        current_sem =
          activeSession.term === "ODD" ? yearDiff * 2 + 1 : yearDiff * 2;
        department = parsed.department;
        year = Math.ceil(current_sem / 2);
      }
    }
    // 🔐 Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "student",
      department: department,
      current_sem: current_sem,
      year: year,
    });
    // 🎟️ Generate token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: "student",
        needsProfileSetup: !user.department || !user.current_sem,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔍 Find user (include password explicitly)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 🚫 Block Google users from local login
    if (user.authProvider === "google") {
      return res.status(400).json({
        success: false,
        message: "Please login with Google",
      });
    }

    // 🔐 Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 🚫 Optional: block inactive users
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    // 🎟️ Generate token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        current_sem: user.current_sem,
        needsProfileSetup: !user.department || !user.current_sem,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// ── INVITE FACULTY ───────────────────────────────────────────────────────────
// POST /api/auth/invite-faculty
// Body: { facultyId }   ← MongoDB _id from Faculty collection
export const inviteFaculty = async (req, res) => {
  try {
    const { facultyId } = req.body;

    // 1. Find the faculty record
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res
        .status(404)
        .json({ success: false, message: "Faculty not found" });
    }
    if (!faculty.email) {
      return res
        .status(400)
        .json({ success: false, message: "Faculty has no email on record" });
    }

    // 2. Check if already a user
    const existing = await User.findOne({ email: faculty.email });
    if (existing && existing.invite_status === "accepted") {
      return res.status(400).json({
        success: false,
        message: "Faculty has already accepted the invite",
      });
    }

    // 3. Generate a short-lived signed token (24h)
    const inviteToken = jwt.sign(
      {
        facultyId: faculty._id,
        email: faculty.email,
        faculty_code: faculty.faculty_code,
        department: faculty.department,
        type: "faculty-invite",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    // 4. Send email FIRST — only write to DB if this succeeds
    const acceptUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${inviteToken}`;
    await sendInviteEmail({
      to: faculty.email,
      name: faculty.name,
      acceptUrl,
    });

    // 5. Upsert the pending User only after email is confirmed sent
    await User.findOneAndUpdate(
      { email: faculty.email },
      {
        email: faculty.email,
        role: "faculty",
        faculty_code: faculty.faculty_code,
        department: faculty.department,
        invite_status: "pending",
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    return res
      .status(200)
      .json({ success: true, message: "Invite sent successfully" });
  } catch (err) {
    console.error("inviteFaculty error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send invite" });
  }
};

// ── ACCEPT INVITE ────────────────────────────────────────────────────────────
// POST /api/auth/accept-invite
// No password needed — just validate the token and mark as "ready for google login"
export const acceptInvite = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Token is required" });
    }

    // 1. Verify token
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired invite link" });
    }

    if (payload.type !== "faculty-invite") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid token type" });
    }

    // 2. Find pending user
    const user = await User.findOne({ email: payload.email, role: "faculty" });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Invite record not found" });
    }

    if (user.invite_status === "accepted") {
      return res
        .status(400)
        .json({ success: false, message: "Invite already accepted" });
    }

    // 3. Just confirm the invite is valid — actual account activation
    //    happens when they sign in with Google for the first time
    return res.status(200).json({
      success: true,
      message:
        "Invite verified! Sign in with your @nitgoa.ac.in Google account to continue.",
      email: payload.email, // so frontend can show "sign in as X"
      name: payload.name,
    });
  } catch (err) {
    console.error("acceptInvite error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to verify invite" });
  }
};
