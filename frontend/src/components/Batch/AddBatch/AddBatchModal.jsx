// components/AddBatch/AddBatchModal.jsx
import React, { useState, useEffect } from "react";
import { X, Users, Eye } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BatchMethodSelector from "./BatchMethodSelector";
import BatchManualEntry from "./BatchManualEntry";
import BatchCSVEntry from "./BatchCSVEntry";
import BatchFileUpload from "./BatchFileUpload";
import BatchReviewSection from "./BatchReviewSection";

const AddBatchModal = ({ onClose, onSave }) => {
  const [activeMethod, setActiveMethod] = useState("manual");
  const [formData, setFormData] = useState({
    program: "BTECH",
    department: "",
    year: "",
    semester: "",
    batch_name: "",
  });
  const [csvData, setCsvData] = useState("");
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [batchList, setBatchList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [animation, setAnimation] = useState("");

  const programOptions = ["BTECH", "MTECH", "PHD"];
  const departmentOptions = [
    "CSE",
    "ECE",
    "MCE",
    "CVE",
    "EEE",
    "APS",
    "HSS",
    "common",
  ];
  const yearOptions = [1, 2, 3, 4, 5];
  const semesterOptions = [1, 2, 3, 4, 5, 6, 7, 8];

  const handleMethodChange = (method) => {
    setAnimation("animate-out fade-out");
    setTimeout(() => {
      setActiveMethod(method);
      setAnimation("animate-in fade-in");
      setTimeout(() => setAnimation(""), 300);
    }, 150);
  };

  // Parse comma-separated data (without lecture_room_id)
  const parseCommaSeparated = (text) => {
    const lines = text.trim().split("\n");
    const parsed = [];
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const parts = line.split(",").map((part) => part.trim());
        // Expected 5 columns: Program, Department, Year, Semester, Batch Name
        if (parts.length >= 5) {
          const batchData = {
            program: parts[0].toUpperCase(),
            department: parts[1],
            year: parseInt(parts[2]),
            semester: parseInt(parts[3]),
            batch_name: parts[4],
          };
          parsed.push(batchData);
        } else {
          errors.push(
            `Line ${i + 1}: Expected 5 columns (Program, Dept, Year, Sem, Batch Name), got ${parts.length}`,
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
        toast.success(`Successfully parsed ${parsed.length} batch records`);
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

  const addToReviewList = (batches) => {
    if (batches.length === 0) {
      toast.error("No valid batch data to add");
      return;
    }

    const newBatches = batches.map((b) => ({
      id: Date.now() + Math.random(),
      program: b.program,
      department: b.department,
      year: parseInt(b.year),
      semester: parseInt(b.semester),
      batch_name: b.batch_name,
    }));

    setBatchList([...batchList, ...newBatches]);
    toast.success(`${batches.length} batch(es) added to review list`);

    setAnimation("animate-out fade-out");
    setTimeout(() => {
      setFormData({
        program: "BTECH",
        department: "",
        year: "",
        semester: "",
        batch_name: "",
      });
      setCsvData("");
      setFile(null);
      setPreviewData([]);
      setAnimation("animate-in fade-in");
      setTimeout(() => setAnimation(""), 300);
    }, 150);
  };

  const handleManualAdd = () => {
    if (
      !formData.batch_name ||
      !formData.department ||
      !formData.year ||
      !formData.semester
    ) {
      toast.error("Please fill all required fields!");
      return;
    }
    addToReviewList([formData]);
  };

  const handleCsvAdd = () => {
    if (!csvData.trim()) {
      toast.error("Please enter batch data");
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

  const handleUpdateBatch = (index, updatedBatch) => {
    const updatedList = [...batchList];
    updatedList[index] = updatedBatch;
    setBatchList(updatedList);
    toast.success("Batch updated successfully");
  };

  const handleDeleteBatch = (index) => {
    const updatedList = batchList.filter((_, i) => i !== index);
    setBatchList(updatedList);
    toast.success("Batch deleted successfully");
  };

  const handleFinalSubmit = async () => {
    if (batchList.length === 0) {
      toast.error("No batches to submit");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare data for backend - remove the temporary id
      const submitData = batchList.map(({ id, ...batch }) => ({
        // program: batch.program,
        department: batch.department,
        year: parseInt(batch.year),
        semester: parseInt(batch.semester),
        batch_name: batch.batch_name,
      }));

      console.log("Submitting batches:", submitData);
      const result = await onSave(submitData);

      if (result !== false) {
        toast.success(`${batchList.length} batch(es) submitted successfully!`);
        setTimeout(() => {
          resetForm();
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting batches:", error);
      toast.error("Error submitting batches");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      program: "BTECH",
      department: "",
      year: "",
      semester: "",
      batch_name: "",
    });
    setCsvData("");
    setFile(null);
    setPreviewData([]);
    setBatchList([]);
    setActiveMethod("manual");
    setShowReview(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center z-20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  {showReview ? "Review & Submit Batches" : "Add New Batches"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {showReview
                    ? `Review ${batchList.length} batch(es) before final submission`
                    : "Add batch data manually, via CSV text, or file upload"}
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

          {/* Body */}
          <div className="p-6">
            {!showReview ? (
              <>
                <BatchMethodSelector
                  activeMethod={activeMethod}
                  setActiveMethod={handleMethodChange}
                  batchCount={batchList.length}
                  onReview={() => setShowReview(true)}
                />

                <div
                  className={`min-h-[420px] transition-all duration-300 ${animation}`}
                >
                  {activeMethod === "manual" && (
                    <BatchManualEntry
                      formData={formData}
                      setFormData={setFormData}
                      onAdd={handleManualAdd}
                      onReview={() => setShowReview(true)}
                      batchCount={batchList.length}
                      programOptions={programOptions}
                      departmentOptions={departmentOptions}
                      yearOptions={yearOptions}
                      semesterOptions={semesterOptions}
                    />
                  )}

                  {activeMethod === "csv" && (
                    <BatchCSVEntry
                      csvData={csvData}
                      setCsvData={setCsvData}
                      onAdd={handleCsvAdd}
                      onReview={() => setShowReview(true)}
                      batchCount={batchList.length}
                    />
                  )}

                  {activeMethod === "file" && (
                    <BatchFileUpload
                      file={file}
                      previewData={previewData}
                      onFileUpload={handleFileUpload}
                      onAdd={handleFileAdd}
                      onReview={() => setShowReview(true)}
                      batchCount={batchList.length}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="animate-in slide-in-from-right duration-300">
                <BatchReviewSection
                  batchList={batchList}
                  onUpdate={handleUpdateBatch}
                  onDelete={handleDeleteBatch}
                  onAddMore={() => setShowReview(false)}
                  onSubmit={handleFinalSubmit}
                  isSubmitting={isSubmitting}
                  programOptions={programOptions}
                  departmentOptions={departmentOptions}
                  yearOptions={yearOptions}
                  semesterOptions={semesterOptions}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBatchModal;
