import React, { useState, useCallback } from "react";
import {
  Send,
  BookCheck,
  Search,
  AlertCircle,
  FileDown,
  CheckCircle,
  ListPlus,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useStudentStore } from "../../store/useStudentStore";

import CourseSearchList from "./CourseSearchList";
import RegistrationSummary from "./RegistrationSummary";
i;

const CourseRegistrationForm = ({
  regularCourses, // semester courses for this student's batch
  allCourses, // full catalogue — for backlog tab
  batchDetails, // the session object
  existingRegistration, // pre-filled if resuming (from getMyCourseRegistration)
  onBack,
  onRegistrationComplete,
}) => {
  const { saveCourses, submitRegistration } = useStudentStore();

  const [tab, setTab] = useState("regular");
  const [searchTerm, setSearchTerm] = useState("");

  const normalize = (course) => ({
    ...course,
    code: course.course_code,
    name: course.course_name,
    type: course.course_type === "THEORY" ? "Theory" : "Lab",
    L: course.hours?.lecture ?? 0,
    T: course.hours?.tutorial ?? 0,
    P: course.hours?.practical ?? 0,
  });

  const [selectedRegular, setSelectedRegular] = useState(
    () =>
      existingRegistration?.regularCourses
        ?.filter((c) => c.course && typeof c.course === "object") // ← guard
        ?.map((c) => ({
          ...normalize(c.course),
          registrationType: "regular",
        })) || [],
  );

  const [selectedBacklog, setSelectedBacklog] = useState(
    () =>
      existingRegistration?.backlogCourses
        ?.filter((c) => c.course && typeof c.course === "object") // ← guard
        ?.map((c) => ({
          ...normalize(c.course),
          registrationType: "backlog",
        })) || [],
  );

  const [isSubmitted, setIsSubmitted] = useState(
    existingRegistration?.status === "COMPLETED",
  );
  const [lastSubmittedSnapshot, setLastSubmittedSnapshot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isCompleted = existingRegistration?.status === "COMPLETED";
  const sessionId = batchDetails?.sessionId;

  const allSelected = [
    ...selectedRegular.map((c) => ({ ...c, registrationType: "regular" })),
    ...selectedBacklog.map((c) => ({ ...c, registrationType: "backlog" })),
  ];
  console.log("All selected courses:", allSelected);

  const totalCredits = allSelected.reduce(
    (sum, c) => sum + (c.credits || 0),
    0,
  );

  const autoSave = useCallback(
    async (regular, backlog) => {
      if (!sessionId || isCompleted) return;
      setIsSaving(true);
      await saveCourses({
        sessionId,
        regularCourses: regular
          .filter((c) => c._id) // ← guard
          .map((c) => ({ course: c._id, courseCode: c.code })),
        backlogCourses: backlog
          .filter((c) => c._id) // ← guard
          .map((c) => ({ course: c._id, courseCode: c.code })),
      });
      setIsSaving(false);
    },
    [sessionId, isCompleted, saveCourses],
  );

  const addCourse = (course, registrationType) => {
    if (registrationType === "regular") {
      if (selectedRegular.find((c) => c.code === course.code)) {
        toast.warning(`${course.code} is already added.`);
        return;
      }
      const next = [...selectedRegular, course];
      setSelectedRegular(next);
      autoSave(next, selectedBacklog);
    } else {
      if (selectedBacklog.find((c) => c.code === course.code)) {
        toast.warning(`${course.code} is already added.`);
        return;
      }
      const next = [...selectedBacklog, course];
      setSelectedBacklog(next);
      autoSave(selectedRegular, next);
    }
    toast.success(`Added ${course.name}`);
  };

  const removeCourse = (code) => {
    if (selectedRegular.find((c) => c.code === code)) {
      const next = selectedRegular.filter((c) => c.code !== code);
      setSelectedRegular(next);
      autoSave(next, selectedBacklog);
    } else {
      const next = selectedBacklog.filter((c) => c.code !== code);
      setSelectedBacklog(next);
      autoSave(selectedRegular, next);
    }
    toast.success("Course removed.");
  };

  const handleFinalSubmit = async () => {
    if (allSelected.length === 0) {
      toast.error("Add at least one course before submitting.");
      return;
    }
    setIsSubmitting(true);
    const ok = await submitRegistration(sessionId);
    setIsSubmitting(false);
    if (ok) {
      setLastSubmittedSnapshot(allSelected);
      setIsSubmitted(true);
      setShowConfirm(false);
      if (onRegistrationComplete) onRegistrationComplete();
    }
  };

  const coursesForTab = tab === "regular" ? regularCourses : allCourses;
  const selectedCodesForTab =
    tab === "regular"
      ? selectedRegular.map((c) => c.code)
      : selectedBacklog.map((c) => c.code);

  // ── success view ──
  if (isSubmitted) {
    const snap = lastSubmittedSnapshot || allSelected;
    const regularSnap = snap.filter((c) => c.registrationType === "regular");
    const backlogSnap = snap.filter((c) => c.registrationType === "backlog");
    const theoryCount = snap.filter((c) => c.type === "Theory").length;
    const labCount = snap.filter((c) => c.type === "Lab").length;
    const totalCredits = snap.reduce((sum, c) => sum + (c.credits || 0), 0);

    const CourseRow = ({ course }) => (
      <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`flex-none text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
              course.type === "Lab"
                ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                : "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400"
            }`}
          >
            {course.type}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
              {course.name}
            </p>
            <p className="text-xs text-slate-400">{course.code}</p>
          </div>
        </div>
        <span className="flex-none ml-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {course.credits} cr
        </span>
      </div>
    );

    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-lg w-full mx-auto space-y-4">
          {/* Header */}
          <div className="text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle
                size={28}
                className="text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Registration Confirmed
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {snap.length} courses · {totalCredits} total credits ·{" "}
              {theoryCount} theory · {labCount} lab
            </p>
          </div>

          {/* Regular courses */}
          {regularSnap.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                  Regular Courses
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {regularSnap.reduce((s, c) => s + (c.credits || 0), 0)} cr
                </span>
              </div>
              <div className="px-4">
                {regularSnap.map((c) => (
                  <CourseRow key={c.code} course={c} />
                ))}
              </div>
            </div>
          )}

          {/* Backlog courses */}
          {backlogSnap.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                  Backlog Courses
                </span>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {backlogSnap.reduce((s, c) => s + (c.credits || 0), 0)} cr
                </span>
              </div>
              <div className="px-4">
                {backlogSnap.map((c) => (
                  <CourseRow key={c.code} course={c} />
                ))}
              </div>
            </div>
          )}

          {/* Back button */}
          {onBack && (
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── main form ──
  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
          )}
          {isSaving && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <Loader2 size={12} className="animate-spin" />
              Saving…
            </span>
          )}
        </div>

        {isCompleted ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
            <CheckCircle size={13} />
            Submitted — Locked
          </span>
        ) : (
          allSelected.length > 0 && (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
            >
              <Send size={16} />
              Finalize Registration
            </button>
          )
        )}
      </div>

      {/* Session banner */}
      {batchDetails && (
        <div className="flex-shrink-0 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800/50 rounded-xl p-4 border border-indigo-100 dark:border-gray-700 my-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {batchDetails.term} Term · {batchDetails.academic_year}
              </h3>
            </div>
            <div className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <span className="text-xs font-medium text-indigo-700 dark:text-indigo-400">
                Registration Open
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Note / lock warning */}
      {isCompleted ? (
        <div className="flex-shrink-0 flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl mb-2">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-amber-900 dark:text-amber-300">
            Registration has been submitted and is locked. No changes can be
            made.
          </p>
        </div>
      ) : (
        <div className="flex-shrink-0 mt-4 flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-xl">
          <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-blue-900 dark:text-blue-300">
            <span className="font-bold">Note:</span> Review your selected
            courses carefully. Once submitted, you cannot modify your
            registration.
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-h-0 mt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {/* Left — Course Picker */}
          <div className="lg:col-span-6 h-full">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col h-full">
              {/* Tabs */}
              <div className="flex-shrink-0 flex border-b border-slate-100 dark:border-slate-800">
                {["regular", "backlog"].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTab(t);
                      setSearchTerm("");
                    }}
                    className={`flex-1 py-3 text-sm font-medium transition-colors capitalize border-b-2 ${
                      tab === t
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    {t === "regular" ? "Regular" : "Backlog"}
                    {t === "regular" && selectedRegular.length > 0 && (
                      <span className="ml-1.5 text-xs text-gray-400">
                        ({selectedRegular.length})
                      </span>
                    )}
                    {t === "backlog" && selectedBacklog.length > 0 && (
                      <span className="ml-1.5 text-xs text-gray-400">
                        ({selectedBacklog.length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search header */}
              <div className="flex-shrink-0 p-4 lg:p-5 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
                <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white">
                  <BookCheck size={20} className="text-emerald-500" />
                  {tab === "regular" ? "Semester Courses" : "All Courses"}
                </h2>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search by course code or name..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all dark:text-gray-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <CourseSearchList
                  courses={coursesForTab}
                  searchTerm={searchTerm}
                  onAdd={(course) => addCourse(course, tab)}
                  selectedCodes={selectedCodesForTab}
                  disabled={isCompleted}
                />
              </div>
            </div>
          </div>

          {/* Right — Summary */}
          <div className="lg:col-span-6 h-full">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col h-full">
              <div className="flex-shrink-0 p-4 lg:p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                    <ListPlus
                      size={20}
                      className="text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                      Registration Summary
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Review your selected courses
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <RegistrationSummary
                  selectedCourses={allSelected}
                  onRemove={removeCourse}
                  disabled={isCompleted}
                />
              </div>

              {allSelected.length > 0 && (
                <div className="flex-shrink-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total Courses:
                    </span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {allSelected.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total Credits:
                    </span>
                    <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                      {totalCredits}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 max-w-sm w-[90%]">
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-2">
              Finalize registration?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              You're submitting{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {selectedRegular.length} regular
              </span>{" "}
              and{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {selectedBacklog.length} backlog
              </span>{" "}
              courses ({totalCredits} credits total). This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-medium transition-colors"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {isSubmitting ? "Submitting…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseRegistrationForm;
