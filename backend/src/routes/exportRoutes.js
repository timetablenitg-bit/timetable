import express from "express";
import { generateTimetableExcel } from "../services/excelExportService.js";

const router = express.Router();

router.get("/excel/:generation_id", async (req, res) => {
  try {
    const { generation_id } = req.params;
    const buffer = await generateTimetableExcel(generation_id);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    console.log("Router export");
    res.setHeader("Content-Disposition", "attachment; filename=timetable.xlsx");
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
