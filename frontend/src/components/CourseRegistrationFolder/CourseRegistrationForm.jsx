import React, { useState } from "react";
import {
  Send,
  BookCheck,
  Search,
  AlertCircle,
  CheckCircle,
  ListPlus,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useStudentStore } from "../../store/useStudentStore";

import CourseSearchList from "./CourseSearchList";
import RegistrationSummary from "./RegistrationSummary";

const CourseRegistrationForm = ({
  allCourses, // full catalogue — backlog courses are picked from here
  batchDetails, // the session object
  existingRegistration, // pre-filled if resuming (from getMyCourseRegistration)
  onBack,
  onRegistrationComplete,
}) => {
  const { submitRegistration } = useStudentStore();

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

  const [selectedCourses, setSelectedCourses] = useState(
    () =>
      existingRegistration?.backlogCourses
        ?.filter((c) => c.course && typeof c.course === "object")
        ?.map((c) => normalize(c.course)) || [],
  );

  const [isSubmitted, setIsSubmitted] = useState(
    existingRegistration?.status === "COMPLETED",
  );
  const [lastSubmittedSnapshot, setLastSubmittedSnapshot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isCompleted = existingRegistration?.status === "COMPLETED";
  const sessionId = batchDetails?.sessionId;
  const batchId = batchDetails?.batch?._id;

  const totalCredits = selectedCourses.reduce(
    (sum, c) => sum + (c.credits || 0),
    0,
  );

  const addCourse = (course) => {
    if (selectedCourses.find((c) => c.code === course.code)) {
      toast.warning(`${course.code} is already added.`);
      return;
    }
    const backlogCourse = { ...course, registrationType: "backlog" };
    setSelectedCourses((prev) => [...prev, backlogCourse]);
    toast.success(`Added ${course.name}`);
  };

  const removeCourse = (code) => {
    setSelectedCourses((prev) => prev.filter((c) => c.code !== code));
    toast.success("Course removed.");
  };

  const handleFinalSubmit = async () => {
    if (selectedCourses.length === 0) {
      toast.error("Add at least one course before submitting.");
      return;
    }
    setIsSubmitting(true);
    const ok = await submitRegistration({
      sessionId,
      batchId,
      backlogCourses: selectedCourses
        .filter((c) => c._id)
        .map((c) => ({ course: c._id, courseCode: c.code })),
    });
    setIsSubmitting(false);
    if (ok) {
      setLastSubmittedSnapshot(selectedCourses);
      setIsSubmitted(true);
      setShowConfirm(false);
      if (onRegistrationComplete) onRegistrationComplete();
    }
  };

  const selectedCodes = selectedCourses.map((c) => c.code);

  // ── success view ──
  if (isSubmitted) {
    const snap = lastSubmittedSnapshot || selectedCourses;
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

          {snap.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                  Backlog Courses
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {totalCredits} cr
                </span>
              </div>
              <div className="px-4">
                {snap.map((c) => (
                  <CourseRow key={c._id || c.code} course={c} />
                ))}
              </div>
            </div>
          )}

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
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        )}

        {isCompleted ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
            <CheckCircle size={13} />
            Submitted — Locked
          </span>
        ) : (
          selectedCourses.length > 0 && (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg shadow-sm transition-colors whitespace-nowrap"
            >
              <Send size={16} />
              Finalize Registration
            </button>
          )
        )}
      </div>

      {/* single, calm info banner instead of two competing colored ones */}
      <div className="shrink-0 mt-4 flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl">
        <AlertCircle className="text-slate-400 shrink-0 mt-0.5" size={16} />
        <p className="text-xs text-slate-600 dark:text-slate-300">
          {isCompleted
            ? "Registration has been submitted and is locked. No changes can be made."
            : "Review your selected courses carefully — once submitted, you cannot modify your registration."}
        </p>
      </div>

      <div className="flex-1 min-h-0 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {/* Left — Course Picker */}
          <div className="lg:col-span-6 h-full">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
              <div className="shrink-0 p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
                <h2 className="text-base font-bold flex items-center gap-2 dark:text-white">
                  <BookCheck size={18} className="text-emerald-500" />
                  All Courses
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
                  courses={allCourses}
                  searchTerm={searchTerm}
                  onAdd={addCourse}
                  selectedCodes={selectedCodes}
                  disabled={isCompleted}
                />
              </div>
            </div>
          </div>

          {/* Right — Summary */}
          <div className="lg:col-span-6 h-full">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
              <div className="shrink-0 p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <ListPlus size={18} className="text-indigo-500" />
                    Registration Summary
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Review your selected courses
                  </p>
                </div>
                {selectedCourses.length > 0 && (
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">
                      {selectedCourses.length} courses
                    </p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {totalCredits} credits
                    </p>
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-0">
                <RegistrationSummary
                  selectedCourses={selectedCourses}
                  onRemove={removeCourse}
                  disabled={isCompleted}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 max-w-sm w-[90%]">
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-2">
              Finalize registration?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              You're submitting{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {selectedCourses.length} courses
              </span>{" "}
              ({totalCredits} credits total). This cannot be undone.
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
