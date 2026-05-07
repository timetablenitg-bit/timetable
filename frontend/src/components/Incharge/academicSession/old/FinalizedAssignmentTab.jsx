import React, { useEffect, useState } from "react";
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import useAdminStore from "../../../../store/useAdminStore";

const FinalizedAssignmentTab = ({ session }) => {
  const { courseAssignments, fetchCourseAssignments, isLoading } =
    useAdminStore();

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [genSuccess, setGenSuccess] = useState(false);

  useEffect(() => {
    if (session?._id) {
      fetchCourseAssignments({ session_id: session._id });
    }
  }, [session?._id]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    setGenSuccess(false);

    try {
      // TODO: wire up actual timetable generation API call here
      await new Promise((res) => setTimeout(res, 1500)); // placeholder
      setGenSuccess(true);
    } catch {
      setGenError("Timetable generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Review all finalized course assignments before generating the timetable.
      </p>

      {/* Assignment Summary Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-blue-500" />
          <span className="ml-3 text-sm text-gray-400 dark:text-gray-500">
            Loading…
          </span>
        </div>
      ) : courseAssignments.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500 text-sm">
          No assignments found. Add course assignments in the first tab.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
          {courseAssignments.map((assignment) => (
            <div
              key={assignment._id}
              className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <CheckCircle2
                  size={16}
                  className="text-blue-500 dark:text-blue-400"
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {assignment.course_id?.course_name ?? "—"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {assignment.course_id?.course_code}
                </p>
                <div className="flex flex-wrap gap-x-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    <span className="font-medium text-gray-600 dark:text-gray-300">
                      Faculty:
                    </span>{" "}
                    {assignment.faculty_id?.name ?? "—"}
                  </span>
                  <span>
                    <span className="font-medium text-gray-600 dark:text-gray-300">
                      Batch:
                    </span>{" "}
                    {assignment.batch_id?.batch_name ?? "—"}
                  </span>
                  {assignment.backlog_batch_id && (
                    <span>
                      <span className="font-medium text-gray-600 dark:text-gray-300">
                        Backlog:
                      </span>{" "}
                      {assignment.backlog_batch_id?.batch_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {courseAssignments.length > 0 ? (
            <>
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {courseAssignments.length}
              </span>{" "}
              assignment{courseAssignments.length !== 1 ? "s" : ""} ready for
              generation
            </>
          ) : (
            "Add assignments before generating"
          )}
        </div>

        <div className="flex items-center gap-3">
          {genError && (
            <span className="flex items-center gap-1.5 text-sm text-red-500 dark:text-red-400">
              <AlertCircle size={14} />
              {genError}
            </span>
          )}
          {genSuccess && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={14} />
              Timetable generated!
            </span>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating || courseAssignments.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 hover:-translate-y-[1px]"
          >
            {generating ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Sparkles size={15} className="text-yellow-300" />
            )}
            {generating ? "Generating…" : "Generate Timetable"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalizedAssignmentTab;
