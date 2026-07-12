import Feedback from "../../models/feedbackModel.js";

export const submitFeedback = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { type, message, rating, page } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Feedback message is required" });
    }

    const feedback = await Feedback.create({
      student: studentId,
      type,
      message: message.trim(),
      rating,
      page,
    });

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: feedback,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// optional: let a student see their own past feedback
export const getMyFeedback = async (req, res) => {
  try {
    const studentId = req.user.id;
    const feedback = await Feedback.find({ student: studentId }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, data: feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
