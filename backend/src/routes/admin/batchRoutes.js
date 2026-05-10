import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import {
  fetchBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  createBatches,
} from "../../controllers/admin/batchController.js";
import { fetchBatchesByDepartment } from "../../controllers/admin/batchController.js";

const router = express.Router();

router.get("/", protect, fetchBatches);
router.get("/:dept", protect, fetchBatchesByDepartment);
router.post("/", protect, createBatch);
router.post("/bulk", protect, createBatches);
router.put("/:id", protect, updateBatch);
router.delete("/:id", protect, deleteBatch);

export default router;
