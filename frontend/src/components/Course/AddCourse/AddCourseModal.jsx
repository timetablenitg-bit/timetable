// components/AddCourseModal.jsx
import React, { useState, useEffect } from "react";
import { X, BookOpen, Eye } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CourseMethodSelector from "./CourseMethodSelector";
import CourseManualEntry from "./CourseManualEntry";
import CourseCSVEntry from "./CourseCSVEntry";
import CourseFileUpload from "./CourseFileUpload";
import CourseReviewSection from "./CourseReviewSection";


const AddCourseModal = ({ selectedBranch, onClose, onSave }) => {
  const [activeMethod, setActiveMethod] = useState("manual");
  const [formData, setFormData] = useState({
    courseCode: "",
    courseName: "",
    semester: "1",
    credits: "",
    type: "Theory",
    department: selectedBranch || "",
    nature: "CORE",
    l: "0",
    t: "0",
    p: "0",
  });
  const [csvData, setCsvData] = useState("");
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [animation, setAnimation] = useState("");

  // Handle method change with animation
  const handleMethodChange = (method) => {
    setAnimation("animate-out fade-out");
    setTimeout(() => {
      setActiveMethod(method);
      setAnimation("animate-in fade-in");
      setTimeout(() => setAnimation(""), 300);
    }, 150);
  };

  // Parse comma-separated data with error handling
  const parseCommaSeparated = (text) => {
    const lines = text.trim().split("\n");
    const parsed = [];
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const parts = line.split(",").map((part) => part.trim());
        if (parts.length >= 10) {
          parsed.push({
            id: Date.now() + Math.random() + i,
            branch: selectedBranch,
            courseCode: parts[0],
            courseName: parts[1],
            semester: parts[2] || "1",
            credits: parts[3] || "0",
            type: parts[4] || "Theory",
            department: parts[5] || selectedBranch,
            nature: parts[6] || "CORE",
            l: parts[7] || "0",
            t: parts[8] || "0",
            p: parts[9] || "0",
          });
        } else {
          errors.push(
            `Line ${i + 1}: Expected 10 columns, got ${parts.length}`,
          );
        }
      }
    }

    if (errors.length > 0) {
      toast.warning(
        `Skipped ${errors.length} invalid entries:\n${errors.slice(0, 3).join("\n")}${errors.length > 3 ? `\n... and ${errors.length - 3} more` : ""}`,
      );
    }

    return parsed;
  };

  // Parse CSV file
  const parseFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = parseCommaSeparated(text);
      setPreviewData(parsed);
      if (parsed.length > 0) {
        toast.success(`Successfully parsed ${parsed.length} course records`);
      } else {
        toast.error("No valid data found in file");
      }
    };

    reader.onerror = () => {
      toast.error("Error reading file");
    };

    reader.readAsText(file);
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      parseFile(uploadedFile);
    }
  };

  const addToReviewList = (courses) => {
    if (courses.length === 0) {
      toast.error("No valid course data to add");
      return;
    }

    const newCourses = courses.map((c) => ({
      ...c,
      id: Date.now() + Math.random(),
    }));
    setCourseList([...courseList, ...newCourses]);
    toast.success(`${courses.length} course(s) added to review list`);

    // Reset form with animation
    setAnimation("animate-out fade-out");
    setTimeout(() => {
      setFormData({
        courseCode: "",
        courseName: "",
        semester: "1",
        credits: "",
        type: "Theory",
        department: selectedBranch || "",
        nature: "CORE",
        l: "0",
        t: "0",
        p: "0",
      });
      setCsvData("");
      setFile(null);
      setPreviewData([]);
      setAnimation("animate-in fade-in");
      setTimeout(() => setAnimation(""), 300);
    }, 150);
  };

  const handleManualAdd = () => {
    if (!formData.courseCode || !formData.courseName || !formData.credits) {
      toast.error("Course Code, Name, and Credits are required!");
      return;
    }
    addToReviewList([formData]);
  };

  const handleCsvAdd = () => {
    if (!csvData.trim()) {
      toast.error("Please enter course data");
      return;
    }

    const parsed = parseCommaSeparated(csvData);
    if (parsed.length === 0) {
      toast.error("No valid data found. Please check format.");
      return;
    }

    addToReviewList(parsed);
  };

  const handleFileAdd = () => {
    if (previewData.length === 0) {
      toast.error("No data found in file");
      return;
    }
    addToReviewList(previewData);
  };

  const handleUpdateCourse = (index, updatedCourse) => {
    const updatedList = [...courseList];
    updatedList[index] = updatedCourse;
    setCourseList(updatedList);
    toast.success("Course updated successfully");
  };

  const handleDeleteCourse = (index) => {
    const updatedList = courseList.filter((_, i) => i !== index);
    setCourseList(updatedList);
    toast.success("Course deleted successfully");
  };

  const handleFinalSubmit = async () => {
    if (courseList.length === 0) {
      toast.error("No courses to submit");
      return;
    }

    setIsSubmitting(true);
    try {
      const transformedCourses = courseList.map((course) => ({
        courseCode: course.courseCode,
        courseName: course.courseName,
        semester: course.semester,
        credits: course.credits,
        type: course.type,
        department: course.department || selectedBranch,
        nature: course.nature,
        l: course.l || "0",
        t: course.t || "0",
        p: course.p || "0",
      }));

      console.log("Calling onSave with:", transformedCourses);

      const result = await onSave(transformedCourses);

      console.log("onSave result:", result);

      // Check if the save was successful
      if (result && result.success === true) {
        const message = result.summary
          ? `Successfully submitted ${result.summary.inserted} out of ${result.summary.total_received} courses`
          : `${courseList.length} course(s) submitted successfully!`;

        toast.success(message);

        setTimeout(() => {
          resetForm();
          onClose();
        }, 1500);
      } else {
        // Handle error case
        const errorMessage = result?.error || "Failed to submit courses";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error in handleFinalSubmit:", error);
      toast.error(error.message || "Error submitting courses");
    } finally {
      setIsSubmitting(false);
    }
  };
  const resetForm = () => {
    setFormData({
      courseCode: "",
      courseName: "",
      semester: "1",
      credits: "",
      type: "Theory",
      department: selectedBranch || "",
      nature: "CORE",
      l: "0",
      t: "0",
      p: "0",
    });
    setCsvData("");
    setFile(null);
    setPreviewData([]);
    setCourseList([]);
    setActiveMethod("manual");
    setShowReview(false);
  };

  if (!onClose) return null;

  return (
    <>
      <div
        className="h-screen fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center z-20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  {showReview ? "Review & Submit Courses" : "Add New Courses"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {showReview
                    ? `Review ${courseList.length} course(s) before final submission`
                    : `Target Branch: ${selectedBranch}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Body with fixed height container */}
          <div className="p-6">
            {!showReview ? (
              <>
                <CourseMethodSelector
                  activeMethod={activeMethod}
                  setActiveMethod={handleMethodChange}
                  courseCount={courseList.length}
                  onReview={() => setShowReview(true)}
                />

                {/* Animated fixed height container for all forms */}
                <div
                  className={`h-[420px] transition-all duration-300 ${animation}`}
                >
                  {activeMethod === "manual" && (
                    <CourseManualEntry
                      formData={formData}
                      setFormData={setFormData}
                      onAdd={handleManualAdd}
                      onReview={() => setShowReview(true)}
                      courseCount={courseList.length}
                      selectedBranch={selectedBranch}
                    />
                  )}

                  {activeMethod === "csv" && (
                    <CourseCSVEntry
                      csvData={csvData}
                      setCsvData={setCsvData}
                      onAdd={handleCsvAdd}
                      onReview={() => setShowReview(true)}
                      courseCount={courseList.length}
                    />
                  )}

                  {activeMethod === "file" && (
                    <CourseFileUpload
                      file={file}
                      previewData={previewData}
                      onFileUpload={handleFileUpload}
                      onAdd={handleFileAdd}
                      onReview={() => setShowReview(true)}
                      courseCount={courseList.length}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="animate-in slide-in-from-right duration-300">
                <CourseReviewSection
                  courseList={courseList}
                  onUpdate={handleUpdateCourse}
                  onDelete={handleDeleteCourse}
                  onAddMore={() => {
                    setShowReview(false);
                    setAnimation("animate-in fade-in");
                  }}
                  onSubmit={handleFinalSubmit}
                  isSubmitting={isSubmitting}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AddCourseModal;
