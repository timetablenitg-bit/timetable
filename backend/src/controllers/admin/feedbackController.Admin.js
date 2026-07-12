import Feedback from "../../models/feedbackModel.js";

export const getAllFeedback = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const feedback = await Feedback.find(filter)
      .populate("student", "username email student_code department current_sem")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["open", "reviewed", "resolved"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (!feedback) {
      return res
        .status(404)
        .json({ success: false, message: "Feedback not found" });
    }

    res.status(200).json({ success: true, data: feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findByIdAndDelete(id);
    if (!feedback) {
      return res
        .status(404)
        .json({ success: false, message: "Feedback not found" });
    }
    res.status(200).json({ success: true, message: "Feedback deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
