// controllers/admin/batchWeekController.js
//
// Freeform drag-and-drop editing of ONE batch's week — every theory cell
// AND every lab block, moved/swapped/cleared/added freely — without ever
// writing to GeneratedSlot or TimetableSkeleton. Same manual_entries /
// hidden_assignment_ids mechanism manualReviewController.js already
// commits through; this just lets the admin drive it directly from the
// Institute view instead of only via review-item resolution.
//
// IMPORTANT — single-batch-only guard: if a cell's underlying assignment
// covers MORE than one batch (a joint/shared session — e.g. an elective
// several batches attend together), we never hide or move it here. Doing
// so would silently pull it out from under every other batch sharing it,
// since hidden_assignment_ids hides an assignment id from a cell for
// EVERYONE who reads that cell, not just the batch being edited. Those
// cells come back from buildSlotMap/lookups same as always, so the admin
// still SEES them, they're just not draggable — surfaced to the frontend
// so it can lock them, and rejected here too if something slips through.
//
// CHANGED: saveBatchWeek now calls reconcileUnplacedItems after saving the
// grid. This was the main gap — dragging a course off its only cell (or
// clearing it) here previously never told ManualReviewItem anything, so a
// course could go completely missing from the timetable with no "unplaced"
// item ever created to prompt the admin to fix it, and conversely a
// resolved "unplaced" item could keep claiming a course was handled after
// an admin removed it via this view. This makes the slot editor, the
// manual-review queue, and this drag-and-drop view agree on the same
// placement state.
//
// Route: PATCH /api/v1/admin/timetable/engine/schedule/:timetable_id/batch-week
// Body: {
//   batch_id, batch_name,
//   changes: [
//     { day, track, periods: [p, ...], entry: { course_code, faculty_code, component_type } | null }
//   ]
// }
// `periods` is 1 item for a normal cell, 3 for a lab block — same content
// is applied to every period listed (a lab is 3 grid cells, not 1).

import { TimetableSchedule } from "../../models/timetableScheduleModel.js";
import { GeneratedSlot } from "../../models/generatedSlotModel.js";
import { computeScheduleWarnings } from "../../utils/scheduleWarnings.js";
import { reconcileUnplacedItems } from "../../utils/syncManualReview.js";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

async function buildSlotMap(session_id, generation_id) {
  const slots = await GeneratedSlot.find({ session_id, generation_id }).lean();
  return Object.fromEntries(slots.map((s) => [s.slot_name, s.entries ?? []]));
}

function flatToTimetableShape(flatGrid) {
  const out = {};
  for (const day of DAYS) {
    const t1 = flatGrid
      .filter((c) => c.day === day && c.track === 1)
      .sort((a, b) => a.period_index - b.period_index);
    const t2 = flatGrid
      .filter((c) => c.day === day && c.track === 2)
      .sort((a, b) => a.period_index - b.period_index);
    out[day] = { track1: t1, track2: t2.length ? t2 : null };
  }
  return out;
}

export const saveBatchWeek = async (req, res) => {
  try {
    const { timetable_id } = req.params;
    const { batch_id, batch_name, changes } = req.body;

    if (
      !batch_id ||
      !batch_name ||
      !Array.isArray(changes) ||
      !changes.length
    ) {
      return res.status(400).json({
        success: false,
        message: "batch_id, batch_name, and a non-empty changes[] are required",
      });
    }

    const schedule = await TimetableSchedule.findById(timetable_id);
    if (!schedule) {
      return res
        .status(404)
        .json({ success: false, message: "Timetable not found" });
    }

    const slotMap = await buildSlotMap(
      schedule.session_id,
      schedule.generation_id,
    );
    const rejected = [];

    for (const change of changes) {
      const { day, track = 1, periods, entry } = change;
      if (!Array.isArray(periods) || !periods.length) continue;

      for (const pi of periods) {
        const cell = schedule.grid.find(
          (c) =>
            c.day === day &&
            c.period_index === Number(pi) &&
            c.track === Number(track),
        );
        if (!cell) continue;
        if (cell.slot_name === "BREAK" || cell.slot_type === "break") continue;

        // "Natural" = what the shared label actually says for this batch,
        // ignoring whatever hidden/manual state is currently on the cell.
        // Used to (a) detect joint sessions and (b) know what to hide when
        // the batch moves away from its default position.
        const labelEntries = cell.slot_name
          ? (slotMap[cell.slot_name] ?? [])
          : [];
        const natural = labelEntries.find((e) =>
          (e.batch_names ?? e.batches ?? []).includes(batch_name),
        );
        const naturalBatchCount = (
          natural?.batch_names ??
          natural?.batches ??
          []
        ).length;

        if (natural && naturalBatchCount > 1) {
          const desiredMatchesNatural =
            entry &&
            entry.course_code?.toUpperCase() ===
              natural.course_code?.toUpperCase() &&
            entry.faculty_code?.toUpperCase() ===
              natural.faculty_code?.toUpperCase();
          if (!desiredMatchesNatural) {
            const others = (natural.batch_names ?? [])
              .filter((b) => b !== batch_name)
              .join(", ");
            rejected.push(
              `${day} P${pi}: '${natural.course_code}' is a joint session shared with ${others || "other batches"} — can't be moved from here. Edit it from the Slots tab instead.`,
            );
          }
          continue; // never touch a multi-batch cell either direction
        }

        // Strip this batch's own single-batch manual entry off this cell
        // first — idempotent re-resolution, same pattern as
        // manualReviewController.js.
        cell.manual_entries = (cell.manual_entries ?? []).filter(
          (m) =>
            !(
              (m.batch_names ?? []).length === 1 &&
              m.batch_names[0] === batch_name
            ),
        );

        if (!entry) {
          if (natural?.assignment_id) {
            const hidden = new Set(
              (cell.hidden_assignment_ids ?? []).map(String),
            );
            hidden.add(String(natural.assignment_id));
            cell.hidden_assignment_ids = [...hidden];
          }
          continue;
        }

        const matchesNatural =
          natural &&
          natural.course_code?.toUpperCase() ===
            entry.course_code?.toUpperCase() &&
          natural.faculty_code?.toUpperCase() ===
            entry.faculty_code?.toUpperCase();

        if (matchesNatural) {
          // Moved back onto its natural position — unhide so the shared
          // label shows through again instead of leaving a redundant
          // manual copy behind.
          if (natural.assignment_id && cell.hidden_assignment_ids?.length) {
            cell.hidden_assignment_ids = cell.hidden_assignment_ids.filter(
              (id) => String(id) !== String(natural.assignment_id),
            );
          }
          continue;
        }

        // Differs from natural (or nothing natural here) — hide natural if
        // present, then place the batch's own manual entry.
        if (natural?.assignment_id) {
          const hidden = new Set(
            (cell.hidden_assignment_ids ?? []).map(String),
          );
          hidden.add(String(natural.assignment_id));
          cell.hidden_assignment_ids = [...hidden];
        }
        cell.manual_entries.push({
          course_code: entry.course_code.trim().toUpperCase(),
          faculty_code: entry.faculty_code.trim().toUpperCase(),
          batch_names: [batch_name],
          batch_ids: [batch_id],
          component_type:
            entry.component_type || (periods.length === 3 ? "lab" : "lecture"),
        });
      }
    }

    schedule.markModified("grid");
    await schedule.save();

    // NEW: keeps the "unplaced" review queue honest about what this
    // drag-and-drop edit just did to the grid — reopens items for anything
    // that just got cleared with nothing to replace it, and resolves items
    // for anything that just got manually placed back in.
    await reconcileUnplacedItems(schedule.session_id, schedule.generation_id);

    const warnings = computeScheduleWarnings(schedule.grid, slotMap);
    for (const msg of rejected) {
      warnings.unshift({
        type: "shared_session_locked",
        severity: "error",
        message: msg,
      });
    }

    return res.status(200).json({
      success: true,
      message: warnings.length
        ? "Saved — some arrangements need a look."
        : "Saved",
      data: { grid: flatToTimetableShape(schedule.grid), warnings },
    });
  } catch (err) {
    console.error("[saveBatchWeek]", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
