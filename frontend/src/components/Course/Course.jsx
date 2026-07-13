import React, { useState, useEffect } from "react";
import CourseHeader from "./CourseHeader";
import CourseList from "./CourseList";
import AddCourseModal from "./AddCourse/AddCourseModal";
import useAdminStore from "../../store/useAdminStore";
import EditCourseModal from "./EditCourseModal";
import { toast } from "react-toastify";
import CustomLoader from "../../ui/CustomLoader";

const Course = () => {
  const [pendingCourses, setPendingCourses] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const {
    courses: storeCourses = [],
    fetchCourses,
    bulkCreateCourses,
    deleteCourse,
    updateCourse,
    isLoading,
  } = useAdminStore();

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const displayCourses = [...storeCourses, ...pendingCourses];

  const handleSaveToPending = async (newCourses) => {
    if (!newCourses || newCourses.length === 0) {
      toast.error("No courses to save");
      return;
    }

    try {
      const result = await bulkCreateCourses(newCourses);

      if (result && result.success === true) {
        await fetchCourses();
        return result;
      } else {
        toast.error(result?.message || "Failed to save courses");
        return result;
      }
    } catch (error) {
      console.error("Error in handleSaveToPending:", error);
      toast.error(error.message || "Failed to save courses");
      return { success: false, message: error.message };
    }
  };

  const handleEditClick = (course) => {
    setEditingCourse(course);
  };

  const handleSaveEdit = async (updatedData) => {
    const result = await updateCourse(updatedData._id, updatedData);
    if (result?.success) {
      toast.success(`${updatedData.course_code} updated successfully!`);
      await fetchCourses();
    } else {
      toast.error(result?.message || "Failed to update course");
    }
    setEditingCourse(null);
  };

  const handleDeleteClick = async (courseId) => {
    if (!courseId) {
      toast.error("Invalid course ID");
      return;
    }

    const isPending = pendingCourses.some((c) => c._id === courseId);

    if (isPending) {
      setPendingCourses(pendingCourses.filter((c) => c._id !== courseId));
      toast.info("Removed unsaved course.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this course?")) {
      const result = await deleteCourse(courseId);
      if (result) {
        toast.success("Course deleted successfully!");
        await fetchCourses();
      } else {
        toast.error("Failed to delete course");
      }
    }
  };

  return (
    <div className="min-h-full w-full mx-auto space-y-6">
      <CourseHeader onAddClick={() => setIsAddModalOpen(true)} />

      <div className="rounded-lg">
        {pendingCourses.length > 0 && (
          <div className="mb-8 p-4 bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-cyan-800 dark:text-cyan-300 font-bold flex items-center gap-2">
                ⚠️ Unsaved Changes
              </h3>
              <p className="text-sm text-cyan-600 dark:text-cyan-500 mt-1">
                You have {pendingCourses.length} new course(s) waiting to be
                saved to the database.
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <CustomLoader variant="blue" />
          </div>
        ) : (
          <CourseList
            courses={displayCourses}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        )}
      </div>

      {isAddModalOpen && (
        <AddCourseModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveToPending}
        />
      )}

      {editingCourse && (
        <EditCourseModal
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default Course;
