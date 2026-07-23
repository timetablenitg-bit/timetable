// services/excelExportService.js

import ExcelJS from "exceljs";
import path from "path";
import { TimetableSchedule } from "../models/timetableScheduleModel.js";
import { GeneratedSlot } from "../models/generatedSlotModel.js";

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TIME_LABELS = [
  "9:00 – 9:55",
  "10:00 – 10.55",
  "11:00 – 11:55",
  "12:00 – 12.55",
  "12:55 – 14.00",
  "14:00 – 14:55",
  "15:00 – 15:55",
  "16:00 – 16:55",
];

const LUNCH_PI = 4;
const AM_LAB_BLOCK = [0, 1, 2];
const PM_LAB_BLOCK = [5, 6, 7];

const SEM_FILL = {
  IV: "FFF1DBDB",
  VI: "FFB6DDE8",
  VIII: "FFE4DFEB",
  "MTech-II": "FFEAF0DD",
  "MTech-IV": "FFEAF0DD",
};

const SECTION_FILL = {
  A: "FFF1DBDB",
  B: "FFB6DDE8",
  C: "FFE4DFEB",
  D: "FFEAF0DD",
};

const LUNCH_FILL = "FFF4B083";
const SLOT_HDR_BG = "FFFFFF00";
const DEPT_COLOR = "FF0070C0";
const SEM_ORDER = ["IV", "VI", "VIII", "MTech-II", "MTech-IV"];

// ── Batch name normalizer ─────────────────────────────────────────────────────
function isFirstYearName(raw) {
  if (!raw) return false;
  return /1st.?year|first.?year|\bfy\b|(1st|2nd)\s*sem\s*sec/i.test(raw);
}

function normalizeBatchName(name) {
  if (!name) return name;
  name = name.trim();
  if (isFirstYearName(name)) {
    const match = name.match(/([A-Za-z])\s*$/);
    const section = match ? match[1].toUpperCase() : name;
    return `1stYear-${section}`;
  }
  if (name.includes("-")) return name;
  const parts = name.split(/\s+/);
  const dept = parts[0];
  const semWord = (parts[1] ?? "").toLowerCase();
  const SEM_WORD_TO_ROMAN = {
    "1st": "I",
    "2nd": "II",
    "3rd": "III",
    "4th": "IV",
    "5th": "V",
    "6th": "VI",
    "7th": "VII",
    "8th": "VIII",
  };
  const semRoman = SEM_WORD_TO_ROMAN[semWord] ?? parts[1];
  const lastPart = parts[parts.length - 1];
  const hasSection = parts.length > 3 && /^[A-Z]$/.test(lastPart);
  return hasSection ? `${dept}-${semRoman}-${lastPart}` : `${dept}-${semRoman}`;
}

// ── ExcelJS helpers ───────────────────────────────────────────────────────────
const solid = (argb) => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb },
});

const thin = () => ({
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
});

function sc(cell, opts = {}) {
  const {
    value,
    bold = false,
    size = 10,
    colorArgb = "FF000000",
    fillArgb = null,
    borders = false,
    alignH = "center",
    alignV = "center",
    wrap = true,
  } = opts;
  if (value !== undefined) cell.value = value;
  cell.font = { bold, size, color: { argb: colorArgb } };
  cell.alignment = { horizontal: alignH, vertical: alignV, wrapText: wrap };
  if (fillArgb) cell.fill = solid(fillArgb);
  if (borders) cell.border = thin();
}

// ── Lab-block detection ───────────────────────────────────────────────────────
function getLabBlock(trackMap, block) {
  if (!trackMap) return null;
  const names = block.map((p) => trackMap[p]?.slot_name);
  if (names.every((n) => n && n.startsWith("LAB") && n === names[0]))
    return names[0];
  return null;
}

// ── Batch name parsing ──────────────────────────────────────────────────────
function parseBatch(name) {
  if (!name) return { dept: name, sem: "", section: "", is1stYear: false };
  if (isFirstYearName(name)) {
    const parts = name.split("-");
    const section = parts[parts.length - 1] ?? "";
    return { dept: "1st Year", sem: section, section, is1stYear: true };
  }
  const parts = name.split("-");
  return {
    dept: parts[0] ?? name,
    sem: parts[1] ?? "",
    section: parts[2] ?? "",
    is1stYear: false,
  };
}

// ── Fill color resolver ───────────────────────────────────────────────────────
function getFillForRow(sem, is1stYear, section) {
  if (is1stYear)
    return SECTION_FILL[section] ?? SECTION_FILL[sem] ?? "FFFFFFFF";
  return SEM_FILL[sem] ?? "FFFFFFFF";
}

// ── Track resolution ──────────────────────────────────────────────────────────
function resolveTrackForBatch(schedule, day, batchId) {
  if (!batchId) return 1;
  const explicit = (schedule.track_assignments ?? []).find(
    (t) => t.day === day && String(t.batch_id) === String(batchId),
  );
  if (explicit) return explicit.track;
  const suggested = (schedule.suggested_track_assignments ?? []).find(
    (t) => t.day === day && String(t.batch_id) === String(batchId),
  );
  if (suggested) return suggested.track;
  return 1;
}

// ── Main export ───────────────────────────────────────────────────────────────
export const generateTimetableExcel = async (generation_id) => {
  const schedule = await TimetableSchedule.findOne({ generation_id });
  if (!schedule) throw new Error("Timetable schedule not found");

  const generatedSlots = await GeneratedSlot.find({ generation_id });

  // slot_name → entries[]
  const slotMap = {};
  for (const s of generatedSlots) slotMap[s.slot_name] = s.entries;

  // ── normalizedBatchName → batch_id ─────────────────────────────────────────
  const batchIdMap = {};
  const harvestBatchIds = (entries = []) => {
    for (const e of entries) {
      const names = e.batch_names ?? [];
      const ids = e.batch_ids ?? [];
      names.forEach((raw, idx) => {
        const norm = normalizeBatchName(raw);
        if (!batchIdMap[norm] && ids[idx]) batchIdMap[norm] = ids[idx];
      });
    }
  };
  for (const slot of generatedSlots) harvestBatchIds(slot.entries);
  for (const cell of schedule.grid ?? []) harvestBatchIds(cell.manual_entries);

  // ── Collect all batches and normalize names ───────────────────────────────
  const batchSet = new Set();
  for (const slot of generatedSlots) {
    for (const e of slot.entries) {
      for (const b of e.batch_names ?? []) {
        batchSet.add(normalizeBatchName(b));
      }
    }
  }
  for (const cell of schedule.grid ?? []) {
    for (const e of cell.manual_entries ?? []) {
      for (const b of e.batch_names ?? []) {
        batchSet.add(normalizeBatchName(b));
      }
    }
  }

  // deptMap[dept][sem] = [normalizedBatchNames]
  const deptMap = {};
  for (const batch of batchSet) {
    const { dept, sem } = parseBatch(batch);
    if (!deptMap[dept]) deptMap[dept] = {};
    if (!deptMap[dept][sem]) deptMap[dept][sem] = [];
    deptMap[dept][sem].push(batch);
  }

  for (const dept of Object.keys(deptMap)) {
    for (const sem of Object.keys(deptMap[dept])) {
      deptMap[dept][sem].sort();
    }
  }

  // ── Department ordering: 1st Year first, then alphabetical ───────────────
  const depts = Object.keys(deptMap).sort((a, b) => {
    if (a === "1st Year") return -1;
    if (b === "1st Year") return 1;
    return a.localeCompare(b);
  });

  // ── Build flat row list ───────────────────────────────────────────────────
  const buildRows = () => {
    const rows = [];
    for (const dept of depts) {
      const is1stYear = dept === "1st Year";
      const allSems = Object.keys(deptMap[dept]);

      let sems;
      if (is1stYear) {
        const order = ["A", "B", "C", "D"];
        sems = [
          ...order.filter((s) => allSems.includes(s)),
          ...allSems.filter((s) => !order.includes(s)).sort(),
        ];
      } else {
        sems = [
          ...SEM_ORDER.filter((s) => allSems.includes(s)),
          ...allSems.filter((s) => !SEM_ORDER.includes(s)).sort(),
        ];
      }

      sems.forEach((sem, index) => {
        rows.push({
          dept: index === 0 ? dept : null,
          deptSpan: index === 0 ? sems.length : 0,
          sem,
          section: is1stYear
            ? sem
            : deptMap[dept][sem][0]
              ? parseBatch(deptMap[dept][sem][0]).section
              : "",
          batches: deptMap[dept][sem], // already normalized
          is1stYear,
          isFirstInDept: index === 0,
        });
      });
    }
    return rows;
  };

  // ── Grid helpers ──────────────────────────────────────────────────────────
  const buildTrackMap = (day, trackNum) =>
    Object.fromEntries(
      (schedule.grid ?? [])
        .filter((c) => c.day === day && c.track === trackNum)
        .map((c) => [c.period_index, c]),
    );

  const findEntryInSlot = (slotName, normalizedBatch, hiddenIds) => {
    if (!slotName || slotName === "BREAK") return null;
    return (
      (slotMap[slotName] ?? []).find((e) => {
        if (e.assignment_id && hiddenIds.has(String(e.assignment_id)))
          return false;
        return (e.batch_names ?? []).some(
          (b) => normalizeBatchName(b) === normalizedBatch,
        );
      }) ?? null
    );
  };

  const findManualEntry = (gridCell, normalizedBatch) => {
    if (!gridCell) return null;
    return (
      (gridCell.manual_entries ?? []).find((e) =>
        (e.batch_names ?? []).some(
          (b) => normalizeBatchName(b) === normalizedBatch,
        ),
      ) ?? null
    );
  };

  const getCellText = (day, batches, t1Map, t2Map, t1PmLab, t2AmLab, pi) => {
    const lines = [];
    for (const batch of batches) {
      const batchId = batchIdMap[batch];
      const bIsT2 = resolveTrackForBatch(schedule, day, batchId) === 2;
      const map = bIsT2 ? t2Map : t1Map;
      const bAmLab = bIsT2 ? t2AmLab : null;
      const bPmLab = bIsT2 ? null : t1PmLab;
      const { section } = parseBatch(batch);
      const prefix = section ? `[${section}] ` : "";

      const gridCell = map[pi] ?? null;
      const hiddenIds = new Set(
        (gridCell?.hidden_assignment_ids ?? []).map(String),
      );

      const manual = findManualEntry(gridCell, batch);
      if (manual) {
        lines.push(
          `${prefix}${manual.course_code ?? "—"}: ${manual.faculty_code ?? ""}`,
        );
        continue;
      }

      if (bAmLab && AM_LAB_BLOCK.includes(pi)) {
        const le = findEntryInSlot(bAmLab, batch, hiddenIds);
        if (le)
          lines.push(
            `${prefix}${le.course_code ?? bAmLab}: ${le.faculty_code ?? ""}`,
          );
        continue;
      }
      if (bPmLab && PM_LAB_BLOCK.includes(pi)) {
        const le = findEntryInSlot(bPmLab, batch, hiddenIds);
        if (le)
          lines.push(
            `${prefix}${le.course_code ?? bPmLab}: ${le.faculty_code ?? ""}`,
          );
        continue;
      }

      if (
        !gridCell ||
        gridCell.slot_type === "break" ||
        gridCell.slot_type === "free"
      )
        continue;
      const entry = findEntryInSlot(gridCell.slot_name, batch, hiddenIds);
      if (!entry) continue;
      lines.push(
        `${prefix}${entry.course_code ?? "—"}: ${entry.faculty_code ?? ""}`,
      );
    }
    return lines.join("\n");
  };

  // Helper to check if a batch has a lab in a given block (AM or PM)
  // Returns the entry if found, else null
  const getLabEntryForBatch = (batch, labSlotName, trackMap, periodIndex) => {
    if (!labSlotName) return null;
    const gridCell = trackMap[periodIndex];
    if (!gridCell) return null;
    const hiddenIds = new Set(
      (gridCell.hidden_assignment_ids ?? []).map(String),
    );
    return findEntryInSlot(labSlotName, batch, hiddenIds);
  };

  // ── Workbook ──────────────────────────────────────────────────────────────
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Timetable Generator";
  workbook.created = new Date();

  const LOGO_PATH = path.resolve("src/assets/logo.png");

  for (const day of DAYS) {
    const ws = workbook.addWorksheet(day);

    const t1Map = buildTrackMap(day, 1);
    const t2Map = buildTrackMap(day, 2);
    const t1PmLab = getLabBlock(t1Map, PM_LAB_BLOCK);
    const t2AmLab = getLabBlock(t2Map, AM_LAB_BLOCK);

    [9.29, 9.14, 21, 19.14, 23.43, 19, 11.29, 21.57, 21, 18].forEach((w, i) => {
      ws.getColumn(i + 1).width = w;
    });

    // ── Logo A1:B4 ────────────────────────────────────────────────────────
    try {
      const logoId = workbook.addImage({
        filename: LOGO_PATH,
        extension: "png",
      });
      ws.addImage(logoId, {
        tl: { col: 0, row: 0 },
        br: { col: 2, row: 4 },
        editAs: "oneCell",
      });
    } catch (_) {
      /* logo not found — skip */
    }
    ws.mergeCells("A1:B4");

    // ── Rows 1–4: institute name ──────────────────────────────────────────
    ws.mergeCells("C1:J1");
    sc(ws.getCell("C1"), {
      value: "राष्ट्रीय प्रौधोगिकी संस्थान गोवा",
      bold: true,
      size: 16,
      colorArgb: "FF002060",
    });
    ws.getRow(1).height = 25.5;

    ws.mergeCells("C2:J2");
    sc(ws.getCell("C2"), {
      value: "NATIONAL INSTITUTE OF TECHNOLOGY GOA",
      bold: true,
      size: 16,
      colorArgb: "FF002060",
    });
    ws.getRow(2).height = 20.25;

    ws.mergeCells("C3:J3");
    sc(ws.getCell("C3"), {
      value: "कुंकोलिम, जिला दक्षिण गोवा, गोवा, पिन - ४०३ ७०३, इंडिया",
      bold: true,
      size: 12,
      colorArgb: "FF002060",
    });
    ws.getRow(3).height = 15;

    ws.mergeCells("C4:J4");
    sc(ws.getCell("C4"), {
      value: "Cuncolim, South Goa District, Goa, Pin–403703, India",
      bold: true,
      size: 12,
      colorArgb: "FF002060",
    });
    ws.getRow(4).height = 15;

    ws.mergeCells("A5:C6");
    sc(ws.getCell("A5"), {
      value: "Website: http://www.nitgoa.ac.in",
      bold: true,
      size: 10,
      colorArgb: "FF002060",
      alignH: "left",
    });
    ws.getRow(5).height = 9.75;
    ws.getRow(6).height = 15;

    ws.mergeCells("A7:J7");
    sc(ws.getCell("A7"), {
      value: "Day wise Master Time Table:  Even Semester (Jan- June 2026)",
      bold: true,
      size: 12,
      colorArgb: "FF0000FF",
    });
    ws.getRow(7).height = 20.25;

    ws.mergeCells("A8:J8");
    sc(ws.getCell("A8"), {
      value: day,
      bold: true,
      size: 14,
      colorArgb: "FF0000FF",
    });
    ws.getRow(8).height = 20.25;

    sc(ws.getCell("B9"), {
      value: "Time",
      bold: true,
      size: 10,
      colorArgb: "FF0000FF",
    });
    TIME_LABELS.forEach((lbl, i) => {
      sc(ws.getCell(9, i + 3), {
        value: lbl,
        bold: true,
        size: 10,
        colorArgb: "FF0000FF",
      });
    });
    ws.getRow(9).height = 13.5;

    // ── Row 10: slot header ───────────────────────────────────────────────
    sc(ws.getCell("B10"), {
      value: "Sem/Slot",
      bold: true,
      size: 10,
      colorArgb: "FFFF0000",
      fillArgb: SLOT_HDR_BG,
    });

    for (let pi = 0; pi <= LUNCH_PI; pi++) {
      const col = pi + 3;
      const gc = t1Map[pi];
      const lbl =
        pi === LUNCH_PI
          ? "Lunch"
          : gc?.slot_type === "break"
            ? "Lunch"
            : (gc?.slot_name ?? "");
      sc(ws.getCell(10, col), {
        value: lbl,
        bold: true,
        size: 10,
        colorArgb: "FFFF0000",
        fillArgb: SLOT_HDR_BG,
      });
    }

    ws.mergeCells(10, 8, 10, 10);
    const isLabDay = !!(t1PmLab || t2AmLab);
    if (isLabDay) {
      const labLabel = [t1PmLab, t2AmLab].filter(Boolean).join(" / ");
      sc(ws.getCell(10, 8), {
        value: labLabel,
        bold: true,
        size: 10,
        colorArgb: "FFFF0000",
        fillArgb: SLOT_HDR_BG,
      });
    } else {
      const pmLabels = [5, 6, 7]
        .map((pi) => {
          const gc = t1Map[pi];
          return gc?.slot_type === "break" ? "" : (gc?.slot_name ?? "");
        })
        .filter(Boolean)
        .join(" / ");
      sc(ws.getCell(10, 8), {
        value: pmLabels,
        bold: true,
        size: 10,
        colorArgb: "FFFF0000",
        fillArgb: SLOT_HDR_BG,
      });
    }
    ws.getRow(10).height = 17.25;

    // ── Data rows ─────────────────────────────────────────────────────────
    const tableRows = buildRows();
    let r = 11;

    for (let ri = 0; ri < tableRows.length; ri++) {
      const {
        dept,
        deptSpan,
        sem,
        section,
        batches,
        is1stYear,
        isFirstInDept,
      } = tableRows[ri];
      const semFill = getFillForRow(sem, is1stYear, section);

      // ── Determine if this row has uniform AM/PM labs ──────────────────
      let allHaveAmLab = true;
      let allHavePmLab = true;
      if (batches.length === 0) {
        allHaveAmLab = false;
        allHavePmLab = false;
      } else {
        for (const batch of batches) {
          const batchId = batchIdMap[batch];
          const track = resolveTrackForBatch(schedule, day, batchId);

          // AM lab: track 2 and t2AmLab exists and has entry
          const hasAmLab =
            track === 2 &&
            t2AmLab !== null &&
            getLabEntryForBatch(batch, t2AmLab, t2Map, 0) !== null;
          // PM lab: track 1 and t1PmLab exists and has entry
          const hasPmLab =
            track === 1 &&
            t1PmLab !== null &&
            getLabEntryForBatch(batch, t1PmLab, t1Map, 5) !== null;

          if (!hasAmLab) allHaveAmLab = false;
          if (!hasPmLab) allHavePmLab = false;
        }
      }

      // ── Write Department (col A) ──────────────────────────────────────
      if (isFirstInDept) {
        sc(ws.getCell(r, 1), {
          value: dept,
          bold: true,
          size: 10,
          colorArgb: DEPT_COLOR,
          alignH: "left",
          alignV: "center",
        });
      }

      // ── Write Semester (col B) ────────────────────────────────────────
      sc(ws.getCell(r, 2), {
        value: sem,
        bold: true,
        size: 10,
        fillArgb: semFill,
        borders: true,
      });

      // ── AM block: periods 0,1,2 (cols 3-5) ──────────────────────────
      if (allHaveAmLab) {
        // Merge columns 3-5 and display the lab content (from first batch)
        ws.mergeCells(r, 3, r, 5);
        const firstBatch = batches[0];
        const labEntry = getLabEntryForBatch(firstBatch, t2AmLab, t2Map, 0);
        const labText = labEntry
          ? `${labEntry.course_code ?? t2AmLab}: ${labEntry.faculty_code ?? ""}`
          : "";
        sc(ws.getCell(r, 3), {
          value: labText,
          size: 9,
          fillArgb: semFill,
          borders: true,
        });
      } else {
        for (let pi = 0; pi <= 2; pi++) {
          const col = pi + 3;
          const text = getCellText(
            day,
            batches,
            t1Map,
            t2Map,
            t1PmLab,
            t2AmLab,
            pi,
          );
          sc(ws.getCell(r, col), {
            value: text || "",
            size: 9,
            fillArgb: semFill,
            borders: true,
          });
        }
      }

      // ── Period 3 (12:00-12:55) - col 6 ──────────────────────────────
      const pi3text = getCellText(
        day,
        batches,
        t1Map,
        t2Map,
        t1PmLab,
        t2AmLab,
        3,
      );
      sc(ws.getCell(r, 6), {
        value: pi3text || "",
        size: 9,
        fillArgb: semFill,
        borders: true,
      });

      // ── Lunch column (col 7) ──────────────────────────────────────────
      // Only set the cell value if it's the first row of the department group;
      // the cell will be merged later across the group.
      if (isFirstInDept) {
        sc(ws.getCell(r, 7), {
          value: "Lunch",
          bold: true,
          size: 10,
          fillArgb: LUNCH_FILL,
          borders: true,
        });
      } else {
        // For subsequent rows, we still need to apply fill/borders but no value
        sc(ws.getCell(r, 7), {
          value: "",
          fillArgb: LUNCH_FILL,
          borders: true,
        });
      }

      // ── PM block: periods 5,6,7 (cols 8-10) ──────────────────────────
      if (allHavePmLab) {
        ws.mergeCells(r, 8, r, 10);
        const firstBatch = batches[0];
        const labEntry = getLabEntryForBatch(firstBatch, t1PmLab, t1Map, 5);
        const labText = labEntry
          ? `${labEntry.course_code ?? t1PmLab}: ${labEntry.faculty_code ?? ""}`
          : "";
        sc(ws.getCell(r, 8), {
          value: labText,
          size: 9,
          fillArgb: semFill,
          borders: true,
        });
      } else {
        for (let pi = 5; pi <= 7; pi++) {
          const col = pi + 3; // pi=5 -> col 8
          const text = getCellText(
            day,
            batches,
            t1Map,
            t2Map,
            t1PmLab,
            t2AmLab,
            pi,
          );
          sc(ws.getCell(r, col), {
            value: text || "",
            size: 9,
            fillArgb: semFill,
            borders: true,
          });
        }
      }

      ws.getRow(r).height = 13.5;
      r++;

      // ── After finishing a department group, merge dept and lunch columns ──
      const next = tableRows[ri + 1];
      const isLastInGroup = !next || next.isFirstInDept;

      if (isLastInGroup) {
        const groupStart = r - deptSpan;
        if (deptSpan > 1) {
          ws.mergeCells(groupStart, 1, r - 1, 1);
          ws.mergeCells(groupStart, 7, r - 1, 7);
        }
        ws.mergeCells(r, 1, r, 10);
        ws.getRow(r).height = 8.25;
        r++;
      }
    }

    // ── Footer ────────────────────────────────────────────────────────────
    r++;
    ws.mergeCells(r, 2, r, 4);
    sc(ws.getCell(r, 2), {
      value: "Time Table In-charge",
      bold: true,
      size: 10,
      alignH: "left",
    });
    ws.mergeCells(r, 6, r, 7);
    sc(ws.getCell(r, 6), {
      value: `Date : ${new Date().toLocaleDateString("en-IN")}`,
      size: 10,
    });
    ws.mergeCells(r, 9, r, 10);
    sc(ws.getCell(r, 9), { value: "Dean Academics", bold: true, size: 10 });
    ws.getRow(r).height = 15;

    ws.views = [{ state: "frozen", ySplit: 10 }];
  }

  return workbook.xlsx.writeBuffer();
};
