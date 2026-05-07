// import React, { useState, useEffect } from "react";
// import CourseHeader from "./CourseHeader";
// import CourseList from "./CourseList";
// import AddCourseModal from "./AddCourseModal";
// import useAdminStore from "../../store/useAdminStore";
// import EditCourseModal from "./EditCourseModal";
// import { toast } from "react-toastify";
// import CustomLoader from "../../ui/CustomLoader";

// const Course = () => {
//   const [selectedBranch, setSelectedBranch] = useState("");
//   const [pendingCourses, setPendingCourses] = useState([]);

//   // Modal States
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [editingCourse, setEditingCourse] = useState(null);

//   // Pull functions from Zustand
//   const {
//     courses: storeCourses = [],
//     fetchCourses,
//     bulkCreateCourses, // <-- We need to use this one!
//     deleteCourse,
//     updateCourse,
//     isLoading,
//     isSaving,
//   } = useAdminStore();

//   useEffect(() => {
//     if (selectedBranch && fetchCourses) {
//       fetchCourses(selectedBranch);
//     }
//   }, [selectedBranch, fetchCourses]);

//   const currentBranchPending = pendingCourses.filter(
//     (c) => c.branch === selectedBranch,
//   );

//   const displayCourses = [...storeCourses, ...currentBranchPending];

//   const handleSaveToPending = (newCourses) => {
//     setPendingCourses([...pendingCourses, ...newCourses]);
//   };

//   const handleFinalSubmit = async () => {
//     const cleanedCourses = currentBranchPending.map(
//       ({ branch, id, ...course }) => course,
//     );

//     const response = await bulkCreateCourses(cleanedCourses);

//     if (response?.success) {
//       const inserted = response.summary?.inserted || 0;
//       const skipped = response.summary?.skipped || 0;

//       if (skipped > 0) {
//         toast.warning(
//           `${inserted} course(s) saved, ${skipped} skipped due to errors.`,
//           { position: "bottom-right", theme: "colored" },
//         );
//       } else {
//         toast.success(`${inserted} course(s) saved to database successfully!`, {
//           position: "bottom-right",
//           theme: "colored",
//         });
//       }

//       setPendingCourses((prev) =>
//         prev.filter((c) => c.branch !== selectedBranch),
//       );
//     } else {
//       toast.error(
//         response?.message ||
//           "Failed to save courses to the database. Please try again.",
//         {
//           position: "bottom-right",
//           theme: "colored",
//         },
//       );
//     }
//   };

//   // --- Handle Edit ---
//   const handleEditClick = (course) => {
//     setEditingCourse(course);
//   };

//   const handleSaveEdit = async (updatedData) => {
//     console.log("Updated Data from Edit Modal:", updatedData);
//     if (updateCourse) {
//       const { _id, id, branch, ...payload } = updatedData;

//       console.log(payload);

//       const response = await updateCourse(_id, payload);

//       if (response?.success) {
//         toast.success(`${payload.course_code} updated successfully!`);
//       } else {
//         toast.error(response?.message || "Failed to update course");
//       }
//     }

//     setEditingCourse(null);
//   };

//   // --- Handle Delete ---
//   const handleDeleteClick = async (id) => {
//     const isPending = pendingCourses.some((c) => c.id === id);

//     if (isPending) {
//       // If it's just in the preview/pending list, remove it locally
//       setPendingCourses(pendingCourses.filter((c) => c.id !== id));
//       toast.info("Removed unsaved course.");
//       return;
//     }

//     if (
//       window.confirm(
//         "Are you sure you want to delete this course? This action cannot be undone.",
//       )
//     ) {
//       if (deleteCourse) {
//         await deleteCourse(id);
//         toast.success("Course deleted successfully!");
//       }
//     }
//   };

//   return (
//     <div className="min-h-full w-full mx-auto space-y-6">
//       <CourseHeader
//         selectedBranch={selectedBranch}
//         setSelectedBranch={setSelectedBranch}
//         onAddClick={() => setIsAddModalOpen(true)}
//       />

//       <div className="rounded-lg">
//         {pendingCourses.length > 0 && selectedBranch && (
//           <div className="mb-8 p-1 bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
//             <div>
//               <h3 className="text-cyan-800 dark:text-cyan-300 font-bold flex items-center gap-2">
//                 ⚠️ Unsaved Changes
//               </h3>
//               <p className="text-sm text-cyan-600 dark:text-cyan-500 mt-1">
//                 You have {currentBranchPending.length} new courses waiting to be
//                 saved to the database.
//               </p>
//             </div>
//             <button
//               onClick={handleFinalSubmit}
//               disabled={isSaving}
//               className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
//                 isSaving
//                   ? "bg-cyan-400 cursor-not-allowed text-white"
//                   : "bg-cyan-600 hover:bg-cyan-700 text-white active:scale-95 shadow-md shadow-cyan-500/20"
//               }`}
//             >
//               {isSaving ? "Saving..." : "Save to Database"}
//             </button>
//           </div>
//         )}

//         {isLoading ? (
//           <div className="flex justify-center items-center py-20">
//             <CustomLoader variant="blue" />
//           </div>
//         ) : (
//           <CourseList
//             selectedBranch={selectedBranch}
//             courses={displayCourses}
//             onEdit={handleEditClick}
//             onDelete={handleDeleteClick}
//           />
//         )}
//       </div>

//       {/* Modals */}
//       {isAddModalOpen && (
//         <AddCourseModal
//           selectedBranch={selectedBranch}
//           onClose={() => setIsAddModalOpen(false)}
//           onSave={handleSaveToPending}
//         />
//       )}

//       {editingCourse && (
//         <EditCourseModal
//           course={editingCourse}
//           onClose={() => setEditingCourse(null)}
//           onSave={handleSaveEdit}
//         />
//       )}
//     </div>
//   );
// };

// export default Course;
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

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  // Pull functions from Zustand
  const {
    courses: storeCourses = [],
    fetchCourses,
    saveCoursesToBackend,
    deleteCourse,
    updateCourse,
    isLoading,
    isSaving,
  } = useAdminStore();

  // Fetch all courses on component mount (only once)
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Combine store courses with pending courses
  const displayCourses = [...storeCourses, ...pendingCourses];

  const handleSaveToPending = async (newCourses) => {
    console.log("handleSaveToPending called with:", newCourses);

    if (!newCourses || newCourses.length === 0) {
      toast.error("No courses to save");
      return;
    }

    try {
      const result = await saveCoursesToBackend(newCourses);
      console.log("Result from saveCoursesToBackend:", result);

      if (result && result.success === true) {
        // toast.success(`${newCourses.length} course(s) added successfully!`);
        await fetchCourses(); // Refresh the list
        return result;
      } else {
        const errorMsg = result?.error || "Failed to save courses";
        toast.error(errorMsg);
        return result;
      }
    } catch (error) {
      console.error("Error in handleSaveToPending:", error);
      toast.error(error.message || "Failed to save courses");
      return { success: false, error: error.message };
    }
  };

  const handleFinalSubmit = async () => {
    if (pendingCourses.length === 0) {
      toast.warning("No pending courses to save!", {
        position: "bottom-right",
        theme: "colored",
      });
      return;
    }

    const success = await saveCoursesToBackend(pendingCourses);

    if (success) {
      toast.success(
        `${pendingCourses.length} course(s) saved to database successfully!`,
        { position: "bottom-right", theme: "colored" },
      );
      setPendingCourses([]); // Clear all pending courses
      await fetchCourses(); // Refresh courses from backend
    } else {
      toast.error("Failed to save courses to the database. Please try again.", {
        position: "bottom-right",
        theme: "colored",
      });
    }
  };

  // Handle Edit
  const handleEditClick = (course) => {
    setEditingCourse(course);
  };

  const handleSaveEdit = async (updatedData) => {
    if (updateCourse) {
      await updateCourse(updatedData);
      toast.success(`${updatedData.courseCode} updated successfully!`);
      await fetchCourses(); // Refresh courses after edit
    }
    setEditingCourse(null);
  };

  // Handle Delete
  // Handle Delete
  const handleDeleteClick = async (courseId) => {
    console.log("Deleting course with ID:", courseId); // Should show: "69eb17b2f30028faef84d58b"

    if (!courseId) {
      toast.error("Invalid course ID");
      return;
    }

    // Check pending courses
    const isPending = pendingCourses.some((c) => {
      const pendingId = c._id || c.id;
      return pendingId === courseId;
    });

    if (isPending) {
      setPendingCourses(
        pendingCourses.filter((c) => {
          const pendingId = c._id || c.id;
          return pendingId !== courseId;
        }),
      );
      toast.info("Removed unsaved course.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this course?")) {
      const result = await deleteCourse(courseId);
      if (result?.success) {
        toast.success("Course deleted successfully!");
        await fetchCourses();
      } else {
        toast.error(result?.error || "Failed to delete course");
      }
    }
  };

  return (
    <div className="min-h-full w-full mx-auto space-y-6">
      <CourseHeader onAddClick={() => setIsAddModalOpen(true)} />

      <div className="rounded-lg">
        {/* Unsaved Changes Banner */}
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
            <button
              onClick={handleFinalSubmit}
              disabled={isSaving}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
                isSaving
                  ? "bg-cyan-400 cursor-not-allowed text-white"
                  : "bg-cyan-600 hover:bg-cyan-700 text-white active:scale-95 shadow-md shadow-cyan-500/20"
              }`}
            >
              {isSaving ? "Saving..." : "Save to Database"}
            </button>
          </div>
        )}

        {/* Loading State */}
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

      {/* Modals */}
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
