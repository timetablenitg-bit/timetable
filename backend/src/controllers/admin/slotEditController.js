// controllers/slotEditController.js
//
// Unchanged in behaviour from the original — still compatible since
// lab slot names are still "LAB_MONDAY" / "LAB_TUESDAY" / "LAB_THURSDAY"
// (matches the existing /^LAB/i filter). Kept as-is per the instruction
// to only change what the plan calls for; the "make these more purpose
// driven" refinement you mentioned wanting is a separate pass — happy to
// do it once the core engine changes are confirmed working.

import { GeneratedSlot } from "../../models/generatedSlotModel.js";

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

    if (!Array.isArray(slots) || !slots.length) {
      return res.status(400).json({ message: "slots array is required" });
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

    const docs = slots.map((s) => ({
      session_id,
      generation_id,
      slot_name: s.slot_name,
      slot_type: s.slot_type ?? "lecture",
      entries: s.entries ?? [],
    }));

    await GeneratedSlot.insertMany(docs);

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
