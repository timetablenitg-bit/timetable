// components/AddFacultyModal.jsx
import React, { useState } from "react";
import { X, UserPlus, Eye } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MethodSelector from "./MethodSelector ";
import ManualEntry from "./ManualEntry";
import CSVEntry from "./CSVEntry";
import FileUpload from "./FileUpload";
import ReviewSection from "./ReviewSection";

const AddFacultyModal = ({ isOpen, onClose, onAddFaculty }) => {
  const [activeMethod, setActiveMethod] = useState("manual");
  const [formData, setFormData] = useState({
    facultyId: "",
    name: "",
    department: "",
  });
  const [csvData, setCsvData] = useState("");
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
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
        if (parts.length >= 3) {
          parsed.push({
            facultyId: parts[0],
            name: parts[1],
            department: parts[2],
            id: Date.now() + Math.random() + i,
          });
        } else {
          errors.push(`Line ${i + 1}: Invalid format`);
        }
      }
    }

    if (errors.length > 0) {
      toast.warning(
        `Skipped ${errors.length} invalid entries:\n${errors.join("\n")}`,
      );
    }

    return parsed;
  };

  // Parse CSV file
  const parseFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n");
      const parsed = [];
      const errors = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const parts = line.split(",").map((part) => part.trim());
          if (parts.length >= 3) {
            parsed.push({
              facultyId: parts[0],
              name: parts[1],
              department: parts[2],
              id: Date.now() + Math.random() + i,
            });
          } else {
            errors.push(`Line ${i + 1}: Invalid format`);
          }
        }
      }

      if (errors.length > 0) {
        toast.warning(
          `Skipped ${errors.length} invalid entries:\n${errors.join("\n")}`,
        );
      }

      setPreviewData(parsed);
      if (parsed.length > 0) {
        toast.success(`Successfully parsed ${parsed.length} faculty records`);
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

  const addToReviewList = (faculties) => {
    if (faculties.length === 0) {
      toast.error("No valid faculty data to add");
      return;
    }

    const newFaculties = faculties.map((f) => ({
      ...f,
      id: Date.now() + Math.random(),
    }));
    setFacultyList([...facultyList, ...newFaculties]);
    toast.success(`${faculties.length} faculty(s) added to review list`);

    // Reset form with animation
    setAnimation("animate-out fade-out");
    setTimeout(() => {
      setFormData({ facultyId: "", name: "", department: "" });
      setCsvData("");
      setFile(null);
      setPreviewData([]);
      setAnimation("animate-in fade-in");
      setTimeout(() => setAnimation(""), 300);
    }, 150);
  };

  const handleManualAdd = () => {
    if (!formData.facultyId || !formData.name || !formData.department) {
      toast.error("Please fill all fields");
      return;
    }
    addToReviewList([formData]);
  };

  const handleCsvAdd = () => {
    if (!csvData.trim()) {
      toast.error("Please enter faculty data");
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

  const handleUpdateFaculty = (index, updatedFaculty) => {
    const updatedList = [...facultyList];
    updatedList[index] = updatedFaculty;
    setFacultyList(updatedList);
    toast.success("Faculty updated successfully");
  };

  const handleDeleteFaculty = (index) => {
    const updatedList = facultyList.filter((_, i) => i !== index);
    setFacultyList(updatedList);
    toast.success("Faculty deleted successfully");
  };

  const handleFinalSubmit = async () => {
    if (facultyList.length === 0) {
      toast.error("No faculty to submit");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddFaculty(facultyList);
      toast.success(
        `${facultyList.length} faculty records submitted successfully!`,
      );
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1500);
    } catch (error) {
      toast.error("Error submitting faculty");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ facultyId: "", name: "", department: "" });
    setCsvData("");
    setFile(null);
    setPreviewData([]);
    setFacultyList([]);
    setActiveMethod("manual");
    setShowReview(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center z-20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  {showReview
                    ? "Review & Submit Faculty"
                    : "Add Faculty Member"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {showReview
                    ? `Review ${facultyList.length} faculty member(s) before final submission`
                    : "Add faculty data manually, via CSV text, or file upload"}
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
                <MethodSelector
                  activeMethod={activeMethod}
                  setActiveMethod={handleMethodChange}
                  facultyCount={facultyList.length}
                  onReview={() => setShowReview(true)}
                />

                {/* Animated fixed height container for all forms */}
                <div
                  className={`min-h-[400px] transition-all duration-300 ${animation}`}
                >
                  {activeMethod === "manual" && (
                    <ManualEntry
                      formData={formData}
                      setFormData={setFormData}
                      onAdd={handleManualAdd}
                      onReview={() => setShowReview(true)}
                      facultyCount={facultyList.length}
                    />
                  )}

                  {activeMethod === "csv" && (
                    <CSVEntry
                      csvData={csvData}
                      setCsvData={setCsvData}
                      onAdd={handleCsvAdd}
                      onReview={() => setShowReview(true)}
                      facultyCount={facultyList.length}
                    />
                  )}

                  {activeMethod === "file" && (
                    <FileUpload
                      file={file}
                      previewData={previewData}
                      onFileUpload={handleFileUpload}
                      onAdd={handleFileAdd}
                      onReview={() => setShowReview(true)}
                      facultyCount={facultyList.length}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="animate-in slide-in-from-right duration-300">
                <ReviewSection
                  facultyList={facultyList}
                  onUpdate={handleUpdateFaculty}
                  onDelete={handleDeleteFaculty}
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

export default AddFacultyModal;