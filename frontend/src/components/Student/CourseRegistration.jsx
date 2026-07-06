import React, { useState, useEffect } from "react";
import Header from "../CourseRegistrationFolder/Header";
import StudentInfoCard from "../CourseRegistrationFolder/StudentInfoCard";
import CurrentSemesterCard from "../CourseRegistrationFolder/CurrentSemesterCard";
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
    getMyCourseRegistration,
    allCourseCatalogue,
    fetchAllCourseCatalogue,
  } = useStudentStore();

  const handleRegisterClick = async (session) => {
    await getMyCourseRegistration(session._id);
    await fetchAllCourseCatalogue();

    setSelectedBatch({ session, batch: myBatch });
    setShowRegistrationForm(true);
  };

  const handleBackToList = () => {
    setShowRegistrationForm(false);
  };

  useEffect(() => {
    fetchAcademicSessions();
    fetchMyBatch();
  }, [fetchAcademicSessions, fetchMyBatch]);

  const activeSession = academicSessions?.find((s) => s.isActive);

  useEffect(() => {
    if (activeSession?._id) {
      getMyCourseRegistration(activeSession._id);
    }
  }, [activeSession?._id, getMyCourseRegistration]);

  const normalize = (course) => ({
    ...course,
    code: course.course_code,
    name: course.course_name,
    type: course.course_type === "THEORY" ? "Theory" : "Lab",
    L: course.lecture ?? 0,
    T: course.tutorial ?? 0,
    P: course.practical ?? 0,
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

      <main className="flex-1 flex flex-col">
        {!showRegistrationForm ? (
          <div className="flex-1 flex flex-col gap-4">
            <StudentInfoCard session={activeSession} />
            <CurrentSemesterCard
              semester={activeSession}
              onRegister={handleRegisterClick}
              isRegistered={currentRegistration?.status === "COMPLETED"}
            />
          </div>
        ) : (
          <CourseRegistrationForm
            allCourses={allCourseCatalogue.map(normalize)}
            batchDetails={{ ...selectedBatch, sessionId: activeSession._id }}
            existingRegistration={currentRegistration}
            onBack={handleBackToList}
          />
        )}
      </main>
    </div>
  );
};

export default CourseRegistration;
