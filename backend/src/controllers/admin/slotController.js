// controllers/slotEditController.js
// Handles:
//   PUT  /api/v1/admin/timetable/slots/:session_id          — bulk replace slots
//   PATCH /api/v1/admin/timetable/slots/:session_id/:slot_name — patch one slot
//   POST  /api/v1/admin/timetable/slots/:session_id          — create a new slot
//   DELETE /api/v1/admin/timetable/slots/:session_id/:slot_name — delete a slot

import mongoose from "mongoose";
import { GeneratedSlot } from "../../models/generatedSlotModel.js";

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the most-recent generation_id for a session.
 * All edits target the latest generation run.
 */
async function latestGenerationId(session_id) {
  const latest = await GeneratedSlot.findOne({ session_id })
    .sort({ createdAt: -1 })
    .select("generation_id")
    .lean();
  return latest?.generation_id ?? null;
}

/**
 * Validate entries array — lightweight check before writing.
 */
function validateEntries(entries = []) {
  for (const e of entries) {
    if (!e.course_code) return "Each entry must have a course_code";
    if (!e.faculty_code) return "Each entry must have a faculty_code";
  }
  return null;
}

/**
 * Detect hard conflicts within a single slot's entries.
 * Returns { ok: true } or { ok: false, conflicts: [...] }
 */
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

// ── controllers ───────────────────────────────────────────────────────────────

/**
 * PUT /api/v1/admin/timetable/slots/:session_id
 * Body: { slots: [{ slot_name, slot_type, entries: [...] }] }
 *
 * Bulk-replaces ALL lecture/tutorial slots for the latest generation.
 * LAB slots are untouched (filtered out automatically).
 */
export const bulkUpdateSlots = async (req, res) => {
  try {
    const { session_id } = req.params;
    const { slots } = req.body;

    if (!Array.isArray(slots) || !slots.length) {
      return res.status(400).json({ message: "slots array is required" });
    }

    const generation_id = await latestGenerationId(session_id);
    if (!generation_id) {
      return res
        .status(404)
        .json({ message: "No generated slots found for this session" });
    }

    // Validate + check conflicts for each slot
    const warnings = [];
    for (const slot of slots) {
      if (!slot.slot_name)
        return res
          .status(400)
          .json({ message: "Each slot must have a slot_name" });

      const entryError = validateEntries(slot.entries);
      if (entryError)
        return res
          .status(400)
          .json({ message: `Slot ${slot.slot_name}: ${entryError}` });

      const { ok, conflicts } = checkConflicts(slot.entries);
      if (!ok) {
        // Warn but still allow — admin override
        warnings.push({ slot: slot.slot_name, conflicts });
      }
    }

    // Delete existing non-LAB slots for this generation
    await GeneratedSlot.deleteMany({
      session_id,
      generation_id,
      slot_name: { $not: /^LAB/i },
    });

    // Upsert all incoming slots
    const docs = slots.map((s) => ({
      session_id,
      generation_id,
      slot_name: s.slot_name,
      slot_type: s.slot_type ?? "lecture",
      entries: s.entries ?? [],
    }));

    const inserted = await GeneratedSlot.insertMany(docs);

    // Return the full refreshed list (including LAB slots)
    const allSlots = await GeneratedSlot.find({
      session_id,
      generation_id,
    })
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

/**
 * PATCH /api/v1/admin/timetable/slots/:session_id/:slot_name
 * Body: { entries: [...] }          — replace entries for one slot
 *    OR { slot_name: "X" }          — rename the slot
 *    OR both
 */
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
      // Allow save but attach warnings
      slot.entries = entries;
      if (!ok) {
        // Still save, but surface warnings
        await slot.save();
        return res.status(200).json({
          message: "Slot updated with conflict warnings",
          warnings: conflicts,
          slot,
        });
      }
    }

    if (newName && newName !== slot_name) {
      // Check name not already taken
      const exists = await GeneratedSlot.findOne({
        session_id,
        generation_id,
        slot_name: newName,
      });
      if (exists)
        return res
          .status(409)
          .json({ message: `Slot ${newName} already exists` });
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

/**
 * POST /api/v1/admin/timetable/slots/:session_id
 * Body: { slot_name, slot_type?, entries?: [...] }
 *
 * Creates a brand-new slot under the latest generation_id.
 */
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

    // Prevent duplicates
    const existing = await GeneratedSlot.findOne({
      session_id,
      generation_id,
      slot_name,
    });
    if (existing)
      return res
        .status(409)
        .json({ message: `Slot ${slot_name} already exists` });

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

/**
 * DELETE /api/v1/admin/timetable/slots/:session_id/:slot_name
 */
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

    if (result.deletedCount === 0)
      return res.status(404).json({ message: `Slot ${slot_name} not found` });

    return res.status(200).json({ message: `Slot ${slot_name} deleted` });
  } catch (err) {
    console.error("[deleteSlot]", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
