import { useState } from "react";
import useAdminStore from "../../../../../store/useAdminStore";
import { buildRowPayload } from "../rowHelpers";

// Owns: building the API payload from row state, validating rows before
// save, and the actual save calls (single batch + save-all).
export default function useCourseAssignmentSave({ session, rows, onSave }) {
  const { bulkUpsertCourseAssignments, fetchCourseAssignments } =
    useAdminStore();

  const [savingBatch, setSavingBatch] = useState(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [batchErrors, setBatchErrors] = useState({});
  const [error, setError] = useState(null);

  // For slot rows: course_id = actual elective, elective_slot_id = slot._id
  // For normal rows: course_id = course._id, elective_slot_id = null
  const buildPayload = (batchId) =>
    (rows[batchId] ?? [])
      .map((r) => buildRowPayload(r, batchId, session._id))
      .filter(Boolean);

  // Slot rows need an elective picked, not just the slot itself.
  const getIncompleteRows = (batchId) =>
    (rows[batchId] ?? []).filter((r) => {
      if (r.course?.is_elective_slot) return !r.elective_course || !r.faculty;
      return !r.course || !r.faculty;
    });

  const saveBatchAssignments = async (batchId) => {
    const incomplete = getIncompleteRows(batchId);
    if (incomplete.length) {
      setBatchErrors((p) => ({
        ...p,
        [batchId]:
          "Fill in all course and faculty fields before saving. Elective slots need an elective selected.",
      }));
      return;
    }
    const payload = buildPayload(batchId);
    if (!payload.length) {
      setBatchErrors((p) => ({
        ...p,
        [batchId]: "Nothing to save — assign at least one course.",
      }));
      return;
    }
    setBatchErrors((p) => ({ ...p, [batchId]: null }));
    setSavingBatch(batchId);
    try {
      await bulkUpsertCourseAssignments(session._id, payload);
      await fetchCourseAssignments({ session_id: session._id });
    } catch (e) {
      setBatchErrors((p) => ({
        ...p,
        [batchId]:
          e?.response?.data?.message ?? "Failed to save. Please try again.",
      }));
    } finally {
      setSavingBatch(null);
    }
  };

  const saveAllAssignments = async () => {
    const allPayload = Object.keys(rows).flatMap(buildPayload);
    if (allPayload.some((p) => !p.course_id || !p.faculty_id)) {
      setError("Some assignments are incomplete.");
      return;
    }
    try {
      setIsSavingAll(true);
      await bulkUpsertCourseAssignments(session._id, allPayload);
      await fetchCourseAssignments({ session_id: session._id });
      if (onSave) onSave(allPayload);
    } catch {
      setError("Failed to save all assignments.");
    } finally {
      setIsSavingAll(false);
    }
  };

  return {
    savingBatch,
    isSavingAll,
    batchErrors,
    error,
    buildPayload,
    getIncompleteRows,
    saveBatchAssignments,
    saveAllAssignments,
  };
}
