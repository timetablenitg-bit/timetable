import mongoose from "mongoose";
import { Batch } from "../../models/batchModel.js";

export const fetchBatches = async (req, res) => {
  try {
    const batches = await Batch.find({})
      .populate("lecture_room_id", "room_name room_number")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: batches,
    });
  } catch (error) {
    console.error("Fetch batches error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch batches",
    });
  }
};

export const fetchBatchesByDepartment = async (req, res) => {
  const { dept } = req.query;

  try {
    const batches = await Batch.find({
      department: dept,
    })
      .populate("lecture_room_id", "room_name room_number")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: batches,
    });
  } catch (error) {
    console.error("Fetch batches error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch batches",
    });
  }
};

export const createBatch = async (req, res) => {
  try {
    const { department, year, semester, batch_name, lecture_room_id } =
      req.body;
    // console.log("Creating batch with data:", req.body);

    // Basic validation
    if (!department || !year || !semester || !batch_name) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const batch = await Batch.create({
      department,
      year,
      semester,
      batch_name,
      lecture_room_id: lecture_room_id || null,
    });

    res.status(201).json({
      success: true,
      message: "Batch created successfully",
      data: batch,
    });
  } catch (error) {
    console.error("Create batch error:", error);

    // Duplicate batch_name per institute
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Batch with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create batch",
    });
  }
};

export const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid batch ID",
      });
    }

    const allowedUpdates = [
      "department",
      "year",
      "semester",
      "batch_name",
      "lecture_room_id",
    ];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedBatch = await Batch.findOneAndUpdate({ _id: id }, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedBatch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Batch updated successfully",
      data: updatedBatch,
    });
  } catch (error) {
    console.error("Update batch error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Batch with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update batch",
    });
  }
};

export const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid batch ID",
      });
    }

    const deletedBatch = await Batch.findOneAndDelete({
      _id: id,
    });

    if (!deletedBatch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Batch deleted successfully",
    });
  } catch (error) {
    console.error("Delete batch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete batch",
    });
  }
};

export const createBatches = async (req, res) => {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "rows must be a non-empty array",
      });
    }

    const validDocs = [];
    const validationErrors = [];

    rows.forEach((row, index) => {
      const { batch_name, department, semester, year, lecture_room_id } = row;

      // console.log(`Processing row ${index + 1}:`, row);

      // Required fields check
      if (!batch_name || !department || semester == null || year == null) {
        validationErrors.push({
          row: index + 1,
          batch_name: batch_name || null,
          message: "Missing required fields",
        });
        return;
      }

      validDocs.push({
        batch_name: String(batch_name).trim(),
        department: String(department).trim(),
        semester: Number(semester),
        year: Number(year),
        lecture_room_id:
          lecture_room_id && mongoose.Types.ObjectId.isValid(lecture_room_id)
            ? lecture_room_id
            : null,
      });
    });

    if (validDocs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid rows found",
        errors: validationErrors,
      });
    }

    let insertedDocs = [];
    let mongoErrors = [];

    try {
      insertedDocs = await Batch.insertMany(validDocs, {
        ordered: false,
      });
    } catch (err) {
      console.error("MongoDB bulk insert error:", err.message);
      // Partial success handling
      insertedDocs = err?.result?.insertedIds
        ? Object.values(err.result.insertedIds)
        : [];

      mongoErrors =
        err?.writeErrors?.map((e) => ({
          row: e.index + 1,
          message: e.errmsg,
        })) || [];
    }

    return res.status(201).json({
      success: true,
      summary: {
        total_received: rows.length,
        inserted: insertedDocs.length,
        skipped: rows.length - insertedDocs.length,
        errors: validationErrors.length + mongoErrors.length,
      },
      errors: [...validationErrors, ...mongoErrors],
      data: insertedDocs,
    });
  } catch (error) {
    console.error("Bulk batch upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to bulk upload batches",
    });
  }
};
