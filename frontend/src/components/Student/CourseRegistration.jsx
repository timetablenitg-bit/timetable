import React, { useState, useEffect } from "react";
import Header from "../CourseRegistrationFolder/Header";
import StudentInfoCard from "../CourseRegistrationFolder/StudentInfoCard";
import CurrentSemesterCard from "../CourseRegistrationFolder/CurrentSemesterCard";
import CompletedSemestersList from "../CourseRegistrationFolder/CompletedSemestersList";
import CourseRegistrationForm from "../CourseRegistrationFolder/CourseRegistrationForm";
import { useStudentStore } from "../../store/useStudentStore";

const CourseRegistration = () => {
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const {
    isLoading,
    academicSessions,
    myBatch,
    fetchMyBatch,
    currentRegistration,
    fetchAcademicSessions,
    startCourseRegistration,
    getMyCourseRegistration,
    fetchCoursesOfCurrentSemester,
    currentSemAvailableCourses,
    allCourseCatalogue,
    fetchAllCourseCatalogue,
  } = useStudentStore();

  const handleRegisterClick = async (session) => {
    console.log("Register clicked for session:", session);
    let registration = await getMyCourseRegistration(session._id);

    if (!registration) {
      registration = await startCourseRegistration({
        sessionId: session._id,
        batchId: myBatch._id, // ← now you have it
      });
    }

    if (!registration) return;

    await fetchCoursesOfCurrentSemester();
    await fetchAllCourseCatalogue();

    setSelectedBatch({ session, batch: myBatch }); // pass both cleanly
    setShowRegistrationForm(true);
  };

  const handleBackToList = () => {
    setShowRegistrationForm(false);
  };

  useEffect(() => {
    fetchAcademicSessions();
    fetchMyBatch();
    // console.log(academicSessions);
  }, [fetchAcademicSessions, fetchMyBatch]);

  const activeSession = academicSessions?.find((s) => s.isActive);
  const inactiveSessions = academicSessions?.filter((s) => !s.isActive);

  const normalize = (course) => ({
    ...course,
    code: course.course_code,
    name: course.course_name,
    type: course.course_type === "THEORY" ? "Theory" : "Lab",
    L: course.hours?.lecture ?? 0,
    T: course.hours?.tutorial ?? 0,
    P: course.hours?.practical ?? 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">
            Loading your data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <Header />

      <main className="flex-1">
        {!showRegistrationForm ? (
          <div className="space-y-6">
            {/* Student Information Card */}
            <StudentInfoCard session={activeSession} />

            {/* Current Active Semester - Displayed First */}
            {activeSession && (
              <CurrentSemesterCard
                semester={activeSession}
                onRegister={handleRegisterClick}
              />
            )}

            {/* Completed Semesters Section - Displayed Below Current Semester */}
            {inactiveSessions && (
              <CompletedSemestersList semesters={inactiveSessions} />
            )}
          </div>
        ) : (
          <CourseRegistrationForm
            regularCourses={currentSemAvailableCourses.map(normalize)} // was currentSemAvailableCourses
            allCourses={allCourseCatalogue.map(normalize)} // new — fetch full catalogue if student has backlogs
            batchDetails={{ ...selectedBatch, sessionId: activeSession._id }}
            existingRegistration={currentRegistration} // from store
            onBack={handleBackToList}
          />
        )}
      </main>
    </div>
  );
};

export default CourseRegistration;
