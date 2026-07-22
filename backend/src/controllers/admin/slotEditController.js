// controllers/slotEditController.js
//
// Unchanged in behaviour from the original — still compatible since
// lab slot names are still "LAB_MONDAY" / "LAB_TUESDAY" / "LAB_THURSDAY"
// (matches the existing /^LAB/i filter). Kept as-is per the instruction
// to only change what the plan calls for; the "make these more purpose
// driven" refinement you mentioned wanting is a separate pass — happy to
// do it once the core engine changes are confirmed working.
//
// FIXED: bulkUpdateSlots used to reject with 400 when `slots` was an empty
// array. Now that the frontend sends its whole local `slots` state through
// this one endpoint on every save (see EditableSlotsView's handleSave),
// deleting every remaining slot and saving legitimately produces an empty
// array — that's a valid "delete everything" request, not a malformed one,
// so it should go through deleteMany + insertMany([]) rather than being
// rejected.
//
// NEW: manual placements made here (bulkUpdateSlots / patchSlot / createSlot)
// now sync with the manual-review queue in both directions that matter:
//   1. resolvePendingReviewsForPlacedAssignments — if an admin manually
//      places a course that had a pending "unplaced" review item, that item
//      is auto-resolved instead of sitting stale in the queue. Scoped to
//      kind:"unplaced" only — see utils/syncManualReview.js for why
//      overflow/choose_occurrences items must NOT be touched by this (their
//      assignments are ALREADY in entries by design, that's the whole
//      reason those review kinds exist).
//   2. reconcileOccurrenceReview — if an admin places a course onto a label
//      whose day-count doesn't match the course's sessions_per_week, a
//      pending "choose_occurrences" (too many days) or "overflow" (too few
//      days) review item is created, same as slot_generator.py would have
//      done at generation time. See utils/reconcileOccurrenceReview.js for
//      the synced_with LIMITATION noted there — not handled here.

import { GeneratedSlot } from "../../models/generatedSlotModel.js";
import { CourseAssignment } from "../../models/courseAssignmentModel.js";
import { TimetableSkeleton } from "../../models/timetableSkeletonModel.js";
import { TimetableSchedule } from "../../models/timetableScheduleModel.js";
import { resolvePendingReviewsForPlacedAssignments } from "../../utils/syncManualReview.js";
import { reconcileOccurrenceReview } from "../../utils/reconcileOccurrenceReview.js";

async function latestGenerationId(session_id) {
  const latest = await GeneratedSlot.findOne({ session_id })
    .sort({ createdAt: -1 })
    .select("generation_id")
    .lean();
  return latest?.generation_id ?? null;
}

function validateEntries(entries = []) {
  for (const e of entries) {
    if (!e.course_code) return "Each entry must have a course_code";
    if (!e.faculty_code) return "Each entry must have a faculty_code";
  }
  return null;
}

function checkConflicts(entries = []) {
  const faculties = {};
  const batches = {};
  const conflicts = [];

  entries.forEach((e) => {
    const fac = e.faculty_code;
    if (faculties[fac]) {
      conflicts.push(`Faculty ${fac} appears more than once`);
    } else {
      faculties[fac] = true;
    }
    (e.batch_names ?? []).forEach((b) => {
      if (batches[b]) {
        conflicts.push(`Batch ${b} appears more than once`);
      } else {
        batches[b] = true;
      }
    });
  });

  return conflicts.length ? { ok: false, conflicts } : { ok: true };
}

export const bulkUpdateSlots = async (req, res) => {
  try {
    const { session_id } = req.params;
    const { slots } = req.body;

    // FIXED: was `!Array.isArray(slots) || !slots.length`, which rejected a
    // legitimate "delete everything" save (empty array = no surviving
    // slots). Only reject when the payload isn't an array at all.
    if (!Array.isArray(slots)) {
      return res.status(400).json({ message: "slots must be an array" });
    }

    const generation_id = await latestGenerationId(session_id);
    if (!generation_id) {
      return res
        .status(404)
        .json({ message: "No generated slots found for this session" });
    }

    const warnings = [];
    for (const slot of slots) {
      if (!slot.slot_name) {
        return res
          .status(400)
          .json({ message: "Each slot must have a slot_name" });
      }
      const entryError = validateEntries(slot.entries);
      if (entryError) {
        return res
          .status(400)
          .json({ message: `Slot ${slot.slot_name}: ${entryError}` });
      }
      const { ok, conflicts } = checkConflicts(slot.entries);
      if (!ok) warnings.push({ slot: slot.slot_name, conflicts });
    }

    await GeneratedSlot.deleteMany({
      session_id,
      generation_id,
      slot_name: { $not: /^LAB/i },
    });

    if (slots.length) {
      const docs = slots.map((s) => ({
        session_id,
        generation_id,
        slot_name: s.slot_name,
        slot_type: s.slot_type ?? "lecture",
        entries: s.entries ?? [],
      }));

      await GeneratedSlot.insertMany(docs);

      const placedAssignmentIds = docs.flatMap((d) =>
        (d.entries ?? []).map((e) => e.assignment_id).filter(Boolean),
      );
      await resolvePendingReviewsForPlacedAssignments(
        session_id,
        generation_id,
        placedAssignmentIds,
      );

      for (const doc of docs) {
        await reconcileOccurrenceReview({
          session_id,
          generation_id,
          slot_name: doc.slot_name,
          entries: doc.entries,
        });
      }
    }

    const allSlots = await GeneratedSlot.find({ session_id, generation_id })
      .sort({ slot_name: 1 })
      .lean();

    return res.status(200).json({
      message: "Slots updated successfully",
      warnings,
      slots: allSlots,
    });
  } catch (err) {
    console.error("[bulkUpdateSlots]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const patchSlot = async (req, res) => {
  try {
    const { session_id, slot_name } = req.params;
    const { entries, slot_name: newName, slot_type } = req.body;

    const generation_id = await latestGenerationId(session_id);
    if (!generation_id) {
      return res
        .status(404)
        .json({ message: "No generated slots found for this session" });
    }

    const slot = await GeneratedSlot.findOne({
      session_id,
      generation_id,
      slot_name,
    });
    if (!slot) {
      return res.status(404).json({ message: `Slot ${slot_name} not found` });
    }

    if (entries !== undefined) {
      const entryError = validateEntries(entries);
      if (entryError) return res.status(400).json({ message: entryError });

      const { ok, conflicts } = checkConflicts(entries);
      slot.entries = entries;

      const placedAssignmentIds = entries
        .map((e) => e.assignment_id)
        .filter(Boolean);
      await resolvePendingReviewsForPlacedAssignments(
        session_id,
        generation_id,
        placedAssignmentIds,
      );
      await reconcileOccurrenceReview({
        session_id,
        generation_id,
        slot_name: slot.slot_name,
        entries,
      });

      if (!ok) {
        await slot.save();
        return res.status(200).json({
          message: "Slot updated with conflict warnings",
          warnings: conflicts,
          slot,
        });
      }
    }

    if (newName && newName !== slot_name) {
      const exists = await GeneratedSlot.findOne({
        session_id,
        generation_id,
        slot_name: newName,
      });
      if (exists) {
        return res
          .status(409)
          .json({ message: `Slot ${newName} already exists` });
      }
      slot.slot_name = newName;
    }

    if (slot_type) slot.slot_type = slot_type;

    await slot.save();
    return res.status(200).json({ message: "Slot updated", slot });
  } catch (err) {
    console.error("[patchSlot]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createSlot = async (req, res) => {
  try {
    const { session_id } = req.params;
    const { slot_name, slot_type = "lecture", entries = [] } = req.body;

    if (!slot_name)
      return res.status(400).json({ message: "slot_name is required" });

    const generation_id = await latestGenerationId(session_id);
    if (!generation_id) {
      return res
        .status(404)
        .json({ message: "No generated slots found for this session" });
    }

    const existing = await GeneratedSlot.findOne({
      session_id,
      generation_id,
      slot_name,
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: `Slot ${slot_name} already exists` });
    }

    const entryError = validateEntries(entries);
    if (entryError) return res.status(400).json({ message: entryError });

    const { ok, conflicts } = checkConflicts(entries);

    const slot = await GeneratedSlot.create({
      session_id,
      generation_id,
      slot_name,
      slot_type,
      entries,
    });

    const placedAssignmentIds = entries
      .map((e) => e.assignment_id)
      .filter(Boolean);
    await resolvePendingReviewsForPlacedAssignments(
      session_id,
      generation_id,
      placedAssignmentIds,
    );
    await reconcileOccurrenceReview({
      session_id,
      generation_id,
      slot_name,
      entries,
    });

    return res.status(201).json({
      message: "Slot created",
      warnings: ok ? [] : conflicts,
      slot,
    });
  } catch (err) {
    console.error("[createSlot]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteSlot = async (req, res) => {
  try {
    const { session_id, slot_name } = req.params;

    const generation_id = await latestGenerationId(session_id);
    if (!generation_id) {
      return res
        .status(404)
        .json({ message: "No generated slots found for this session" });
    }

    const result = await GeneratedSlot.deleteOne({
      session_id,
      generation_id,
      slot_name,
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: `Slot ${slot_name} not found` });
    }

    return res.status(200).json({ message: `Slot ${slot_name} deleted` });
  } catch (err) {
    console.error("[deleteSlot]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/v1/admin/timetable/slots/:session_id/unplaced
 *
 * Returns every CourseAssignment for the session whose assignment_id does NOT
 * appear in any entry of the latest generation's slots (lecture, lab, minor,
 * oe, tutorial — all of them), NOR in any manual_entries placed directly on
 * the TimetableSchedule grid (overflow / minor-OE overrides from manual
 * review). This is what powers the "pick a course" modal instead of the
 * admin typing course/faculty/batch by hand.
 */
export const getUnplacedAssignments = async (req, res) => {
  try {
    const { session_id } = req.params;

    const generation_id = await latestGenerationId(session_id);
    if (!generation_id) {
      return res
        .status(404)
        .json({ message: "No generated slots found for this session" });
    }

    const [assignments, slots, schedule] = await Promise.all([
      CourseAssignment.find({ session_id })
        .populate("course_id")
        .populate("faculty_id")
        .populate("batch_ids")
        .lean(),
      GeneratedSlot.find({ session_id, generation_id }).lean(),
      TimetableSchedule.findOne({ session_id, generation_id }).lean(),
    ]);

    const placedIds = new Set();
    for (const slot of slots) {
      for (const e of slot.entries ?? []) {
        if (e.assignment_id) placedIds.add(String(e.assignment_id));
      }
    }

    // Manual-review resolutions that live on the schedule grid rather than
    // in a GeneratedSlot doc — overflow placements and minor/OE overrides —
    // also count as "placed". Otherwise a course resolved via manual review
    // would keep showing up in the slot editor's "add unplaced course" picker.
    for (const cell of schedule?.grid ?? []) {
      for (const e of cell.manual_entries ?? []) {
        if (e.assignment_id) placedIds.add(String(e.assignment_id));
      }
    }

    const unplaced = assignments
      .filter((a) => !placedIds.has(String(a._id)))
      .map((a) => ({
        assignment_id: a._id,
        course_code: a.course_id?.course_code ?? "",
        course_name: a.course_id?.course_name ?? "",
        faculty_code: a.faculty_id?.faculty_code ?? "",
        faculty_id: a.faculty_id?._id ?? null,
        // NOTE: adjust `.name` below to whatever field your Batch model
        // actually stores the display name on (I've guessed `name`, with a
        // couple of fallbacks so this doesn't silently break).
        batch_names: (a.batch_ids ?? []).map(
          (b) => b.name ?? b.batch_name ?? String(b._id),
        ),
        batch_ids: (a.batch_ids ?? []).map((b) => b._id),
        component_type:
          a.assignment_type === "minor"
            ? "minor"
            : a.assignment_type === "oe"
              ? "oe"
              : (a.component_type ?? "lecture"),
      }));

    return res.status(200).json({ message: "Unplaced assignments", unplaced });
  } catch (err) {
    console.error("[getUnplacedAssignments]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/v1/admin/timetable/slots/:session_id/available-labels
 *
 * Returns the skeleton labels (e.g. "G", "H") that exist on the active
 * skeleton but have NO GeneratedSlot doc yet for the latest generation —
 * i.e. the labels the engine skipped because there weren't any matching
 * assignments (no minor-type courses => no "G", no OE-type => no "H").
 * This is the whitelist the "Add slot" button should offer — never an
 * arbitrary new letter, since anything not on the skeleton has no time
 * cells and can't render in the schedule grid.
 */
export const getAvailableSlotLabels = async (req, res) => {
  try {
    const { session_id } = req.params;

    const skeleton = await TimetableSkeleton.findOne({
      session_id,
      is_active: true,
    }).lean();
    if (!skeleton) {
      return res
        .status(404)
        .json({ message: "No active skeleton for this session" });
    }

    const skeletonLabels = new Set();
    for (const c of skeleton.cells) {
      if (!c.slot_label) continue;
      if (["LAB", "BREAK", "LUNCH"].includes(c.slot_label)) continue;
      skeletonLabels.add(c.slot_label);
    }

    const generation_id = await latestGenerationId(session_id);
    let usedLabels = new Set();
    if (generation_id) {
      const slots = await GeneratedSlot.find({ session_id, generation_id })
        .select("slot_name")
        .lean();
      usedLabels = new Set(slots.map((s) => s.slot_name));
    }

    const available = [...skeletonLabels]
      .filter((l) => !usedLabels.has(l))
      .sort();

    return res
      .status(200)
      .json({ message: "Available slot labels", available });
  } catch (err) {
    console.error("[getAvailableSlotLabels]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
