import React, { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  User,
  FlaskConical,
  MonitorPlay,
  BookMarked,
  Link,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import useAdminStore from "../../../store/useAdminStore";

const COMPONENT_ICONS = {
  lecture: <MonitorPlay size={12} />,
  lab: <FlaskConical size={12} />,
  tutorial: <BookMarked size={12} />,
};

const COMPONENT_COLORS = {
  lecture:
    "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  lab: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  tutorial:
    "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800",
};

const ASSIGNMENT_TYPE_COLORS = {
  regular:
    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  backlog:
    "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  minor: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  oe: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
};

const GENERATION_STEPS = [
  "Fetching assignments...",
  "Building slot map...",
  "Running placement engine...",
  "Scoring timetable...",
  "Finalizing...",
];

const GenerationModal = ({ isOpen, error, success }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [displaySuccess, setDisplaySuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStepIndex(0);
      setDisplaySuccess(false);
      return;
    }

    // Reset on open
    setStepIndex(0);
    setDisplaySuccess(false);

    const interval = setInterval(() => {
      setStepIndex((prev) =>
        prev < GENERATION_STEPS.length - 1 ? prev + 1 : prev,
      );
    }, 1800);

    return () => clearInterval(interval);
  }, [isOpen]); // ← only depends on isOpen, NOT success

  // Delay showing success so steps have time to animate
  useEffect(() => {
    if (success) {
      const minDelay = setTimeout(() => setDisplaySuccess(true), 1000);
      return () => clearTimeout(minDelay);
    } else {
      setDisplaySuccess(false);
    }
  }, [success]);

  if (!isOpen) return null;

  const effectiveSuccess = displaySuccess;

  const progress = effectiveSuccess
    ? 100
    : error
      ? 0
      : Math.round(((stepIndex + 1) / GENERATION_STEPS.length) * 85);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-8 mx-4 w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-5">
          {error ? (
            <AlertCircle size={24} className="text-red-500" />
          ) : effectiveSuccess ? (
            <CheckCircle2 size={24} className="text-emerald-500" />
          ) : (
            <Sparkles size={24} className="text-emerald-500 animate-pulse" />
          )}
        </div>

        <p className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">
          {error
            ? "Generation failed"
            : effectiveSuccess
              ? "Timetable generated!"
              : "Generating timetable"}
        </p>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          {error
            ? error
            : effectiveSuccess
              ? "Your timetable has been successfully created."
              : "Please wait and do not close this page. The timetable engine is running."}
        </p>

        {!error && (
          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {!error && !effectiveSuccess && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {GENERATION_STEPS[stepIndex]}
          </p>
        )}
      </div>
    </div>
  );
};

const FinalizedAssignmentTab = ({ session }) => {
  const {
    courseAssignments,
    batches,
    fetchCourseAssignments,
    generateTimetable,
  } = useAdminStore();

  const [isLoading, setIsLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [genSuccess, setGenSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // State for collapsible batch sections
  const [collapsedSections, setCollapsedSections] = useState(() => new Set());

  // ── Load assignments for this session ──────────────────────────────────────
  useEffect(() => {
    if (!session?._id) return;
    setIsLoading(true);
    fetchCourseAssignments({ session_id: session._id }).finally(() =>
      setIsLoading(false),
    );
  }, [session?._id]);

  // ── Group assignments by batch ─────────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = {};
    courseAssignments.forEach((a) => {
      // Each assignment can belong to multiple batches (combined classes)
      const primaryBatchId = (
        a.batch_ids?.[0]?._id ?? a.batch_ids?.[0]
      )?.toString();
      const batch = batches.find((b) => b._id?.toString() === primaryBatchId);
      const key = batch?.batch_name ?? primaryBatchId ?? "Unknown Batch";
      if (!map[key]) map[key] = { batch, assignments: [] };
      map[key].assignments.push(a);
    });
    // Convert to array with unique collapse key (batch._id or batchName)
    return Object.entries(map).map(([displayName, { batch, assignments }]) => ({
      displayName,
      batch,
      assignments,
      collapseKey: batch?._id?.toString() ?? displayName,
    }));
  }, [courseAssignments, batches]);

  // Sort groups by display name
  const sortedGroups = useMemo(() => {
    return [...grouped].sort((a, b) =>
      a.displayName.localeCompare(b.displayName),
    );
  }, [grouped]);

  // ── Toggle collapse for a batch section ───────────────────────────────────
  const toggleSection = (key) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // ── Generate handler ───────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    setGenSuccess(false);
    setShowModal(true);

    try {
      await Promise.all([
        generateTimetable(session._id), // ← store action, throws on failure
        new Promise((r) => setTimeout(r, 3000)), // ← minimum time for steps to animate
      ]);

      setGenSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setGenSuccess(false);
      }, 2500);
    } catch (err) {
      setGenError(err?.message || "Timetable generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setGenError(null);
  };

  // ── States ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <Loader2 size={24} className="animate-spin text-emerald-500" />
        <span className="text-sm text-gray-400">Loading assignments...</span>
      </div>
    );
  }

  if (courseAssignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <BookOpen size={40} className="opacity-30" />
        <p className="text-sm text-center">
          No assignments found for this session.
          <br />
          Complete the Course Assignment tab first.
        </p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Generation modal ── */}
      <GenerationModal
        isOpen={showModal}
        error={genError}
        success={genSuccess}
      />

      {/* ── Add a close button overlay when there's an error ── */}
      {showModal && genError && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4 pointer-events-none">
          <button
            onClick={handleCloseModal}
            className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          >
            <X size={14} />
            Dismiss
          </button>
        </div>
      )}
      <div className="space-y-4">
        {/* ── Receipt header ── */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-800/50 rounded-xl p-4 border border-emerald-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
              Assignment Receipt
            </p>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {session?.term} Term · {courseAssignments.length} assignment
              {courseAssignments.length !== 1 ? "s" : ""} across{" "}
              {sortedGroups.length} batch{sortedGroups.length !== 1 ? "es" : ""}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {genError && (
              <span className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg">
                <AlertCircle size={12} />
                {genError}
              </span>
            )}
            {genSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg">
                <CheckCircle2 size={12} />
                Generation triggered!
              </span>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-sm transition-all hover:shadow-md"
            >
              {generating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {generating ? "Generating..." : "Generate Timetable"}
            </button>
          </div>
        </div>

        {/* ── Batch groups (collapsible sections) ── */}
        <div className="space-y-3">
          {sortedGroups.map(
            ({ displayName, batch, assignments, collapseKey }) => {
              const isCollapsed = collapsedSections.has(collapseKey);

              return (
                <div
                  key={collapseKey}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
                >
                  {/* Batch header - clickable to toggle collapse */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() => toggleSection(collapseKey)}
                  >
                    {/* Chevron icon to indicate expand/collapse state */}
                    <span className="text-gray-500 dark:text-gray-400 flex-none">
                      {isCollapsed ? (
                        <ChevronRight size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </span>
                    <GraduationCap
                      size={15}
                      className="text-emerald-500 flex-none"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {displayName}
                      </span>
                      {batch && (
                        <span className="ml-2 text-xs text-gray-400">
                          Sem {batch.semester} · {batch.department} ·{" "}
                          {batch.year}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-none">
                      {assignments.length} course
                      {assignments.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Assignment rows - only shown when not collapsed */}
                  {!isCollapsed && (
                    <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {assignments.map((a, i) => {
                        const courseName =
                          a.course_id?.course_name ?? a.course_id ?? "—";
                        const courseCode = a.course_id?.course_code ?? "";
                        const courseType = a.course_id?.course_type ?? "";
                        const credits = a.course_id?.credits ?? "—";
                        const facultyName =
                          a.faculty_id?.name ?? a.faculty_id ?? "—";
                        const facultyCode = a.faculty_id?.faculty_code ?? "";
                        const component = a.component_type ?? "lecture";
                        const assignType = a.assignment_type ?? "regular";
                        const isCombined = a.is_combined;
                        const combinedBatches = isCombined
                          ? (a.batch_ids ?? []).slice(1)
                          : [];

                        return (
                          <div
                            key={a._id ?? i}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors"
                          >
                            {/* Index */}
                            <span className="text-xs text-gray-300 dark:text-gray-600 w-5 pt-0.5 flex-none">
                              {i + 1}
                            </span>

                            {/* Main info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                  {courseName}
                                </p>
                                {courseCode && (
                                  <span className="text-xs text-gray-400">
                                    ({courseCode})
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Faculty */}
                                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <User size={11} />
                                  {facultyName}
                                  {facultyCode && (
                                    <span className="text-gray-300 dark:text-gray-600">
                                      · {facultyCode}
                                    </span>
                                  )}
                                </span>
                                {courseType && (
                                  <span className="text-xs text-gray-300 dark:text-gray-600">
                                    ·
                                  </span>
                                )}
                                {courseType && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {credits} cr · {courseType}
                                  </span>
                                )}
                                {/* Combined indicator */}
                                {isCombined && (
                                  <span className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400">
                                    <Link size={10} />
                                    Combined
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Badges */}
                            <div className="flex items-center gap-1.5 flex-none flex-wrap justify-end">
                              {/* Component type */}
                              <span
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                  COMPONENT_COLORS[component] ??
                                  COMPONENT_COLORS.lecture
                                }`}
                              >
                                {COMPONENT_ICONS[component]}
                                {component}
                              </span>
                              {/* Assignment type */}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  ASSIGNMENT_TYPE_COLORS[assignType] ??
                                  ASSIGNMENT_TYPE_COLORS.regular
                                }`}
                              >
                                {assignType}
                              </span>
                              {/* Sessions/wk if overridden */}
                              {a.sessions_per_week != null && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                  {a.sessions_per_week}/wk
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
      </div>
    </>
  );
};

export default FinalizedAssignmentTab;
