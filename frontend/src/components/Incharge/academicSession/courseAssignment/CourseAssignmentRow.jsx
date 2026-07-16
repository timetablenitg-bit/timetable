import React from "react";
import { Trash2, Loader2 } from "lucide-react";
import CourseCell from "./CourseCell";
import FacultyCell from "./FacultyCell";
import CompactSelect from "./CompactSelect";
import SharedLabPicker from "./SharedLabPicker";
import SyncedWithPicker from "./SyncedWithPicker";
import {
  getFacultyPoolForRow,
  getLabAssignmentPoolForRow,
  getSyncCandidatesForRow,
} from "./RowHelpers";
import { ASSIGNMENT_TYPE_OPTIONS, COMPONENT_TYPE_OPTIONS } from "./constants";

// One <tr> inside the desktop table.
const CourseAssignmentRow = ({
  row,
  idx,
  batch,
  batchCounts,
  courses,
  faculties,
  allAssignments,
  onUpdateRow, // (patch) => void
  onComponentTypeChange, // (component_type) => void
  onSyncedWithChange, // (nextSyncedWithIds) => void
  onDeleteRow, // () => void
  isDeleting, // 🔥 NEW — true while this row's delete request is in flight
}) => {
  const rowClasses = row.course?.is_elective_slot
    ? "bg-violet-50/40 dark:bg-violet-900/10 hover:bg-violet-50 dark:hover:bg-violet-900/20"
    : row.assignment_type === "backlog"
      ? "bg-amber-50/60 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20"
      : "hover:bg-gray-50 dark:hover:bg-gray-700/30";

  const isLab = row.component_type === "lab";
  // 🔥 assignment-based pool — lets rows in DIFFERENT batches running the
  // SAME lab course (e.g. Chemistry Lab for SecA and SecB) still be linked,
  // since each batch's session is a distinct CourseAssignment.
  const labAssignmentPool = isLab
    ? getLabAssignmentPoolForRow(row, allAssignments)
    : [];
  // 🔥 same-batch assignments are excluded here (a course can't be linked
  // with another course offered in the same batch)
  const syncCandidates = getSyncCandidatesForRow(
    row,
    allAssignments,
    batch._id,
  );

  // 🔥 Warn the admin before linking two assignments taught by the same
  // faculty — syncing them effectively combines the classes into one.
  const handleSyncedWithChange = (next) => {
    const prevIds = (row.synced_with ?? []).map((id) =>
      (id?._id ?? id)?.toString(),
    );
    const nextIds = next.map((id) => (id?._id ?? id)?.toString());
    const addedIds = nextIds.filter((id) => !prevIds.includes(id));

    const addingSameFaculty = addedIds.some((id) => {
      const candidate = syncCandidates.find((c) => c._id?.toString() === id);
      return (
        candidate?.facultyId &&
        row.faculty?._id &&
        candidate.facultyId === row.faculty._id.toString()
      );
    });

    if (addingSameFaculty) {
      const confirmed = window.confirm(
        "This course and the one you're linking it to are taught by the same faculty. Linking them will combine the classes into a single session. Continue?",
      );
      if (!confirmed) return;
    }

    onSyncedWithChange(next);
  };

  return (
    <tr
      className={`transition-colors ${rowClasses} ${
        isDeleting ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <td className="px-4 py-3 text-xs text-gray-400 align-middle">
        {idx + 1}
      </td>

      {/* Course cell */}
      <td className="px-4 py-3 align-middle">
        <CourseCell
          row={row}
          batch={batch}
          batchCounts={batchCounts}
          courses={courses}
          onChange={onUpdateRow}
        />
      </td>

      {/* Faculty — full name chip, widened so names aren't clipped */}
      <td className="px-3 py-3 w-44 align-middle">
        <FacultyCell
          faculties={getFacultyPoolForRow(row, batch, faculties)}
          allFaculties={faculties}
          value={row.faculty}
          onChange={(f) => onUpdateRow({ faculty: f })}
        />
      </td>

      {/* Assignment type */}
      <td className="px-3 py-3 align-middle">
        <CompactSelect
          value={row.assignment_type}
          onChange={(v) => onUpdateRow({ assignment_type: v })}
          options={ASSIGNMENT_TYPE_OPTIONS}
          className="w-full"
        />
      </td>

      {/* Component type */}
      <td className="px-3 py-3 align-middle">
        <CompactSelect
          value={row.component_type}
          onChange={(v) => {
            onComponentTypeChange(v);
            if (v !== "lab" && row.shared_lab_with?.length) {
              onUpdateRow({ shared_lab_with: [] });
            }
          }}
          options={COMPONENT_TYPE_OPTIONS}
          className="w-full"
        />
      </td>

      {/* Sessions per week */}
      <td className="px-3 py-3 text-center align-middle">
        <input
          type="number"
          min={1}
          max={10}
          placeholder="–"
          value={row.sessions_per_week ?? ""}
          onChange={(e) =>
            onUpdateRow({
              sessions_per_week: e.target.value ? Number(e.target.value) : null,
            })
          }
          className="w-12 text-center text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-1.5 py-1.5 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </td>

      {/* Links — lab room + slot sync, compact icon buttons, same row */}
      <td className="px-3 py-3 align-middle">
        <div className="flex items-center justify-center gap-1.5">
          {isLab && (
            <SharedLabPicker
              labAssignmentPool={labAssignmentPool}
              sharedLabWith={row.shared_lab_with}
              onChange={(next) => onUpdateRow({ shared_lab_with: next })}
              compact
            />
          )}
          <SyncedWithPicker
            syncCandidates={syncCandidates}
            syncedWith={row.synced_with}
            onChange={handleSyncedWithChange}
            disabled={!row.assignmentId}
            compact
          />
        </div>
      </td>

      {/* Delete */}
      <td className="px-3 py-3 text-center align-middle">
        <button
          onClick={onDeleteRow}
          disabled={isDeleting}
          aria-label="Delete course assignment"
          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60 disabled:hover:bg-transparent rounded-lg transition-colors"
        >
          {isDeleting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      </td>
    </tr>
  );
};

export default CourseAssignmentRow;
