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

export const getLabAssignmentPoolForRow = (row, allAssignments) => {
  return (allAssignments ?? [])
    .filter((a) => a.component_type === "lab")
    .filter((a) => a._id?.toString() !== row.assignmentId?.toString())
    .map((a) => {
      const courseCode = a.course_id?.course_code ?? "";
      const courseName = a.course_id?.course_name ?? "";
      const batchLabel = (a.batch_ids ?? [])
        .map((b) => b.batch_name)
        .join(", ");
      // 🔍 adjust `.name` if your Faculty schema uses a different field
      const facultyName = a.faculty_id?.name ?? "";
      return {
        _id: a._id,
        course_code: courseCode,
        course_name: courseName,
        batch_name: batchLabel,
        faculty_name: facultyName,
      };
    });
};

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
        const batchLabel = (a.batch_ids ?? [])
          .map((b) => b.batch_name)
          .join(", ");
        // 🔍 adjust `.name` if your Faculty schema uses a different field
        // (e.g. `full_name`, or `first_name`/`last_name` to join instead)
        const facultyName = a.faculty_id?.name ?? "";
        return {
          _id: a._id,
          course_code: courseCode,
          course_name: courseName,
          batch_name: batchLabel || "Unnamed batch",
          faculty_name: facultyName,
        };
      })
  );
};

// 🔥 NEW — case 3 (>2 backlogs, student has to drop a current-sem course).
// Candidates are the batch's OWN already-assigned, non-backlog rows — you
// drop a current-sem course, not another backlog course.
export const getDropCourseCandidatesForRow = (row, allAssignments, batchId) => {
  return (allAssignments ?? [])
    .filter((a) => a._id?.toString() !== row.assignmentId?.toString())
    .filter((a) => a.assignment_type !== "backlog")
    .filter((a) =>
      (a.batch_ids ?? []).some(
        (b) => (b?._id ?? b)?.toString() === batchId?.toString(),
      ),
    )
    .map((a) => ({
      _id: a._id,
      course_code: a.course_id?.course_code ?? "",
      course_name: a.course_id?.course_name ?? "",
      faculty_name: a.faculty_id?.name ?? "",
    }));
};

// 🔥 NEW — case 4 (disjoint backlog groups sharing a slot). Candidates are
// other saved BACKLOG rows, in ANY batch — the whole point is that Maths
// backlog in SecA can run parallel to Chem backlog in SecB.
export const getParallelCandidatesForRow = (row, allAssignments, batchId) => {
  return (allAssignments ?? [])
    .filter((a) => a._id?.toString() !== row.assignmentId?.toString())
    .filter((a) => a.assignment_type === "backlog")
    .map((a) => ({
      _id: a._id,
      course_code: a.course_id?.course_code ?? "",
      course_name: a.course_id?.course_name ?? "",
      batch_name:
        (a.batch_ids ?? []).map((b) => b.batch_name).join(", ") ||
        "Unnamed batch",
      faculty_name: a.faculty_id?.name ?? "",
    }));
};

export const buildRowPayload = (row, batchId, sessionId) => {
  const isSlot = row.course?.is_elective_slot;
  const isComplete = isSlot
    ? row.elective_course && row.faculty
    : row.course && row.faculty;
  if (!isComplete) return null;

  const isBacklog = row.assignment_type === "backlog";

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
    // 🔥 NEW — only send these for backlog rows, same "keep backend
    // validation happy even with stale client state" reasoning as above
    drop_course_id: isBacklog ? (row.drop_course_id ?? null) : null,
    parallel_with: isBacklog ? (row.parallel_with ?? []) : [],
    ...(row.sessions_per_week != null
      ? { sessions_per_week: row.sessions_per_week }
      : {}),
  };
};
