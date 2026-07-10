// Faculty pool for a row: filtered to the effective course's department,
// plus the batch's own department for non-first/second-semester batches.
export const getFacultyPoolForRow = (row, batch, faculties) => {
  const depts = new Set();
  // For slot rows, use the actual elective's dept if picked
  const effectiveCourse = row.course?.is_elective_slot
    ? row.elective_course
    : row.course;
  if (effectiveCourse?.department) depts.add(effectiveCourse.department);
  if (batch.semester !== 1 && batch.semester !== 2 && batch.department) {
    depts.add(batch.department);
  }
  return faculties.filter((f) => depts.has(f.department));
};

// Candidate courses a lab row can declare a shared room with.
// Only other LAB-type courses, excluding the row's own course.
export const getLabCoursePoolForRow = (row, courses) => {
  const ownCourseId = (
    row.course?.is_elective_slot ? row.elective_course?._id : row.course?._id
  )?.toString();

  return courses.filter(
    (c) => c.course_type === "LAB" && c._id?.toString() !== ownCourseId,
  );
};

// Candidate assignments a row can be slot-synced with.
// Sync only makes sense between already-saved assignments (need a real
// CourseAssignment _id on both sides), so unsaved rows are excluded.
// `allAssignments` is the raw populated list from the store
// (useAdminStore().courseAssignments).
//
// 🔒 A course offered in a batch cannot be linked with another course that
// is *also* offered in that same batch — synced_with exists to combine the
// same slot across DIFFERENT batches (e.g. two batches sharing one lecture),
// not courses that already coexist side-by-side in one batch's timetable.
// So any candidate assignment that shares `batchId` with the current row is
// excluded.
export const getSyncCandidatesForRow = (row, allAssignments, batchId) => {
  if (!row.assignmentId) return [];

  return (
    (allAssignments ?? [])
      .filter((a) => a._id?.toString() !== row.assignmentId?.toString())
      .filter(
        (a) =>
          !(a.batch_ids ?? []).some(
            (b) => (b?._id ?? b)?.toString() === batchId?.toString(),
          ),
      )
      // 🚫 slot sync is for lecture/tutorial-style sessions sharing a slot
      // across batches — lab sessions use shared_lab_with instead, so keep
      // them out. component_type lives on the ASSIGNMENT ("lecture"/"lab"/
      // "tutorial", lowercase) — not course_type on Course ("THEORY"/"LAB").
      .filter((a) => a.component_type !== "lab")
      .map((a) => {
        const courseCode = a.course_id?.course_code ?? "";
        const courseName = a.course_id?.course_name ?? "";
        const courseLabel =
          courseCode && courseName
            ? `${courseCode} — ${courseName}`
            : courseCode || courseName || "Course";
        const batchLabel = (a.batch_ids ?? [])
          .map((b) => b.batch_name)
          .join(", ");
        const facultyId = (a.faculty_id?._id ?? a.faculty_id)?.toString();
        // 🔍 adjust `.name` if your Faculty schema uses a different field
        // (e.g. `full_name`, or `first_name`/`last_name` to join instead)
        const facultyName = a.faculty_id?.name ?? "";
        return {
          _id: a._id,
          label: facultyName
            ? `${courseLabel} · ${batchLabel} · ${facultyName}`
            : `${courseLabel} · ${batchLabel}`,
          course_code: courseCode,
          course_name: courseName,
          facultyId,
          facultyName,
        };
      })
  );
};

// Builds the API payload for a single row. Shared by the save hook (bulk
// "Save Batch" / "Save All") and the data hook (immediate persistence of
// synced_with links, which can touch rows in batches that aren't open).
// For slot rows: course_id = actual elective, elective_slot_id = slot._id
// For normal rows: course_id = course._id, elective_slot_id = null
//
// shared_lab_with now holds ASSIGNMENT ids (specific batch lab sessions),
// not course ids — see getLabAssignmentPoolForRow above. No change needed
// here since we just pass the array through as-is.
//
// Returns null if the row isn't complete enough to save yet.
export const buildRowPayload = (row, batchId, sessionId) => {
  const isSlot = row.course?.is_elective_slot;
  const isComplete = isSlot
    ? row.elective_course && row.faculty
    : row.course && row.faculty;
  if (!isComplete) return null;

  return {
    ...(row.assignmentId ? { _id: row.assignmentId } : {}),
    session_id: sessionId,
    batch_ids: [batchId],
    course_id: isSlot ? row.elective_course._id : row.course._id,
    elective_slot_id: isSlot ? row.course._id : null,
    faculty_id: row.faculty._id,
    assignment_type: row.assignment_type,
    component_type: row.component_type,
    duration: row.duration,
    // only send shared_lab_with for labs — keeps the backend's "lab-only"
    // validation happy even if stale state lingers client-side
    shared_lab_with:
      row.component_type === "lab" ? (row.shared_lab_with ?? []) : [],
    synced_with: row.synced_with ?? [],
    ...(row.sessions_per_week != null
      ? { sessions_per_week: row.sessions_per_week }
      : {}),
  };
};
