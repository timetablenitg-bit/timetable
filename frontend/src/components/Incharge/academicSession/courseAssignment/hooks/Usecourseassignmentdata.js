import { useEffect, useMemo, useState } from "react";
import useAdminStore from "../../../../../store/useAdminStore";
import { EVEN_SEMS, ODD_SEMS, DURATION_MAP } from "../constants";
import { buildRowPayload } from "../rowHelpers";

// Default row factory.
// elective_course: the actual elective picked for an elective slot row.
// elective_slot_id: stored so the backend knows which slot was filled.
const makeRow = (overrides = {}) => ({
  rowId: crypto.randomUUID(),
  course: null, // for slot rows: the slot Course doc
  elective_course: null, // for slot rows: the actual chosen elective
  faculty: null,
  assignment_type: "regular",
  component_type: "lecture",
  sessions_per_week: null,
  duration: 1,
  shared_lab_with: [], // Course ids sharing the same physical lab room
  synced_with: [], // CourseAssignment ids forced into the same slot
  isManual: false,
  assignmentId: undefined,
  _backlogCount: undefined,
  ...overrides,
});

// Owns: fetching batches/faculties/courses/assignments/backlog/overview for a
// session, and building+mutating the per-batch `rows` state that the table UI
// renders from.
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
  } = useAdminStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState({});
  const [backlogStats, setBacklogStats] = useState([]);
  const [overviewData, setOverviewData] = useState({});

  // ── Load all data ────────────────────────────────────────────────────────
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

  // ── Stable batch list for current term ──────────────────────────────────
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

  // ── Initialise rows from fetched data ────────────────────────────────────
  useEffect(() => {
    if (!filteredBatches.length || !courses.length) return;

    const newRows = {};

    filteredBatches.forEach((batch) => {
      const existing = courseAssignments?.filter((a) =>
        a.batch_ids?.some(
          (id) => (id?._id ?? id)?.toString() === batch._id?.toString(),
        ),
      );

      if (existing?.length) {
        newRows[batch._id] = existing.map((a) => {
          // For assignments that have an elective_slot_id, the course_id is the
          // actual elective. We need to restore slot + actual elective separately.
          const slotId = a.elective_slot_id?._id ?? a.elective_slot_id;
          const slotCourse = slotId
            ? courses.find((c) => c._id?.toString() === slotId?.toString())
            : null;

          const actualCourseId = a.course_id?._id ?? a.course_id;
          const actualCourse = courses.find(
            (c) => c._id?.toString() === actualCourseId?.toString(),
          );

          return makeRow({
            // If it was a slot assignment, row.course = slot, row.elective_course = actual
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
            // restore shared_lab_with as plain id strings/ObjectIds
            shared_lab_with: (a.shared_lab_with ?? []).map((c) => c?._id ?? c),
            // restore synced_with as plain id strings/ObjectIds
            synced_with: (a.synced_with ?? []).map((s) => s?._id ?? s),
            assignmentId: a._id,
          });
        });
      } else {
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
        newRows[batch._id] = batchCourses.map((course) =>
          makeRow({
            course,
            component_type: course.course_type === "LAB" ? "lab" : "lecture",
            duration: course.course_type === "LAB" ? 3 : 1,
          }),
        );
      }

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
  ]);

  // ── Row mutation helpers ─────────────────────────────────────────────────
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
      // dropping out of "lab" clears the now-meaningless shared_lab_with
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

  const deleteRow = (batchId, rowId) => {
    if (!window.confirm("Delete this course assignment?")) return;
    setRows((prev) => ({
      ...prev,
      [batchId]: prev[batchId].filter((r) => r.rowId !== rowId),
    }));
  };

  // 🔥 NEW: keep synced_with links two-directional across the whole `rows`
  // state (which spans every batch, not just the one currently open), and
  // persist both sides immediately. We can't rely on "Save Batch" for the
  // *other* side of the link because that assignment may belong to a batch
  // card the admin never opens/saves in this session.
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

    // Locate a row by assignmentId anywhere across all batches.
    const findRowLocation = (allRows, assignmentId) => {
      for (const [bId, list] of Object.entries(allRows)) {
        const r = list.find(
          (row) => row.assignmentId?.toString() === assignmentId,
        );
        if (r) return { batchId: bId, row: r };
      }
      return null;
    };

    // Snapshot used both to update local state and to build the API payload
    // for the "other side" of every added/removed link.
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

    // Update local state: current row + both sides of every affected link.
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

    // Persist both sides right away.
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
    courseAssignments, // expose raw list so the tab can pass it down as allAssignments
    overviewData,
    backlogStats,
    updateRow,
    handleComponentTypeChange,
    addRow,
    deleteRow,
    updateSyncedWith, // 🔥 NEW
  };
}
