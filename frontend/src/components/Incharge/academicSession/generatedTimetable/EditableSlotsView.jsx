// EditableSlotsView.jsx
import React, { useMemo, useState, useCallback } from "react";
import { SLOT_COLORS } from "./colors";
import {
  Plus,
  Trash2,
  GripVertical,
  X,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import useAdminStore from "../../../../store/useAdminStore"; // ← adjust path to your store

// ── helpers ──────────────────────────────────────────────────────────────────

const SLOT_COLOR_KEYS = Object.keys(SLOT_COLORS);

function nextSlotName(existingNames) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const c of alphabet) {
    if (!existingNames.includes(c)) return c;
  }
  let n = 1;
  while (existingNames.includes(`LAB${n}`)) n++;
  return `LAB${n}`;
}

function colorForSlot(name) {
  return (
    SLOT_COLORS[name] ??
    SLOT_COLORS[SLOT_COLOR_KEYS[name.charCodeAt(0) % SLOT_COLOR_KEYS.length]]
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

const ConflictBadge = ({ message }) => (
  <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded px-1.5 py-0.5 mt-1">
    <AlertCircle size={9} />
    <span>{message}</span>
  </div>
);

function detectConflicts(entries) {
  const faculties = {};
  const batches = {};
  entries.forEach((e, idx) => {
    const fac = e.faculty_code ?? e.faculty;
    if (fac) {
      if (faculties[fac] === undefined) faculties[fac] = idx;
      else faculties[fac] = "dup";
    }
    (e.batch_names ?? e.batches ?? []).forEach((b) => {
      if (batches[b] === undefined) batches[b] = idx;
      else batches[b] = "dup";
    });
  });
  const dupFacs = Object.entries(faculties)
    .filter(([, v]) => v === "dup")
    .map(([k]) => k);
  const dupBatches = Object.entries(batches)
    .filter(([, v]) => v === "dup")
    .map(([k]) => k);
  return { dupFacs, dupBatches };
}

// ── AddEntryModal ─────────────────────────────────────────────────────────────

const AddEntryModal = ({ onAdd, onClose }) => {
  const [courseCode, setCourseCode] = useState("");
  const [facultyCode, setFacultyCode] = useState("");
  const [batchNames, setBatchNames] = useState("");
  const [componentType, setComponentType] = useState("lecture");

  const handleSubmit = () => {
    if (!courseCode.trim() || !facultyCode.trim()) return;
    onAdd({
      course_code: courseCode.trim().toUpperCase(),
      faculty_code: facultyCode.trim().toUpperCase(),
      batch_names: batchNames
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
      batch_ids: [],
      component_type: componentType,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-80 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Add course entry
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Course code
            </span>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="CS301"
              className="mt-1 w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Faculty code
            </span>
            <input
              type="text"
              value={facultyCode}
              onChange={(e) => setFacultyCode(e.target.value)}
              placeholder="JDO"
              className="mt-1 w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Batches (comma-separated)
            </span>
            <input
              type="text"
              value={batchNames}
              onChange={(e) => setBatchNames(e.target.value)}
              placeholder="CS-A, CS-B"
              className="mt-1 w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Component type
            </span>
            <div className="relative mt-1">
              <select
                value={componentType}
                onChange={(e) => setComponentType(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-400 appearance-none pr-7"
              >
                {["lecture", "lab", "tutorial", "minor", "oe"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={10}
                className="absolute right-2 top-2 text-gray-400 pointer-events-none"
              />
            </div>
          </label>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!courseCode.trim() || !facultyCode.trim()}
            className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

// ── main component ────────────────────────────────────────────────────────────

const EditableSlotsView = ({ slotsData, editMode = false, sessionId }) => {
  // ── store ────────────────────────────────────────────────────────────────
  const bulkUpdateSlots = useAdminStore((s) => s.bulkUpdateSlots);
  const createSlot = useAdminStore((s) => s.createSlot);
  const deleteSlot = useAdminStore((s) => s.deleteSlot);
  const patchSlot = useAdminStore((s) => s.patchSlot);
  const isSavingSlots = useAdminStore((s) => s.isSavingSlots);
  const slotsError = useAdminStore((s) => s.slotsError);

  const { slots: rawSlots } = slotsData;

  // Local optimistic copy — only lecture slots shown in this table.
  // Edits (drag/drop, add entry, delete entry) stay local until the user
  // hits "Save slots", which fires bulkUpdateSlots for all dirty slots.
  const [slots, setSlots] = useState(() =>
    rawSlots
      .filter((s) => !s.slot_name.startsWith("LAB"))
      .map((s) => ({ ...s, entries: [...(s.entries ?? [])] })),
  );

  // Track which slot names have been added or deleted locally so we can
  // route them to createSlot / deleteSlot on save instead of patchSlot.
  const [addedSlots, setAddedSlots] = useState(new Set()); // slot_names pending createSlot
  const [deletedSlots, setDeletedSlots] = useState(new Set()); // slot_names pending deleteSlot

  const [dragSource, setDragSource] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [addModal, setAddModal] = useState(null); // slotName
  const [warnings, setWarnings] = useState([]);

  // Re-sync when slotsData changes externally (e.g. after a rework trigger).
  React.useEffect(() => {
    setSlots(
      rawSlots
        .filter((s) => !s.slot_name.startsWith("LAB"))
        .map((s) => ({ ...s, entries: [...(s.entries ?? [])] })),
    );
    setAddedSlots(new Set());
    setDeletedSlots(new Set());
    setWarnings([]);
  }, [rawSlots]);

  const allBatches = useMemo(() => {
    const seen = new Set();
    slots.forEach((sl) =>
      sl.entries.forEach((e) =>
        (e.batch_names ?? e.batches ?? []).forEach((b) => seen.add(b)),
      ),
    );
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [slots]);

  const getEntry = useCallback(
    (slotName, batch) => {
      const sl = slots.find((s) => s.slot_name === slotName);
      return (
        sl?.entries.find((e) =>
          (e.batch_names ?? e.batches ?? []).includes(batch),
        ) ?? null
      );
    },
    [slots],
  );

  // ── drag handlers ─────────────────────────────────────────────────────────

  const handleDragStart = (slotName, entryIdx) => {
    setDragSource({ slotName, entryIdx });
  };

  const handleDragOver = (e, slotName) => {
    e.preventDefault();
    setDragOver({ slotName });
  };

  const handleDrop = (e, targetSlotName) => {
    e.preventDefault();
    if (!dragSource) return;
    const { slotName: srcSlot, entryIdx } = dragSource;
    if (srcSlot === targetSlotName) {
      setDragSource(null);
      setDragOver(null);
      return;
    }
    setSlots((prev) => {
      const next = prev.map((s) => ({ ...s, entries: [...s.entries] }));
      const src = next.find((s) => s.slot_name === srcSlot);
      const dst = next.find((s) => s.slot_name === targetSlotName);
      if (!src || !dst) return prev;
      const [entry] = src.entries.splice(entryIdx, 1);
      dst.entries.push(entry);
      return next;
    });
    setDragSource(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    setDragSource(null);
    setDragOver(null);
  };

  // ── entry management ──────────────────────────────────────────────────────

  const handleDeleteEntry = (slotName, entryIdx) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.slot_name === slotName
          ? { ...s, entries: s.entries.filter((_, i) => i !== entryIdx) }
          : s,
      ),
    );
  };

  const handleAddEntry = (slotName, entry) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.slot_name === slotName ? { ...s, entries: [...s.entries, entry] } : s,
      ),
    );
  };

  // ── slot management ───────────────────────────────────────────────────────

  const handleAddSlot = () => {
    const name = nextSlotName(slots.map((s) => s.slot_name));
    setSlots((prev) => [
      ...prev,
      { slot_name: name, slot_type: "lecture", entries: [] },
    ]);
    setAddedSlots((prev) => new Set([...prev, name]));
    // If this slot was previously queued for deletion (edge case), unmark it.
    setDeletedSlots((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  };

  const handleDeleteSlot = (slotName) => {
    setSlots((prev) => prev.filter((s) => s.slot_name !== slotName));
    if (addedSlots.has(slotName)) {
      // Never persisted — just remove from the "to-create" set.
      setAddedSlots((prev) => {
        const next = new Set(prev);
        next.delete(slotName);
        return next;
      });
    } else {
      setDeletedSlots((prev) => new Set([...prev, slotName]));
    }
  };

  // ── save ──────────────────────────────────────────────────────────────────
  //
  // Strategy:
  //   1. DELETE slots that were removed locally.
  //   2. CREATE slots that are brand-new.
  //   3. PATCH (or bulk-update) every surviving slot whose entries may have changed.
  //
  // We use bulkUpdateSlots for step 3 to send a single round-trip instead of
  // one patchSlot call per slot.

  const handleSave = async () => {
    setWarnings([]);
    const allWarnings = [];

    // 1 — delete removed slots
    for (const slotName of deletedSlots) {
      const result = await deleteSlot(sessionId, slotName);
      if (!result.ok) return; // store has set slotsError; bail out
    }

    // 2 — create new slots (with their current entries)
    for (const slotName of addedSlots) {
      const sl = slots.find((s) => s.slot_name === slotName);
      if (!sl) continue;
      const result = await createSlot(sessionId, {
        slot_name: sl.slot_name,
        slot_type: sl.slot_type ?? "lecture",
        entries: sl.entries,
      });
      if (!result.ok) return;
      if (result.warnings?.length) allWarnings.push(...result.warnings);
    }

    // 3 — bulk-update all surviving (non-new) slots
    const survivingSlots = slots.filter((s) => !addedSlots.has(s.slot_name));
    if (survivingSlots.length) {
      const result = await bulkUpdateSlots(sessionId, survivingSlots);
      if (!result.ok) return;
      if (result.warnings?.length) allWarnings.push(...result.warnings);
    }

    // All good — clear pending sets and surface any warnings
    setAddedSlots(new Set());
    setDeletedSlots(new Set());
    if (allWarnings.length) setWarnings(allWarnings);
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {editMode && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Drag courses between slots · click{" "}
            <span className="font-medium text-emerald-500">+</span> to add ·{" "}
            <span className="font-medium text-red-400">×</span> to remove
          </p>

          <div className="flex items-center gap-2">
            {/* Store-level error */}
            {slotsError && (
              <span className="text-[10px] text-red-500">{slotsError}</span>
            )}

            {/* Per-save warnings (non-blocking) */}
            {warnings.map((w, i) => (
              <span key={i} className="text-[10px] text-amber-500">
                {w}
              </span>
            ))}

            <button
              onClick={handleAddSlot}
              disabled={isSavingSlots}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-500 disabled:opacity-40 transition-colors"
            >
              <Plus size={11} />
              Add slot
            </button>

            <button
              onClick={handleSave}
              disabled={isSavingSlots}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium transition-colors"
            >
              {isSavingSlots ? "Saving…" : "Save slots"}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <table
          className="border-collapse"
          style={{ minWidth: 640, width: "100%" }}
        >
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/80">
              <th
                className="border border-gray-100 dark:border-gray-700 px-4 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-800/80 z-10"
                style={{ minWidth: 140 }}
              >
                Batch
              </th>
              {slots.map((sl) => (
                <th
                  key={sl.slot_name}
                  className={`border border-gray-100 dark:border-gray-700 px-3 py-2 text-center transition-colors ${
                    dragOver?.slotName === sl.slot_name && editMode
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : ""
                  }`}
                  style={{ minWidth: 110 }}
                  onDragOver={
                    editMode
                      ? (e) => handleDragOver(e, sl.slot_name)
                      : undefined
                  }
                  onDrop={
                    editMode ? (e) => handleDrop(e, sl.slot_name) : undefined
                  }
                >
                  <div className="flex items-center justify-center gap-1">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border text-sm font-bold ${colorForSlot(sl.slot_name)}`}
                    >
                      {sl.slot_name}
                    </span>
                    {editMode && (
                      <>
                        <button
                          onClick={() => setAddModal(sl.slot_name)}
                          className="text-gray-300 hover:text-emerald-500 dark:text-gray-600 dark:hover:text-emerald-400 transition-colors"
                          title="Add course to this slot"
                        >
                          <Plus size={11} />
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(sl.slot_name)}
                          className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition-colors"
                          title="Delete slot"
                        >
                          <Trash2 size={10} />
                        </button>
                      </>
                    )}
                  </div>
                  {(() => {
                    const { dupFacs, dupBatches } = detectConflicts(sl.entries);
                    if (dupFacs.length || dupBatches.length) {
                      return (
                        <ConflictBadge
                          message={
                            dupFacs.length
                              ? `Faculty clash: ${dupFacs.join(", ")}`
                              : `Batch clash: ${dupBatches.join(", ")}`
                          }
                        />
                      );
                    }
                    return (
                      <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 font-normal">
                        {sl.entries[0]?.sessions_per_week ?? 1}×/wk
                      </p>
                    );
                  })()}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {allBatches.map((batch, bi) => (
              <tr
                key={batch}
                className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${
                  bi % 2 ? "bg-gray-50/30 dark:bg-gray-800/10" : ""
                }`}
              >
                <td className="border border-gray-100 dark:border-gray-700 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 z-10">
                  {batch}
                </td>
                {slots.map((sl) => {
                  const entry = getEntry(sl.slot_name, batch);
                  const entryIdx = sl.entries.findIndex((e) =>
                    (e.batch_names ?? e.batches ?? []).includes(batch),
                  );
                  const isDragging =
                    dragSource?.slotName === sl.slot_name &&
                    dragSource?.entryIdx === entryIdx;
                  const isOver =
                    dragOver?.slotName === sl.slot_name && editMode;

                  if (!entry) {
                    return (
                      <td
                        key={sl.slot_name}
                        className={`border border-gray-100 dark:border-gray-700 px-3 py-2 text-center transition-colors ${
                          isOver
                            ? "bg-emerald-50/60 dark:bg-emerald-900/10"
                            : ""
                        }`}
                        onDragOver={
                          editMode
                            ? (e) => handleDragOver(e, sl.slot_name)
                            : undefined
                        }
                        onDrop={
                          editMode
                            ? (e) => handleDrop(e, sl.slot_name)
                            : undefined
                        }
                      >
                        <span className="text-[10px] text-gray-200 dark:text-gray-700">
                          —
                        </span>
                      </td>
                    );
                  }

                  const code = entry.course_code ?? entry.course ?? "—";
                  const fac = entry.faculty_code ?? entry.faculty ?? "";
                  const color = colorForSlot(sl.slot_name);

                  return (
                    <td
                      key={sl.slot_name}
                      className={`border border-gray-100 dark:border-gray-700 px-1.5 py-1.5 transition-colors ${
                        isOver ? "bg-emerald-50/60 dark:bg-emerald-900/10" : ""
                      }`}
                      onDragOver={
                        editMode
                          ? (e) => handleDragOver(e, sl.slot_name)
                          : undefined
                      }
                      onDrop={
                        editMode
                          ? (e) => handleDrop(e, sl.slot_name)
                          : undefined
                      }
                    >
                      <div
                        className={`rounded-md border px-2 py-1.5 text-center relative group ${color} ${
                          isDragging ? "opacity-30" : ""
                        } ${
                          editMode
                            ? "cursor-grab active:cursor-grabbing hover:shadow-sm"
                            : ""
                        }`}
                        draggable={editMode}
                        onDragStart={
                          editMode
                            ? () => handleDragStart(sl.slot_name, entryIdx)
                            : undefined
                        }
                        onDragEnd={editMode ? handleDragEnd : undefined}
                      >
                        {editMode && (
                          <button
                            onClick={() =>
                              handleDeleteEntry(sl.slot_name, entryIdx)
                            }
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-400 text-white hidden group-hover:flex items-center justify-center z-10"
                            title="Remove entry"
                          >
                            <X size={8} />
                          </button>
                        )}
                        {editMode && (
                          <GripVertical
                            size={9}
                            className="absolute left-1 top-1/2 -translate-y-1/2 opacity-30"
                          />
                        )}
                        <p className="text-[11px] font-bold leading-none">
                          {code}
                        </p>
                        {fac && (
                          <p className="text-[9px] mt-0.5 opacity-60 leading-none">
                            {fac}
                          </p>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Unassigned entries (no batch) */}
            {slots.some((sl) =>
              sl.entries.some(
                (e) => !(e.batch_names ?? e.batches ?? []).length,
              ),
            ) && (
              <tr className="bg-amber-50/30 dark:bg-amber-900/10">
                <td className="border border-gray-100 dark:border-gray-700 px-4 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 sticky left-0 bg-amber-50/50 dark:bg-amber-900/10 z-10">
                  (no batch)
                </td>
                {slots.map((sl) => {
                  const unassigned = sl.entries.filter(
                    (e) => !(e.batch_names ?? e.batches ?? []).length,
                  );
                  if (!unassigned.length)
                    return (
                      <td
                        key={sl.slot_name}
                        className="border border-gray-100 dark:border-gray-700"
                      />
                    );
                  return (
                    <td
                      key={sl.slot_name}
                      className="border border-gray-100 dark:border-gray-700 px-1.5 py-1.5"
                    >
                      {unassigned.map((e, i) => {
                        const realIdx = sl.entries.indexOf(e);
                        return (
                          <div
                            key={i}
                            className={`rounded-md border px-2 py-1.5 text-center relative group mb-1 ${colorForSlot(sl.slot_name)} ${
                              editMode ? "cursor-grab" : ""
                            }`}
                            draggable={editMode}
                            onDragStart={
                              editMode
                                ? () => handleDragStart(sl.slot_name, realIdx)
                                : undefined
                            }
                            onDragEnd={editMode ? handleDragEnd : undefined}
                          >
                            {editMode && (
                              <button
                                onClick={() =>
                                  handleDeleteEntry(sl.slot_name, realIdx)
                                }
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-400 text-white hidden group-hover:flex items-center justify-center z-10"
                              >
                                <X size={8} />
                              </button>
                            )}
                            <p className="text-[11px] font-bold leading-none">
                              {e.course_code ?? e.course ?? "—"}
                            </p>
                          </div>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {addModal && (
        <AddEntryModal
          onAdd={(entry) => handleAddEntry(addModal, entry)}
          onClose={() => setAddModal(null)}
        />
      )}
    </div>
  );
};

export default EditableSlotsView;
