import { useEffect, useMemo, useState } from "react";
import useAdminStore from "../../../../../store/admin/index";
import { EVEN_SEMS, ODD_SEMS, DURATION_MAP } from "../constants";
import { buildRowPayload } from "../RowHelpers";

const makeRow = (overrides = {}) => ({
  rowId: crypto.randomUUID(),
  course: null,
  elective_course: null,
  faculty: null,
  assignment_type: "regular",
  component_type: "lecture",
  sessions_per_week: null,
  duration: 1,
  shared_lab_with: [],
  synced_with: [],
  isManual: false,
  assignmentId: undefined,
  _backlogCount: undefined,
  ...overrides,
});

export default function useCourseAssignmentData(session) {
  const {
    batches,
    faculties,
    courses,
    courseAssignments,
    fetchBatches,
    fetchFaculties,
    fetchCourses,
    fetchCourseAssignments,
    fetchBacklogStats,
    fetchRegistrationOverview,
    bulkUpsertCourseAssignments,
    deleteCourseAssignment,
  } = useAdminStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState({});
  const [backlogStats, setBacklogStats] = useState([]);
  const [overviewData, setOverviewData] = useState({});
  const [deletingRowId, setDeletingRowId] = useState(null);
  // 🔥 NEW — courseIds hidden per batch. Unassigned placeholder rows are
  // regenerated from batchCourses every time the derive effect runs (any
  // courseAssignments/courses/faculties refetch), so there's nothing in
  // `rows` to "delete" for them — this is what actually sticks across
  // re-derives within the session. NOTE: this is session-only state, not
  // persisted — a page reload will bring these rows back, since as far as
  // the backend is concerned the course is still offered by the batch and
  // still unassigned. If that needs to survive reloads, it needs a real
  // backend field (e.g. an excluded/skipped list on the batch), not this.
  const [hiddenCourseIds, setHiddenCourseIds] = useState({}); // { [batchId]: Set<courseId> }

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [, , , , stats, overview] = await Promise.all([
          fetchBatches(),
          fetchFaculties(),
          fetchCourses(),
          fetchCourseAssignments({ session_id: session?._id }),
          fetchBacklogStats(session?._id),
          fetchRegistrationOverview(session?._id),
        ]);
        setBacklogStats(stats ?? []);
        const countMap = {};
        for (const { batch, students } of overview ?? []) {
          countMap[batch._id] = {};
          for (const { registration } of students) {
            if (!registration) continue;
            const allEntries = [
              ...(registration.regularCourses || []),
              ...(registration.backlogCourses || []),
            ];
            for (const entry of allEntries) {
              const courseId =
                entry.course?._id?.toString() ?? entry.course?.toString();
              if (!courseId) continue;
              countMap[batch._id][courseId] =
                (countMap[batch._id][courseId] || 0) + 1;
            }
          }
        }
        setOverviewData(countMap);
      } catch {
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };
    if (session?._id) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?._id]);

  const termSems = session?.term === "EVEN" ? EVEN_SEMS : ODD_SEMS;
  const filteredBatches = useMemo(
    () =>
      batches
        .filter((b) => termSems.has(b.semester))
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.batch_name.localeCompare(b.batch_name);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [batches, session?.term],
  );

  useEffect(() => {
    if (!filteredBatches.length || !courses.length) return;

    const newRows = {};

    filteredBatches.forEach((batch) => {
      const existing = courseAssignments?.filter((a) =>
        a.batch_ids?.some(
          (id) => (id?._id ?? id)?.toString() === batch._id?.toString(),
        ),
      );

      const batchCourses = courses.filter((c) => {
        if (batch.semester === 1 || batch.semester === 2) {
          const name = batch.batch_name.toUpperCase();
          const isSecCorD = name.includes("SEC C") || name.includes("SEC D");
          const targetSem = isSecCorD
            ? batch.semester === 1
              ? 2
              : 1
            : batch.semester;
          return Number(c.semester_offered) === targetSem;
        } else {
          return (
            Number(c.semester_offered) === Number(batch.semester) &&
            c.department === batch.department
          );
        }
      });

      const existingRows = (existing ?? []).map((a) => {
        const slotId = a.elective_slot_id?._id ?? a.elective_slot_id;
        const slotCourse = slotId
          ? courses.find((c) => c._id?.toString() === slotId?.toString())
          : null;

        const actualCourseId = a.course_id?._id ?? a.course_id;
        const actualCourse = courses.find(
          (c) => c._id?.toString() === actualCourseId?.toString(),
        );

        return makeRow({
          course: slotCourse ?? actualCourse,
          elective_course: slotCourse ? actualCourse : null,
          faculty: faculties.find(
            (f) =>
              f._id?.toString() ===
              (a.faculty_id?._id ?? a.faculty_id)?.toString(),
          ),
          assignment_type: a.assignment_type ?? "regular",
          component_type: a.component_type ?? "lecture",
          sessions_per_week: a.sessions_per_week ?? null,
          duration: a.duration ?? 1,
          shared_lab_with: (a.shared_lab_with ?? []).map((c) => c?._id ?? c),
          synced_with: (a.synced_with ?? []).map((s) => s?._id ?? s),
          assignmentId: a._id,
        });
      });

      const assignedCourseIds = new Set(
        existingRows.map((r) => r.course?._id?.toString()),
      );

      // 🔥 NEW — skip anything the admin explicitly hid for this batch
      const hiddenForBatch = hiddenCourseIds[batch._id] ?? new Set();

      const unassignedRows = batchCourses
        .filter(
          (c) =>
            !assignedCourseIds.has(c._id?.toString()) &&
            !hiddenForBatch.has(c._id?.toString()), // 🔥 NEW
        )
        .map((course) =>
          makeRow({
            course,
            component_type: course.course_type === "LAB" ? "lab" : "lecture",
            duration: course.course_type === "LAB" ? 3 : 1,
          }),
        );

      newRows[batch._id] = [...existingRows, ...unassignedRows];

      const existingCourseIds = new Set(
        (newRows[batch._id] ?? []).map((r) => r.course?._id?.toString()),
      );

      const batchCourseIds = overviewData[batch._id] ?? {};
      const backlogRows = backlogStats
        .filter((s) => {
          const id = s.course._id?.toString();
          return id && !existingCourseIds.has(id) && batchCourseIds[id] > 0;
        })
        .map((s) =>
          makeRow({
            course: s.course,
            assignment_type: "backlog",
            component_type: s.course.course_type === "LAB" ? "lab" : "lecture",
            duration: s.course.course_type === "LAB" ? 3 : 1,
          }),
        );
      newRows[batch._id] = [...(newRows[batch._id] ?? []), ...backlogRows];
    });

    setRows(newRows);
  }, [
    filteredBatches,
    courses,
    courseAssignments,
    faculties,
    backlogStats,
    overviewData,
    hiddenCourseIds, // 🔥 NEW dep
  ]);

  const updateRow = (batchId, rowId, patch) =>
    setRows((prev) => ({
      ...prev,
      [batchId]: prev[batchId].map((r) =>
        r.rowId === rowId ? { ...r, ...patch } : r,
      ),
    }));

  const handleComponentTypeChange = (batchId, rowId, component_type) =>
    updateRow(batchId, rowId, {
      component_type,
      duration: DURATION_MAP[component_type] ?? 1,
      ...(component_type !== "lab" ? { shared_lab_with: [] } : {}),
    });

  const addRow = (batchId) =>
    setRows((prev) => ({
      ...prev,
      [batchId]: [
        ...(prev[batchId] ?? []),
        makeRow({ assignment_type: "backlog", isManual: true }),
      ],
    }));

  const deleteRow = async (batchId, rowId) => {
    const row = rows[batchId]?.find((r) => r.rowId === rowId);
    if (!row) return;

    if (!window.confirm("Delete this course assignment?")) return;

    // 🔥 CHANGED — no assignmentId means either a manually-added blank row
    // (safe to just drop, it's never re-derived) or a derived "still needs
    // assignment" placeholder for a required batch course (needs to go into
    // hiddenCourseIds or the derive effect will just regenerate it).
    if (!row.assignmentId) {
      setRows((prev) => ({
        ...prev,
        [batchId]: prev[batchId].filter((r) => r.rowId !== rowId),
      }));

      if (!row.isManual && row.course?._id) {
        const courseId = row.course._id.toString();
        setHiddenCourseIds((prev) => {
          const next = new Set(prev[batchId] ?? []);
          next.add(courseId);
          return { ...prev, [batchId]: next };
        });
      }
      return;
    }

    const assignmentId = row.assignmentId.toString();
    setDeletingRowId(rowId);
    setError(null);

    try {
      const ok = await deleteCourseAssignment(row.assignmentId);
      if (!ok) {
        setError("Failed to delete the course assignment. Please try again.");
        return;
      }

      setRows((prev) => {
        const next = {};
        for (const [bId, list] of Object.entries(prev)) {
          next[bId] = list
            .filter((r) => !(bId === batchId && r.rowId === rowId))
            .map((r) => ({
              ...r,
              synced_with: (r.synced_with ?? []).filter(
                (id) => (id?._id ?? id)?.toString() !== assignmentId,
              ),
              shared_lab_with: (r.shared_lab_with ?? []).filter(
                (id) => (id?._id ?? id)?.toString() !== assignmentId,
              ),
            }));
        }
        return next;
      });

      await fetchCourseAssignments({ session_id: session?._id });
    } catch {
      setError("Failed to delete the course assignment. Please try again.");
    } finally {
      setDeletingRowId(null);
    }
  };

  const updateSyncedWith = async (batchId, rowId, nextSyncedIds) => {
    const currentRow = rows[batchId]?.find((r) => r.rowId === rowId);
    if (!currentRow || !currentRow.assignmentId) return;

    const currentAssignmentId = currentRow.assignmentId.toString();
    const prevIds = (currentRow.synced_with ?? []).map((id) =>
      (id?._id ?? id)?.toString(),
    );
    const nextIds = nextSyncedIds.map((id) => (id?._id ?? id)?.toString());
    const added = nextIds.filter((id) => !prevIds.includes(id));
    const removed = prevIds.filter((id) => !nextIds.includes(id));
    if (!added.length && !removed.length) return;

    const findRowLocation = (allRows, assignmentId) => {
      for (const [bId, list] of Object.entries(allRows)) {
        const r = list.find(
          (row) => row.assignmentId?.toString() === assignmentId,
        );
        if (r) return { batchId: bId, row: r };
      }
      return null;
    };

    const snapshot = rows;
    const otherUpdates = [...added, ...removed]
      .map((assignmentId) => {
        const loc = findRowLocation(snapshot, assignmentId);
        if (!loc) return null;
        const shouldHave = added.includes(assignmentId);
        const ids = new Set(
          (loc.row.synced_with ?? []).map((id) => (id?._id ?? id)?.toString()),
        );
        if (shouldHave) ids.add(currentAssignmentId);
        else ids.delete(currentAssignmentId);
        return {
          batchId: loc.batchId,
          rowId: loc.row.rowId,
          synced_with: Array.from(ids),
        };
      })
      .filter(Boolean);

    setRows((prev) => {
      const next = { ...prev };
      next[batchId] = (next[batchId] ?? []).map((r) =>
        r.rowId === rowId ? { ...r, synced_with: nextSyncedIds } : r,
      );
      otherUpdates.forEach((u) => {
        next[u.batchId] = (next[u.batchId] ?? []).map((r) =>
          r.rowId === u.rowId ? { ...r, synced_with: u.synced_with } : r,
        );
      });
      return next;
    });

    try {
      const payloads = [];
      const currentPayload = buildRowPayload(
        { ...currentRow, synced_with: nextSyncedIds },
        batchId,
        session?._id,
      );
      if (currentPayload) payloads.push(currentPayload);

      otherUpdates.forEach((u) => {
        const original = snapshot[u.batchId]?.find((r) => r.rowId === u.rowId);
        if (!original) return;
        const p = buildRowPayload(
          { ...original, synced_with: u.synced_with },
          u.batchId,
          session?._id,
        );
        if (p) payloads.push(p);
      });

      if (payloads.length) {
        await bulkUpsertCourseAssignments(session._id, payloads);
        await fetchCourseAssignments({ session_id: session?._id });
      }
    } catch {
      setError("Failed to update the linked course(s). Please try again.");
    }
  };

  return {
    isLoading,
    error,
    rows,
    setRows,
    filteredBatches,
    faculties,
    courses,
    courseAssignments,
    overviewData,
    backlogStats,
    updateRow,
    handleComponentTypeChange,
    addRow,
    deleteRow,
    deletingRowId,
    updateSyncedWith,
  };
}
