import React, { useState } from "react";
import {
  Send,
  BookCheck,
  Search,
  AlertCircle,
  Sparkles,
  FileDown,
  CheckCircle,
  ListPlus,
} from "lucide-react";
import { toast } from "react-toastify";
import { useStudentStore } from "../../../store/useStudentStore";

import CourseSearchList from "./CourseSearchList";
import ManualCourseForm from "./ManualCourseForm";
import RegistrationSummary from "./RegistrationSummary";
import { generateRegistrationPDF } from "./RegistrationReceipt";

const CourseRegistrationForm = ({ currentSemAvailableCourses = [] }) => {
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastSubmittedSnapshot, setLastSubmittedSnapshot] = useState([]);

  const { submitRegistration, isCourseLoading } = useStudentStore();

  const addCourse = (course) => {
    if (selectedCourses.find((c) => c.code === course.code)) {
      toast.warning(`${course.code} is already added.`);
      return;
    }
    setSelectedCourses((prev) => [...prev, course]);
    toast.success(`Added ${course.name}`);
  };

  const removeCourse = (code) => {
    setSelectedCourses((prev) => prev.filter((c) => c.code !== code));
  };

  const handleFinalSubmit = async () => {
    if (selectedCourses.length === 0) {
      toast.error("Add at least one subject.");
      return;
    }
    const success = await submitRegistration(selectedCourses);
    if (success) {
      setLastSubmittedSnapshot([...selectedCourses]);
      setIsSubmitted(true);
      setSelectedCourses([]);
      toast.success("Form Submitted Successfully!");
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto  p-1 space-y-6 lg:space-y-10 animate-in fade-in duration-500">
      {!isSubmitted ? (
        <>
          {/* TOP SECTION: THE ADDING TOOLS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* 1. CourseSearchList (Left - Stacked on mobile, 5 cols on desktop) */}
            <div className="order-2 lg:order-1 lg:col-span-5 w-full">
              <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-[500px] lg:h-[680px]">
                <div className="p-4 lg:p-6 border-b border-slate-100 dark:border-slate-800 space-y-4 bg-slate-50/50 dark:bg-slate-800/30">
                  <h2 className="text-lg lg:text-xl font-bold flex items-center gap-2 dark:text-white">
                    <BookCheck size={20} className="text-emerald-500" />
                    Available Curriculum
                  </h2>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder="Quick find subject..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl lg:rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all dark:text-gray-300"
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CourseSearchList
                    courses={currentSemAvailableCourses}
                    searchTerm={searchTerm}
                    onAdd={addCourse}
                    selectedCodes={selectedCourses.map((c) => c.code)}
                  />
                </div>
              </div>
            </div>

            {/* 2. ManualAddForm (Right - Stacked on mobile, 7 cols on desktop) */}
            <div className="order-1 lg:order-2 lg:col-span-7 space-y-6 w-full">
              <div className="bg-white dark:bg-slate-900 rounded-md p-5 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
                <div className="flex items-center gap-3 mb-6 lg:mb-8">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                    <Sparkles
                      className="text-indigo-600 dark:text-indigo-400"
                      size={20}
                    />
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-bold dark:text-white">
                      Manual Add
                    </h2>
                    <p className="text-xs lg:text-sm text-slate-500">
                      Custom electives or special credits
                    </p>
                  </div>
                </div>
                <ManualCourseForm onAdd={addCourse} />
              </div>

              {/* Responsive Info Alert */}
              <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-xl lg:rounded-2xl">
                <AlertCircle
                  className="text-indigo-500 shrink-0 mt-0.5"
                  size={18}
                />
                <p className="text-xs lg:text-sm text-indigo-900 dark:text-indigo-300">
                  <span className="font-bold">Pro Tip:</span> If a course isn't
                  in the list on the{" "}
                  {window.innerWidth < 1024 ? "bottom" : "left"}, add it
                  manually here.
                </p>
              </div>
            </div>
          </div>

          {/* 3. RegistrationSummary (Bottom - Full Width) */}
          <div
            className={`pt-6 lg:pt-10 border-t border-slate-200 dark:border-slate-800 transition-all duration-700 ${
              selectedCourses.length === 0
                ? "opacity-30 grayscale pointer-events-none"
                : "opacity-100"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 lg:mb-8 gap-4">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-900 dark:bg-white rounded-xl lg:rounded-2xl flex items-center justify-center text-white dark:text-slate-900">
                  <ListPlus size={20} lg:size={24} />
                </div>
                <div>
                  <h2 className="text-xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Final Selection
                  </h2>
                  <p className="text-xs lg:text-sm text-slate-500 font-medium">
                    Review credits before submission
                  </p>
                </div>
              </div>

              {selectedCourses.length > 0 && (
                <button
                  onClick={handleFinalSubmit}
                  disabled={isCourseLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 lg:px-12 py-3.5 lg:py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-xl lg:rounded-2xl font-bold shadow-xl shadow-indigo-500/30 transition-all active:scale-95 group"
                >
                  <Send
                    size={18}
                    className={
                      isCourseLoading
                        ? "animate-spin"
                        : "group-hover:translate-x-1 transition-transform"
                    }
                  />
                  <span className="text-sm lg:text-base">
                    {isCourseLoading
                      ? "Processing..."
                      : "Finalize Registration"}
                  </span>
                </button>
              )}
            </div>

            {/* Overflow wrapper for the table summary */}
            <div className="overflow-x-auto pb-4">
              <RegistrationSummary
                selectedCourses={selectedCourses}
                onRemove={removeCourse}
              />
            </div>
          </div>
        </>
      ) : (
        /* SUCCESS PHASE (Responsive optimized) */
        <div className="max-w-2xl mx-auto py-10 lg:py-16 px-4 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl lg:rounded-[40px] shadow-2xl space-y-6 lg:space-y-8 animate-in zoom-in-95">
          <div className="w-16 h-16 lg:w-24 lg:h-24 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle
              size={32}
              lg:size={48}
              className="text-emerald-600 dark:text-emerald-400"
            />
          </div>
          <h2 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-white">
            Success!
          </h2>
          <div className="p-4 lg:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-[10px] lg:text-sm font-bold text-slate-400 uppercase tracking-widest">
                Official Receipt
              </p>
              <p className="text-sm lg:text-base text-slate-600 dark:text-slate-300">
                Ready for download
              </p>
            </div>
            <button
              onClick={() => generateRegistrationPDF(lastSubmittedSnapshot)}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 lg:px-8 py-3 bg-indigo-600 text-white rounded-xl lg:rounded-2xl font-bold hover:bg-indigo-700 shadow-lg transition-all"
            >
              <FileDown size={18} />
              <span>Get PDF</span>
            </button>
          </div>
          <button
            onClick={() => setIsSubmitted(false)}
            className="text-indigo-600 text-sm font-bold hover:underline"
          >
            Start New Registration
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseRegistrationForm;
