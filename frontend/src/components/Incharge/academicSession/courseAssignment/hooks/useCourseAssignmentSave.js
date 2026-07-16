import { useState } from "react";
import useAdminStore from "../../../../../store/admin/index";
import { buildRowPayload } from "../RowHelpers";

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
  // Incomplete rows (no course/elective picked, or no faculty) return null
  // from buildRowPayload and are filtered out here — this is what makes
  // partial saves possible, since incomplete rows are just skipped rather
  // than blocking the whole batch.
  const buildPayload = (batchId) =>
    (rows[batchId] ?? [])
      .map((r) => buildRowPayload(r, batchId, session._id))
      .filter(Boolean);

  // Slot rows need an elective picked, not just the slot itself.
  // Still exposed for UI purposes (e.g. showing "3 rows still need a
  // faculty" hints), but no longer used to block saving.
  const getIncompleteRows = (batchId) =>
    (rows[batchId] ?? []).filter((r) => {
      if (r.course?.is_elective_slot) return !r.elective_course || !r.faculty;
      return !r.course || !r.faculty;
    });

  const saveBatchAssignments = async (batchId) => {
    const payload = buildPayload(batchId);

    if (!payload.length) {
      setBatchErrors((p) => ({
        ...p,
        [batchId]:
          "Nothing to save yet — assign at least one course and faculty.",
      }));
      return;
    }

    setBatchErrors((p) => ({ ...p, [batchId]: null }));
    setSavingBatch(batchId);
    try {
      await bulkUpsertCourseAssignments(session._id, payload);
      await fetchCourseAssignments({ session_id: session._id });

      // Let the admin know some rows were skipped, without treating it as an error.
      const skipped = getIncompleteRows(batchId).length;
      if (skipped) {
        setBatchErrors((p) => ({
          ...p,
          [batchId]: `Saved ${payload.length} course(s). ${skipped} row(s) still need a course/faculty and were not saved.`,
        }));
      }
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
    // buildPayload already drops incomplete rows per-batch, so allPayload
    // here only ever contains complete rows.
    const allPayload = Object.keys(rows).flatMap(buildPayload);

    if (!allPayload.length) {
      setError("Nothing to save yet — assign at least one course and faculty.");
      return;
    }

    setError(null);
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
