import { getMyBatch } from "../../controllers/student/batchController.student.js";
import express from "express";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getMyBatch);

export default router;
