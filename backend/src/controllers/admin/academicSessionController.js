import mongoose from "mongoose";
import { AcademicSession } from "../../models/academicSessionModel.js";
import User from "../../models/userModel.js";

export const fetchAcademicSessions = async (req, res) => {
  try {
    const sessions = await AcademicSession.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("Fetch academic sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch academic sessions",
    });
  }
};

export const createAcademicSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { academic_year, term } = req.body;

    if (!academic_year || !term) {
      return res.status(400).json({
        success: false,
        message: "academic_year and term are required",
      });
    }

    // 🔍 Find the latest session to enforce sequence
    const latestSession = await AcademicSession.findOne().sort({
      createdAt: -1,
    });

    if (latestSession) {
      const lastYear = parseInt(latestSession.academic_year);
      const newYear = parseInt(academic_year);

      const isValidNext =
        (latestSession.term === "EVEN" &&
          term === "ODD" &&
          newYear === lastYear) ||
        (latestSession.term === "ODD" &&
          term === "EVEN" &&
          newYear === lastYear + 1);

      if (!isValidNext) {
        const expectedYear =
          latestSession.term === "ODD" ? lastYear + 1 : lastYear;
        const expectedTerm = latestSession.term === "ODD" ? "EVEN" : "ODD";
        return res.status(400).json({
          success: false,
          message: `Next session must be ${expectedYear} ${expectedTerm}`,
        });
      }
    }

    // ✅ Always create as inactive
    const session = await AcademicSession.create({
      academic_year,
      term,
      isActive: false, // hardcoded — activate separately via edit
      created_by: userId,
    });

    res.status(201).json({
      success: true,
      message: "Academic session created successfully",
      data: session,
    });
  } catch (error) {
    console.error("Create academic session error:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Academic session for this year and term already exists",
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to create academic session" });
  }
};

export const updateAcademicSession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid academic session ID" });
    }

    const allowedUpdates = ["academic_year", "term", "isActive"];
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // ⚡ Handle activation logic
    if (updates.isActive === true || updates.isActive === "true") {
      updates.isActive = true;

      const currentlyActive = await AcademicSession.findOne({ isActive: true });
      const targetSession = await AcademicSession.findById(id);

      if (!targetSession) {
        return res
          .status(404)
          .json({ success: false, message: "Academic session not found" });
      }

      if (currentlyActive && currentlyActive._id.toString() !== id) {
        // Deactivate current session
        await AcademicSession.findByIdAndUpdate(currentlyActive._id, {
          isActive: false,
        });

        // EVEN → ODD: current_sem+1, year+1
        // ODD → EVEN: current_sem+1, year stays
        const oldTerm = currentlyActive.term;
        const newTerm = targetSession.term;
        const oldYear = parseInt(currentlyActive.academic_year);
        const newYear = parseInt(targetSession.academic_year);

        // Determine if moving forward or backward in the sequence
        const isForward =
          newYear > oldYear ||
          (newYear === oldYear && oldTerm === "EVEN" && newTerm === "ODD");

        if (isForward) {
          // EVEN → ODD (same year): sem+1, year+1
          // ODD → EVEN (next year): sem+1, year stays
          if (oldTerm === "EVEN" && newTerm === "ODD") {
            await User.updateMany(
              { role: "student", current_sem: { $exists: true } },
              { $inc: { current_sem: 1 } },
            );
            await User.updateMany(
              { role: "student", year: { $exists: true } },
              { $inc: { year: 1 } },
            );
          } else if (oldTerm === "ODD" && newTerm === "EVEN") {
            await User.updateMany(
              { role: "student", current_sem: { $exists: true } },
              { $inc: { current_sem: 1 } },
            );
          }
        } else {
          // Going backward — reverse the increments
          // EVEN → ODD going back means: sem-1, year-1
          // ODD → EVEN going back means: sem-1, year stays
          if (oldTerm === "ODD" && newTerm === "EVEN" && newYear === oldYear) {
            // Reverting forward EVEN→ODD: sem-1, year-1
            await User.updateMany(
              { role: "student", current_sem: { $exists: true } },
              { $inc: { current_sem: -1 } },
            );
            await User.updateMany(
              { role: "student", year: { $exists: true } },
              { $inc: { year: -1 } },
            );
          } else if (
            oldTerm === "EVEN" &&
            newTerm === "ODD" &&
            newYear === oldYear - 1
          ) {
            // Reverting forward ODD→EVEN: sem-1, year stays
            await User.updateMany(
              { role: "student", current_sem: { $exists: true } },
              { $inc: { current_sem: -1 } },
            );
          }
        }
      }
    } else {
      console.log("Not activating session, skipping student updates");
    }

    // Prevent manually deactivating the only active session to avoid 0 active sessions
    if (updates.isActive === false || updates.isActive === "false") {
      const session = await AcademicSession.findById(id);
      if (session?.isActive) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot deactivate the active session directly. Activate another session instead.",
        });
      }
    }

    const updatedSession = await AcademicSession.findByIdAndUpdate(
      { _id: id },
      updates,
      { returnDocument: "after", runValidators: true },
    );

    res.status(200).json({
      success: true,
      message: "Academic session updated successfully",
      data: updatedSession,
    });
  } catch (error) {
    console.error("Update academic session error:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Academic session for this year and term already exists",
      });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to update academic session" });
  }
};

export const deleteAcademicSession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid academic session ID",
      });
    }

    const deletedSession = await AcademicSession.findOneAndDelete({
      _id: id,
    });

    if (!deletedSession) {
      return res.status(404).json({
        success: false,
        message: "Academic session not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Academic session deleted successfully",
    });
  } catch (error) {
    console.error("Delete academic session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete academic session",
    });
  }
};

export const getAcademicSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid academic session ID",
      });
    }

    const session = await AcademicSession.findOne({
      _id: id,
    }).populate("created_by", "name email");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Academic session not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Fetch academic session by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch academic session",
    });
  }
};
