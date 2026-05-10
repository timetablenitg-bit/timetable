// controllers/student/batchController.student.js

import { Batch } from "../../models/batchModel.js";

export const getMyBatch = async (req, res) => {
  try {
    // console.log("Fetching batch for user:", req.user);
    const { current_sem, department } = req.user;

    const year = Math.ceil(current_sem / 2); // sem 1,2 → yr 1 | sem 3,4 → yr 2 etc.

    const batch = await Batch.findOne({
      department,
      semester: current_sem,
      year,
    });

    if (!batch) {
      return res
        .status(404)
        .json({ message: "No batch found for your semester and department" });
    }

    res.status(200).json({ data: batch });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
