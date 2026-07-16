// EditableSlotsView.jsx
import React, {
  useMemo,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { SLOT_COLORS } from "./colors";
import {
  Plus,
  Trash2,
  GripVertical,
  X,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import useAdminStore from "../../../../store/admin/index"; // ← adjust path to your store

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

function getBatches(entry) {
  return entry?.batch_names ?? entry?.batches ?? [];
}

// ── sub-components ────────────────────────────────────────────────────────────

const ConflictBadge = ({ message }) => (
  <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 mt-1">
    <span className="w-1 h-1 rounded-full bg-amber-500" />
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
    getBatches(e).forEach((b) => {
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

const FIELD_LABEL =
  "text-[10px] font-medium text-gray-400 dark:text-gray-500 tracking-wide";
const FIELD_INPUT =
  "mt-1 w-full text-[13px] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors";

const AddEntryModal = ({ onAdd, onClose }) => {
  const [courseCode, setCourseCode] = useState("");
  const [facultyCode, setFacultyCode] = useState("");
  const [batchNames, setBatchNames] = useState("");
  const [componentType, setComponentType] = useState("lecture");
  const [error, setError] = useState(null);

  const handleSubmit = () => {
    if (!courseCode.trim() || !facultyCode.trim()) return;

    // onAdd returns false when the batch(es) already have a class in this
    // slot — in that case we keep the modal open and show why, instead of
    // silently closing on a rejected add.
    const ok = onAdd({
      course_code: courseCode.trim().toUpperCase(),
      faculty_code: facultyCode.trim().toUpperCase(),
      batch_names: batchNames
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
      batch_ids: [],
      component_type: componentType,
    });

    if (ok === false) {
      setError("That batch already has a class in this slot.");
      return;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 w-80 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[13px] font-medium text-gray-800 dark:text-gray-100">
            Add course
          </h3>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-400"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className={FIELD_LABEL}>Course code</span>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="CS301"
              className={FIELD_INPUT}
            />
          </label>

          <label className="block">
            <span className={FIELD_LABEL}>Faculty code</span>
            <input
              type="text"
              value={facultyCode}
              onChange={(e) => setFacultyCode(e.target.value)}
              placeholder="JDO"
              className={FIELD_INPUT}
            />
          </label>

          <label className="block">
            <span className={FIELD_LABEL}>Batches</span>
            <input
              type="text"
              value={batchNames}
              onChange={(e) => setBatchNames(e.target.value)}
              placeholder="CS-A, CS-B"
              className={FIELD_INPUT}
            />
          </label>

          <label className="block">
            <span className={FIELD_LABEL}>Component</span>
            <div className="relative mt-1">
              <select
                value={componentType}
                onChange={(e) => setComponentType(e.target.value)}
                className={`${FIELD_INPUT} appearance-none pr-7 cursor-pointer`}
              >
                {["lecture", "lab", "tutorial", "minor", "oe"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={11}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
              />
            </div>
          </label>
        </div>

        {error && (
          <p className="flex items-center gap-1 text-[11px] text-red-500 mt-4">
            <AlertCircle size={11} />
            {error}
          </p>
        )}

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 text-[12px] px-3 py-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!courseCode.trim() || !facultyCode.trim()}
            className="flex-1 text-[12px] px-3 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 hover:bg-gray-700 dark:hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-white dark:text-gray-900 font-medium transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

// ── main component ────────────────────────────────────────────────────────────

const EditableSlotsView = forwardRef(function EditableSlotsView(
  { slotsData, editMode = false, sessionId },
  ref,
) {
  // ── store ────────────────────────────────────────────────────────────────
  const bulkUpdateSlots = useAdminStore((s) => s.bulkUpdateSlots);
  const createSlot = useAdminStore((s) => s.createSlot);
  const deleteSlot = useAdminStore((s) => s.deleteSlot);
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

  // Surfaced when a drag/drop move or a manual "Add course" is rejected
  // because it would double-book a batch in a slot.
  const [actionError, setActionError] = useState(null);

  // isEditing tracks the parent's editMode prop directly. Cancel/Save/
  // Save & Re-evaluate all live in the parent's toolbar; this
  // component only needs to react to editMode, not manage its own copy.
  const isEditing = editMode;

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
    setActionError(null);
  }, [rawSlots]);

  const allBatches = useMemo(() => {
    const seen = new Set();
    slots.forEach((sl) =>
      sl.entries.forEach((e) => getBatches(e).forEach((b) => seen.add(b))),
    );
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [slots]);

  const getEntry = useCallback(
    (slotName, batch) => {
      const sl = slots.find((s) => s.slot_name === slotName);
      return sl?.entries.find((e) => getBatches(e).includes(batch)) ?? null;
    },
    [slots],
  );

  // ── drag handlers ─────────────────────────────────────────────────────────

  const handleDragStart = (slotName, entryIdx) => {
    setDragSource({ slotName, entryIdx });
    setActionError(null);
  };

  const handleDragOver = (e, slotName) => {
    e.preventDefault();
    setDragOver({ slotName });
  };

  // Moving a course between slots is only ever safe in two situations:
  //   1. The destination slot has no batch overlap with the entry being
  //      moved at all → plain move.
  //   2. The destination slot has exactly one entry, and it covers the
  //      *exact same* batch(es) as the entry being moved → the two swap
  //      places automatically (this is the "X goes to B, so Y comes back
  //      to A" case).
  // Anything else (partial batch overlap, multiple clashing entries) means
  // a batch would end up double-booked or a batch's other slot would be
  // left dangling, so the move is rejected with an explanation instead.
  const handleDrop = (e, targetSlotName) => {
    e.preventDefault();
    setDragOver(null);
    if (!dragSource) return;
    const { slotName: srcSlot, entryIdx } = dragSource;
    setDragSource(null);

    if (srcSlot === targetSlotName) return;

    const srcSlotObj = slots.find((s) => s.slot_name === srcSlot);
    const dstSlotObj = slots.find((s) => s.slot_name === targetSlotName);
    if (!srcSlotObj || !dstSlotObj) return;

    const movingEntry = srcSlotObj.entries[entryIdx];
    if (!movingEntry) return;

    const movingBatches = getBatches(movingEntry);
    const movingSet = new Set(movingBatches);

    // Anything already in the target slot that shares a batch with the
    // entry we're trying to move there.
    const conflicts = dstSlotObj.entries.filter((en) =>
      getBatches(en).some((batch) => movingSet.has(batch)),
    );

    // Case 1: no shared batches at all — free move.
    if (conflicts.length === 0) {
      setSlots((prev) => {
        const next = prev.map((s) => ({ ...s, entries: [...s.entries] }));
        const src = next.find((s) => s.slot_name === srcSlot);
        const dst = next.find((s) => s.slot_name === targetSlotName);
        const idx = src.entries.indexOf(movingEntry);
        if (idx === -1) return prev;
        const [entry] = src.entries.splice(idx, 1);
        dst.entries.push(entry);
        return next;
      });
      setActionError(null);
      return;
    }

    // Case 2: exactly one clashing entry with the identical batch set —
    // automatic interchange.
    if (conflicts.length === 1) {
      const conflictEntry = conflicts[0];
      const conflictBatches = getBatches(conflictEntry);
      const sameSet =
        movingSet.size === conflictBatches.length &&
        conflictBatches.every((b) => movingSet.has(b));

      if (sameSet) {
        setSlots((prev) => {
          const next = prev.map((s) => ({ ...s, entries: [...s.entries] }));
          const src = next.find((s) => s.slot_name === srcSlot);
          const dst = next.find((s) => s.slot_name === targetSlotName);
          const srcIdx = src.entries.indexOf(movingEntry);
          const dstIdx = dst.entries.indexOf(conflictEntry);
          if (srcIdx === -1 || dstIdx === -1) return prev;
          src.entries[srcIdx] = conflictEntry;
          dst.entries[dstIdx] = movingEntry;
          return next;
        });
        setActionError(null);
        return;
      }
    }

    // Case 3: partial overlap or multiple clashing entries — not a safe
    // automatic move. Block it and say why.
    const clashBatches = movingBatches.filter((b) =>
      conflicts.some((en) => getBatches(en).includes(b)),
    );
    setActionError(
      `Can't move ${movingEntry.course_code ?? movingEntry.course ?? "this course"} to ${targetSlotName} — ${clashBatches.join(
        ", ",
      )} already ${clashBatches.length > 1 ? "have" : "has"} a class there.`,
    );
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
    setActionError(null);
  };

  // Returns true on success, false if rejected due to a batch clash — the
  // AddEntryModal uses this to decide whether to close itself.
  const handleAddEntry = (slotName, entry) => {
    const entryBatches = getBatches(entry);
    const slot = slots.find((s) => s.slot_name === slotName);

    const clashBatches = entryBatches.filter((b) =>
      slot?.entries.some((e) => getBatches(e).includes(b)),
    );

    if (clashBatches.length) {
      setActionError(
        `Can't add ${entry.course_code} to ${slotName} — ${clashBatches.join(
          ", ",
        )} already ${clashBatches.length > 1 ? "have" : "has"} a class there.`,
      );
      return false;
    }

    setSlots((prev) =>
      prev.map((s) =>
        s.slot_name === slotName ? { ...s, entries: [...s.entries, entry] } : s,
      ),
    );
    setActionError(null);
    return true;
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

  // ── cancel ────────────────────────────────────────────────────────────────
  //
  // Discards every local edit (drag/drop moves, added/removed slots,
  // added/removed entries) and restores the table to whatever slotsData
  // (i.e. the last data fetched from the server) currently holds.
  const handleCancel = useCallback(() => {
    setSlots(
      rawSlots
        .filter((s) => !s.slot_name.startsWith("LAB"))
        .map((s) => ({ ...s, entries: [...(s.entries ?? [])] })),
    );
    setAddedSlots(new Set());
    setDeletedSlots(new Set());
    setWarnings([]);
    setActionError(null);
    setDragSource(null);
    setDragOver(null);
    setAddModal(null);
  }, [rawSlots]);

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
      if (!result.ok) return { ok: false }; // store has set slotsError; bail out
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
      if (!result.ok) return { ok: false };
      if (result.warnings?.length) allWarnings.push(...result.warnings);
    }

    // 3 — bulk-update all surviving (non-new) slots
    const survivingSlots = slots.filter((s) => !addedSlots.has(s.slot_name));
    if (survivingSlots.length) {
      const result = await bulkUpdateSlots(sessionId, survivingSlots);
      if (!result.ok) return { ok: false };
      if (result.warnings?.length) allWarnings.push(...result.warnings);
    }

    // All good — clear pending sets and surface any warnings
    setAddedSlots(new Set());
    setDeletedSlots(new Set());
    if (allWarnings.length) setWarnings(allWarnings);
    return { ok: true, warnings: allWarnings };
  };

  // Expose save + cancel + dirty-state to the parent so its toolbar (Cancel /
  // Save / Save & Re-evaluate) can drive this component instead of it
  // running its own competing save UI.
  useImperativeHandle(
    ref,
    () => ({
      save: handleSave,
      cancel: handleCancel,
      isDirty: () =>
        addedSlots.size > 0 ||
        deletedSlots.size > 0 ||
        JSON.stringify(
          slots.map((s) => ({ slot_name: s.slot_name, entries: s.entries })),
        ) !==
          JSON.stringify(
            rawSlots
              .filter((s) => !s.slot_name.startsWith("LAB"))
              .map((s) => ({
                slot_name: s.slot_name,
                entries: s.entries ?? [],
              })),
          ),
    }),
    [slots, addedSlots, deletedSlots, rawSlots, handleCancel],
  );

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="flex items-center justify-between px-0.5">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Drag to move · <Plus size={9} className="inline -mt-px" /> to add ·{" "}
            <X size={9} className="inline -mt-px" /> to remove
          </p>

          <div className="flex items-center gap-3">
            {slotsError && (
              <span className="text-[11px] text-red-500">{slotsError}</span>
            )}

            {actionError && (
              <span className="flex items-center gap-1 text-[11px] text-red-500">
                <AlertCircle size={11} />
                {actionError}
              </span>
            )}

            {warnings.map((w, i) => (
              <span key={i} className="text-[11px] text-amber-500">
                {w}
              </span>
            ))}

            <button
              onClick={handleAddSlot}
              disabled={isSavingSlots}
              className="flex items-center gap-1 text-[12px] px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 transition-colors"
            >
              <Plus size={12} />
              Add slot
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table
          className="border-collapse table-fixed"
          style={{ width: "100%" }}
        >
          <thead>
            <tr>
              <th
                className="px-3 py-3 text-left text-[11px] font-medium text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                style={{ width: 96 }}
              >
                Batch
              </th>
              {slots.map((sl) => (
                <th
                  key={sl.slot_name}
                  className={`relative px-1.5 py-3 text-center border border-gray-200 dark:border-gray-800 transition-colors ${
                    dragOver?.slotName === sl.slot_name && isEditing
                      ? "bg-gray-50 dark:bg-gray-800/40"
                      : ""
                  }`}
                  onDragOver={
                    isEditing
                      ? (e) => handleDragOver(e, sl.slot_name)
                      : undefined
                  }
                  onDrop={
                    isEditing ? (e) => handleDrop(e, sl.slot_name) : undefined
                  }
                >
                  {isEditing && (
                    <button
                      onClick={() => handleDeleteSlot(sl.slot_name)}
                      className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded text-gray-300 hover:text-white hover:bg-red-400 dark:text-gray-600 transition-colors"
                      title="Delete slot"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    <span
                      className={`inline-flex items-center justify-center min-w-[22px] h-6 px-1.5 rounded-md text-[12px] font-semibold leading-none whitespace-nowrap ${colorForSlot(sl.slot_name)}`}
                    >
                      {sl.slot_name}
                    </span>
                    {isEditing && (
                      <button
                        onClick={() => setAddModal(sl.slot_name)}
                        className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-gray-700 dark:text-gray-500 dark:hover:bg-gray-600 transition-colors"
                        title="Add course to this slot"
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                  {(() => {
                    const { dupFacs, dupBatches } = detectConflicts(sl.entries);
                    if (dupFacs.length || dupBatches.length) {
                      return (
                        <ConflictBadge
                          message={
                            dupFacs.length
                              ? `Clash: ${dupFacs.join(", ")}`
                              : `Clash: ${dupBatches.join(", ")}`
                          }
                        />
                      );
                    }
                    return (
                      <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1 font-normal">
                        {sl.entries[0]?.sessions_per_week ?? 1}×/wk
                      </p>
                    );
                  })()}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {allBatches.map((batch) => (
              <tr
                key={batch}
                className="hover:bg-gray-50/60 dark:hover:bg-gray-800/20 transition-colors"
              >
                <td className="px-3 py-2.5 text-[12px] font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/60 truncate">
                  {batch}
                </td>
                {slots.map((sl) => {
                  const entry = getEntry(sl.slot_name, batch);
                  const entryIdx = sl.entries.findIndex((e) =>
                    getBatches(e).includes(batch),
                  );
                  const isDragging =
                    dragSource?.slotName === sl.slot_name &&
                    dragSource?.entryIdx === entryIdx;
                  const isOver =
                    dragOver?.slotName === sl.slot_name && isEditing;

                  if (!entry) {
                    return (
                      <td
                        key={sl.slot_name}
                        className={`px-3 py-2.5 text-center border border-gray-200 dark:border-gray-800/60 transition-colors ${
                          isOver ? "bg-gray-50 dark:bg-gray-800/30" : ""
                        }`}
                        onDragOver={
                          isEditing
                            ? (e) => handleDragOver(e, sl.slot_name)
                            : undefined
                        }
                        onDrop={
                          isEditing
                            ? (e) => handleDrop(e, sl.slot_name)
                            : undefined
                        }
                      >
                        <span className="text-[11px] text-gray-200 dark:text-gray-700">
                          –
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
                      className={`px-1.5 py-1.5 border border-gray-200 dark:border-gray-800/60 transition-colors ${
                        isOver ? "bg-gray-50 dark:bg-gray-800/30" : ""
                      }`}
                      onDragOver={
                        isEditing
                          ? (e) => handleDragOver(e, sl.slot_name)
                          : undefined
                      }
                      onDrop={
                        isEditing
                          ? (e) => handleDrop(e, sl.slot_name)
                          : undefined
                      }
                    >
                      <div
                        className={`rounded-lg px-2 py-1.5 text-center relative group ${color} ${
                          isDragging ? "opacity-30" : ""
                        } ${
                          isEditing
                            ? "cursor-grab active:cursor-grabbing hover:brightness-95 dark:hover:brightness-110"
                            : ""
                        }`}
                        draggable={isEditing}
                        onDragStart={
                          isEditing
                            ? () => handleDragStart(sl.slot_name, entryIdx)
                            : undefined
                        }
                        onDragEnd={isEditing ? handleDragEnd : undefined}
                      >
                        {isEditing && (
                          <button
                            onClick={() =>
                              handleDeleteEntry(sl.slot_name, entryIdx)
                            }
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-600 text-white flex items-center justify-center z-10 hover:bg-red-400 dark:hover:bg-red-400 transition-colors"
                            title="Remove entry"
                          >
                            <X size={8} />
                          </button>
                        )}
                        {isEditing && (
                          <GripVertical
                            size={9}
                            className="absolute left-1 top-1/2 -translate-y-1/2 opacity-40 group-hover:opacity-70 transition-opacity"
                          />
                        )}
                        <p className="text-[11px] font-semibold leading-none">
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
              sl.entries.some((e) => !getBatches(e).length),
            ) && (
              <tr>
                <td className="px-3 py-2.5 text-[12px] font-medium text-amber-600 dark:text-amber-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 truncate">
                  No batch
                </td>
                {slots.map((sl) => {
                  const unassigned = sl.entries.filter(
                    (e) => !getBatches(e).length,
                  );
                  if (!unassigned.length)
                    return (
                      <td
                        key={sl.slot_name}
                        className="border border-gray-200 dark:border-gray-800"
                      />
                    );
                  return (
                    <td
                      key={sl.slot_name}
                      className="px-1.5 py-1.5 border border-gray-200 dark:border-gray-800"
                    >
                      {unassigned.map((e, i) => {
                        const realIdx = sl.entries.indexOf(e);
                        return (
                          <div
                            key={i}
                            className={`rounded-lg px-2 py-1.5 text-center relative group mb-1 ${colorForSlot(sl.slot_name)} ${
                              isEditing ? "cursor-grab" : ""
                            }`}
                            draggable={isEditing}
                            onDragStart={
                              isEditing
                                ? () => handleDragStart(sl.slot_name, realIdx)
                                : undefined
                            }
                            onDragEnd={isEditing ? handleDragEnd : undefined}
                          >
                            {isEditing && (
                              <button
                                onClick={() =>
                                  handleDeleteEntry(sl.slot_name, realIdx)
                                }
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-600 text-white flex items-center justify-center z-10 hover:bg-red-400 transition-colors"
                              >
                                <X size={8} />
                              </button>
                            )}
                            <p className="text-[11px] font-semibold leading-none">
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
});

export default EditableSlotsView;
