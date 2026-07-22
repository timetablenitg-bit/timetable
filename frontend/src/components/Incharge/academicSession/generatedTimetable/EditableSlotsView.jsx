// frontend/src/components/incharge/academicSession/generatedTimetable/EditableSlotsView.jsx

import React, {
  useMemo,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { SLOT_COLORS } from "./colors";
import {
  Plus,
  Trash2,
  GripVertical,
  X,
  ChevronDown,
  AlertCircle,
  Lock,
  LockOpen,
} from "lucide-react";
import useAdminStore from "../../../../store/admin/index"; // ← adjust path to your store
import { toast } from "react-toastify";

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

// Normalizes a batch reference that may either be a raw ObjectId/string, or a
// populated Batch document (as returned by SlotLock.find().populate("batch_ids")
// in slotLockController.js::getLocks). Mirrors the assignment_id?._id ?? assignment_id
// pattern used elsewhere in this file so lock lookups keep working regardless
// of whether the backend populates batch_ids or not.
function batchIdOf(batchRef) {
  return (batchRef?._id ?? batchRef)?.toString();
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
  {
    slotsData,
    editMode = false,
    sessionId,
    locksData = [],
    fetchLocks,
    lockCourseToSlot,
    lockSlotEmpty,
    deleteLock,
    batchesMap = new Map(), // default empty map
  },
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
  const [slots, setSlots] = useState(() =>
    rawSlots
      .filter((s) => !s.slot_name.startsWith("LAB"))
      .map((s) => ({ ...s, entries: [...(s.entries ?? [])] })),
  );

  // Track which slot names have been added or deleted locally.
  const [addedSlots, setAddedSlots] = useState(new Set());
  const [deletedSlots, setDeletedSlots] = useState(new Set());

  const [dragSource, setDragSource] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [addModal, setAddModal] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [actionError, setActionError] = useState(null);

  // NEW: lock mode state
  const [lockMode, setLockMode] = useState(false);

  const isEditing = editMode;

  // Re-sync when slotsData changes externally.
  useEffect(() => {
    setSlots(
      rawSlots
        .filter((s) => !s.slot_name.startsWith("LAB"))
        .map((s) => ({ ...s, entries: [...(s.entries ?? [])] })),
    );
    setAddedSlots(new Set());
    setDeletedSlots(new Set());
    setWarnings([]);
    setActionError(null);
    // Reset lock mode when data changes? Optional, but we keep it.
  }, [rawSlots]);

  // Use the provided map as the primary source, fallback to entries
  const batchNameToId = useMemo(() => {
    const map = new Map(batchesMap); // start with all batches from session
    // also add any from entries (in case there are extra)
    for (const sl of slots) {
      for (const entry of sl.entries) {
        const batchNames = entry.batch_names ?? entry.batches ?? [];
        const batchIds = entry.batch_ids ?? [];
        for (let i = 0; i < batchNames.length; i++) {
          if (!map.has(batchNames[i])) {
            map.set(batchNames[i], batchIds[i]);
          }
        }
      }
    }
    return map;
  }, [slots, batchesMap]);

  // Build lock maps from locksData
  const { courseLockMap, emptyLockMap } = useMemo(() => {
    const courseMap = new Map(); // assignmentId -> { slotName, lockId }
    const emptyMap = new Map(); // slotName -> Map(batchId -> lockId)

    for (const lock of locksData) {
      if (lock.lock_type === "course") {
        const assignmentId = lock.assignment_id?._id ?? lock.assignment_id;
        if (assignmentId) {
          courseMap.set(assignmentId.toString(), {
            slotName: lock.slot_name,
            lockId: lock._id,
          });
        }
      } else if (lock.lock_type === "empty") {
        const slotName = lock.slot_name;
        if (!emptyMap.has(slotName)) emptyMap.set(slotName, new Map());
        const batchMap = emptyMap.get(slotName);
        for (const batchRef of lock.batch_ids ?? []) {
          // NOTE: getLocks() in slotLockController.js populates batch_ids, so
          // each entry here may be a full Batch document rather than a raw
          // ObjectId. Normalize through batchIdOf() (same pattern as
          // assignment_id?._id ?? assignment_id above) so the map key always
          // matches the plain-string batch ids used elsewhere (e.g.
          // batchNameToId / batchId.toString() in toggleEmptyLock).
          const idStr = batchIdOf(batchRef);
          if (idStr) batchMap.set(idStr, lock._id);
        }
      }
    }
    return { courseLockMap: courseMap, emptyLockMap: emptyMap };
  }, [locksData]);

  // Toggle course lock
  const toggleCourseLock = async (assignmentId, slotName) => {
    const idStr = assignmentId.toString();
    const existing = courseLockMap.get(idStr);
    if (existing && existing.slotName === slotName) {
      // Unlock
      const result = await deleteLock(existing.lockId);
      if (result.ok) {
        toast.success("Lock removed");
        await fetchLocks(sessionId);
      } else {
        toast.error(result.message || "Failed to remove lock");
      }
    } else {
      // Lock (or relock to this slot)
      const result = await lockCourseToSlot(sessionId, idStr, slotName);
      if (result.ok) {
        toast.success(`Locked assignment to slot ${slotName}`);
        await fetchLocks(sessionId);
      } else {
        toast.error(result.message || "Failed to lock");
      }
    }
  };

  // Toggle empty lock
  const toggleEmptyLock = async (batchId, slotName) => {
    const batchIdStr = batchId.toString();
    const batchMap = emptyLockMap.get(slotName);
    const existingLockId = batchMap?.get(batchIdStr);
    if (existingLockId) {
      // Unlock empty
      const result = await deleteLock(existingLockId);
      if (result.ok) {
        toast.success("Empty slot lock removed");
        await fetchLocks(sessionId);
      } else {
        toast.error(result.message || "Failed to remove empty lock");
      }
    } else {
      // Lock empty
      const result = await lockSlotEmpty(sessionId, slotName, [batchIdStr]);
      if (result.ok) {
        toast.success(`Slot ${slotName} locked empty for this batch`);
        await fetchLocks(sessionId);
      } else {
        toast.error(result.message || "Failed to lock empty");
      }
    }
  };

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

    // Check if the moving entry is locked – if so, prevent drag.
    const assignmentId =
      movingEntry.assignment_id?._id ?? movingEntry.assignment_id;
    if (assignmentId) {
      const lock = courseLockMap.get(assignmentId.toString());
      if (lock && lock.slotName === srcSlot) {
        setActionError("Cannot move a locked course");
        return;
      }
    }

    const movingBatches = getBatches(movingEntry);
    const movingSet = new Set(movingBatches);

    const conflicts = dstSlotObj.entries.filter((en) =>
      getBatches(en).some((batch) => movingSet.has(batch)),
    );

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
    setDeletedSlots((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  };

  const handleDeleteSlot = (slotName) => {
    setSlots((prev) => prev.filter((s) => s.slot_name !== slotName));
    if (addedSlots.has(slotName)) {
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

  const handleSave = async () => {
    setWarnings([]);
    const allWarnings = [];

    for (const slotName of deletedSlots) {
      const result = await deleteSlot(sessionId, slotName);
      if (!result.ok) return { ok: false };
    }

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

    const survivingSlots = slots.filter((s) => !addedSlots.has(s.slot_name));
    if (survivingSlots.length) {
      const result = await bulkUpdateSlots(sessionId, survivingSlots);
      if (!result.ok) return { ok: false };
      if (result.warnings?.length) allWarnings.push(...result.warnings);
    }

    setAddedSlots(new Set());
    setDeletedSlots(new Set());
    if (allWarnings.length) setWarnings(allWarnings);
    return { ok: true, warnings: allWarnings };
  };

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

  // Helper to render a single entry cell (used in batch rows)
  const renderEntryCell = (sl, entry, entryIdx, batch) => {
    const isLockedCourse = entry?.assignment_id
      ? courseLockMap.get(entry.assignment_id.toString())?.slotName ===
        sl.slot_name
      : false;
    const code = entry.course_code ?? entry.course ?? "—";
    const fac = entry.faculty_code ?? entry.faculty ?? "";
    const color = colorForSlot(sl.slot_name);
    const isDragging =
      dragSource?.slotName === sl.slot_name &&
      dragSource?.entryIdx === entryIdx;
    const isOver = dragOver?.slotName === sl.slot_name && isEditing;

    const handleCellClick = () => {
      if (!lockMode) return;
      if (entry && entry.assignment_id) {
        toggleCourseLock(entry.assignment_id, sl.slot_name);
      } else {
        toast.info("Cannot lock this entry (no assignment ID)");
      }
    };

    return (
      <td
        key={sl.slot_name}
        className={`px-1.5 py-1.5 border border-gray-200 dark:border-gray-800/60 transition-colors ${
          isOver ? "bg-gray-50 dark:bg-gray-800/30" : ""
        } ${lockMode ? "cursor-pointer" : ""}`}
        onDragOver={
          isEditing ? (e) => handleDragOver(e, sl.slot_name) : undefined
        }
        onDrop={isEditing ? (e) => handleDrop(e, sl.slot_name) : undefined}
        onClick={handleCellClick}
      >
        <div
          className={`rounded-lg px-2 py-1.5 text-center relative group ${
            isLockedCourse
              ? "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 text-indigo-800 dark:text-indigo-200"
              : color
          } ${isLockedCourse ? "ring-2 ring-indigo-400" : ""} ${
            isDragging ? "opacity-30" : ""
          } ${
            isEditing && !isLockedCourse
              ? "cursor-grab active:cursor-grabbing hover:brightness-95 dark:hover:brightness-110"
              : ""
          }`}
          draggable={isEditing && !isLockedCourse}
          onDragStart={
            isEditing && !isLockedCourse
              ? () => handleDragStart(sl.slot_name, entryIdx)
              : undefined
          }
          onDragEnd={isEditing ? handleDragEnd : undefined}
        >
          {isEditing && !isLockedCourse && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteEntry(sl.slot_name, entryIdx);
              }}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-600 text-white flex items-center justify-center z-10 hover:bg-red-400 dark:hover:bg-red-400 transition-colors"
              title="Remove entry"
            >
              <X size={8} />
            </button>
          )}
          {isEditing && !isLockedCourse && (
            <GripVertical
              size={9}
              className="absolute left-1 top-1/2 -translate-y-1/2 opacity-40 group-hover:opacity-70 transition-opacity"
            />
          )}
          {isLockedCourse && (
            <Lock
              size={10}
              className="absolute top-0.5 right-0.5 text-indigo-500 dark:text-indigo-400"
            />
          )}
          <p className="text-[11px] font-semibold leading-none">{code}</p>
          {fac && (
            <p className="text-[9px] mt-0.5 opacity-60 leading-none">{fac}</p>
          )}
        </div>
      </td>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-0.5">
        <p className="text-[11px] text-gray-400 dark:text-gray-500">
          {isEditing
            ? lockMode
              ? "Click a cell to toggle lock"
              : "Drag to move · + to add · × to remove"
            : lockMode
              ? "Click a cell to toggle lock"
              : "View mode"}
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

          {/* Lock mode toggle */}
          <button
            onClick={() => setLockMode((prev) => !prev)}
            className={`flex items-center gap-1 text-[12px] px-2.5 py-1.5 rounded-lg transition-colors ${
              lockMode
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
            title={lockMode ? "Disable lock mode" : "Enable lock mode"}
          >
            {lockMode ? <Lock size={12} /> : <LockOpen size={12} />}
            {lockMode ? "Lock mode" : "Lock mode"}
          </button>

          {isEditing && (
            <button
              onClick={handleAddSlot}
              disabled={isSavingSlots}
              className="flex items-center gap-1 text-[12px] px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 transition-colors"
            >
              <Plus size={12} />
              Add slot
            </button>
          )}
        </div>
      </div>

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
            {allBatches.map((batch) => {
              const batchId = batchNameToId.get(batch);
              return (
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

                    if (!entry) {
                      // Empty cell – handle empty lock
                      const isLockedEmpty = batchId
                        ? emptyLockMap
                            .get(sl.slot_name)
                            ?.has(batchId.toString())
                        : false;
                      const isOver =
                        dragOver?.slotName === sl.slot_name && isEditing;

                      const handleEmptyClick = () => {
                        if (!lockMode) return;
                        if (batchId) {
                          toggleEmptyLock(batchId, sl.slot_name);
                        } else {
                          toast.info("Cannot lock empty: missing batch ID");
                        }
                      };

                      return (
                        <td
                          key={sl.slot_name}
                          className={`px-3 py-2.5 text-center border border-gray-200 dark:border-gray-800/60 transition-colors ${
                            isOver ? "bg-gray-50 dark:bg-gray-800/30" : ""
                          } ${lockMode ? "cursor-pointer" : ""}`}
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
                          onClick={handleEmptyClick}
                        >
                          <span className="text-[11px] text-gray-200 dark:text-gray-700 flex items-center justify-center gap-1">
                            {isLockedEmpty ? (
                              <Lock
                                size={12}
                                className="text-indigo-400 dark:text-indigo-300"
                              />
                            ) : (
                              "–"
                            )}
                          </span>
                        </td>
                      );
                    }

                    return renderEntryCell(sl, entry, entryIdx, batch);
                  })}
                </tr>
              );
            })}

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
                  // For unassigned, we just render them (no lock support)
                  return unassigned.map((e, i) => {
                    const realIdx = sl.entries.indexOf(e);
                    const isLockedCourse = e?.assignment_id
                      ? courseLockMap.get(e.assignment_id.toString())
                          ?.slotName === sl.slot_name
                      : false;
                    const isDragging =
                      dragSource?.slotName === sl.slot_name &&
                      dragSource?.entryIdx === realIdx;
                    const isOver =
                      dragOver?.slotName === sl.slot_name && isEditing;

                    return (
                      <td
                        key={`${sl.slot_name}-${i}`}
                        className={`px-1.5 py-1.5 border border-gray-200 dark:border-gray-800/60 transition-colors ${
                          isOver ? "bg-gray-50 dark:bg-gray-800/30" : ""
                        } ${lockMode ? "cursor-pointer" : ""}`}
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
                        onClick={() => {
                          if (!lockMode) return;
                          if (e.assignment_id) {
                            toggleCourseLock(e.assignment_id, sl.slot_name);
                          } else {
                            toast.info(
                              "Cannot lock this entry (no assignment ID)",
                            );
                          }
                        }}
                      >
                        <div
                          className={`rounded-lg px-2 py-1.5 text-center relative group ${
                            isLockedCourse
                              ? "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 text-indigo-800 dark:text-indigo-200"
                              : colorForSlot(sl.slot_name)
                          } ${isLockedCourse ? "ring-2 ring-indigo-400" : ""} ${
                            isDragging ? "opacity-30" : ""
                          } ${
                            isEditing && !isLockedCourse
                              ? "cursor-grab active:cursor-grabbing"
                              : ""
                          }`}
                          draggable={isEditing && !isLockedCourse}
                          onDragStart={
                            isEditing && !isLockedCourse
                              ? () => handleDragStart(sl.slot_name, realIdx)
                              : undefined
                          }
                          onDragEnd={isEditing ? handleDragEnd : undefined}
                        >
                          {isEditing && !isLockedCourse && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEntry(sl.slot_name, realIdx);
                              }}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-600 text-white flex items-center justify-center z-10 hover:bg-red-400 transition-colors"
                            >
                              <X size={8} />
                            </button>
                          )}
                          {isLockedCourse && (
                            <Lock
                              size={10}
                              className="absolute top-0.5 right-0.5 text-indigo-500 dark:text-indigo-400"
                            />
                          )}
                          <p className="text-[11px] font-semibold leading-none">
                            {e.course_code ?? e.course ?? "—"}
                          </p>
                          {e.faculty_code && (
                            <p className="text-[9px] mt-0.5 opacity-60 leading-none">
                              {e.faculty_code}
                            </p>
                          )}
                        </div>
                      </td>
                    );
                  });
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
