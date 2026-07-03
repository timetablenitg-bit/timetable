import React, { useEffect, useMemo, useState } from "react";
import { Loader2, AlertCircle, BookOpen } from "lucide-react";
import useCourseAssignmentData from "./hooks/useCourseAssignmentData";
import useCourseAssignmentSave from "./hooks/useCourseAssignmentSave";
import BatchAssignmentCard from "./BatchAssignmentCard";
import BatchToolbar from "./BatchToolbar";

const CourseAssignmentTab = ({ session, onSave, onAssignmentsChange }) => {
  const data = useCourseAssignmentData(session);
  const save = useCourseAssignmentSave({
    session,
    rows: data.rows,
    onSave,
  });

  const [expandedBatches, setExpandedBatches] = useState({});
  const toggleBatch = (id) =>
    setExpandedBatches((p) => ({ ...p, [id]: !p[id] }));

  // ── Toolbar state ──────────────────────────────────────────────────────
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [sortBy, setSortBy] = useState("department");
  const [sortDir, setSortDir] = useState("asc");
  const toggleSortDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  const departments = useMemo(
    () => [...new Set(data.filteredBatches.map((b) => b.department))].sort(),
    [data.filteredBatches],
  );
  const years = useMemo(
    () => [...new Set(data.filteredBatches.map((b) => b.year))].sort(),
    [data.filteredBatches],
  );

  const displayedBatches = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return data.filteredBatches
      .filter((b) =>
        filterDepartment ? b.department === filterDepartment : true,
      )
      .filter((b) => (filterYear ? String(b.year) === filterYear : true))
      .sort((a, b) => {
        if (sortBy === "department") {
          return a.department.localeCompare(b.department) * dir;
        }
        if (sortBy === "year") {
          return (a.year - b.year) * dir;
        }
        return a.batch_name.localeCompare(b.batch_name) * dir;
      });
  }, [data.filteredBatches, filterDepartment, filterYear, sortBy, sortDir]);

  // Report the live (not-yet-saved) payload up to the parent whenever rows change,
  // so things like setSavedAssignments stay in sync as the admin edits.
  useEffect(() => {
    if (!onAssignmentsChange) return;
    const livePayload = Object.keys(data.rows).flatMap(save.buildPayload);
    onAssignmentsChange(livePayload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.rows]);

  if (data.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={40} className="animate-spin text-emerald-500 mb-3" />
        <p className="text-sm text-gray-500">Loading course data...</p>
      </div>
    );
  }

  const topLevelError = data.error || save.error;

  return (
    <div className="space-y-4">
      <BatchToolbar
        departments={departments}
        filterDepartment={filterDepartment}
        onFilterDepartmentChange={setFilterDepartment}
        years={years}
        filterYear={filterYear}
        onFilterYearChange={setFilterYear}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortDir={sortDir}
        onToggleSortDir={toggleSortDir}
        resultCount={displayedBatches.length}
      />

      {topLevelError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle size={16} /> {topLevelError}
        </div>
      )}

      {/* ── Batch list ── */}
      {displayedBatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
          <BookOpen size={48} className="opacity-20 mb-3" />
          <p className="text-sm">
            {data.filteredBatches.length === 0
              ? `No batches found for the ${session?.term} term.`
              : "No batches match your search/filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedBatches.map((batch) => {
            return (
              <BatchAssignmentCard
                key={batch._id}
                batch={batch}
                batchRows={data.rows[batch._id] ?? []}
                batchCounts={data.overviewData[batch._id] ?? {}}
                courses={data.courses}
                faculties={data.faculties}
                allAssignments={data.courseAssignments}
                isExpanded={!!expandedBatches[batch._id]}
                onToggle={() => toggleBatch(batch._id)}
                onUpdateRow={(rowId, patch) =>
                  data.updateRow(batch._id, rowId, patch)
                }
                onComponentTypeChange={(rowId, v) =>
                  data.handleComponentTypeChange(batch._id, rowId, v)
                }
                onSyncedWithChange={(rowId, nextSyncedIds) =>
                  data.updateSyncedWith(batch._id, rowId, nextSyncedIds)
                }
                onDeleteRow={(rowId) => data.deleteRow(batch._id, rowId)}
                onAddRow={() => data.addRow(batch._id)}
                onSaveBatch={() => save.saveBatchAssignments(batch._id)}
                isSaving={save.savingBatch === batch._id}
                error={save.batchErrors[batch._id]}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourseAssignmentTab;
