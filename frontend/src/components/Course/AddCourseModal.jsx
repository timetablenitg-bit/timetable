import React, { useState } from "react";
import CustomDropdown from "../../ui/CustomDropdown"; // Assuming you have this from the Batch code
import { toast } from "react-toastify";

const AddCourseModal = ({ selectedBranch, onClose, onSave }) => {
  const [inputMethod, setInputMethod] = useState("manual");
  const [previewData, setPreviewData] = useState([]);

  // Updated to match your new schema
  const [manualForm, setManualForm] = useState({
    course_code: "",
    course_name: "",
    semester_offered: "1",
    credits: "",
    course_type: "Theory",
    department: selectedBranch || "",
    nature: "CORE",
    lecture: "0",
    tutorial: "0",
    practical: "0",
  });

  const [pasteData, setPasteData] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleManualAdd = () => {
    if (
      !manualForm.courseCode ||
      !manualForm.courseName ||
      !manualForm.credits
    ) {
      toast.error("Course Code, Name, and Credits are required!", {
        position: "top-center",
      });
      return;
    }

    setPreviewData([
      ...previewData,
      { id: Date.now(), ...manualForm, branch: selectedBranch },
    ]);

    // Reset specific fields but keep defaults
    setManualForm({
      ...manualForm,
      course_code: "",
      course_name: "",
      credits: "",
      lecture: "0",
      tutorial: "0",
      practical: "0",
    });

    toast.success("Course added to preview!", {
      position: "top-center",
      autoClose: 2000,
    });
  };

  // Shared parsing logic for Paste and Upload
  const parseAndAddCourses = (textData) => {
    if (!textData.trim()) {
      toast.warning("No data found to parse!", {
        position: "top-center",
      });
      return;
    }

    const rows = textData.split("\n");
    const newCourses = rows
      .filter((row) => row.trim() !== "")
      .map((row, index) => {
        // MATCHING YOUR IMAGE: Course Code, Course Name, Semester, Credits, Type, Department, Nature, L, T, P
        const [
          course_code,
          course_name,
          semester_offered,
          credits,
          course_type,
          department,
          nature,
          lecture,
          tutorial,
          practical,
        ] = row.split(",");

        return {
          id: Date.now() + index,
          branch: selectedBranch,
          course_code: course_code?.trim() || "",
          course_name: course_name?.trim() || "",
          semester_offered: semester_offered?.trim() || "1",
          credits: credits?.trim() || "0",
          course_type: course_type?.trim() || "Theory",
          department: department?.trim() || selectedBranch,
          nature: nature?.trim() || "CORE",
          lecture: lecture?.trim() || "0",
          tutorial: tutorial?.trim() || "0",
          practical: practical?.trim() || "0",
        };
      });

    if (newCourses.length > 0) {
      setPreviewData((prev) => [...prev, ...newCourses]);
      setPasteData("");
      toast.success(`Successfully parsed ${newCourses.length} courses!`, {
        position: "top-center",
      });
    } else {
      toast.error("Could not parse data. Please check the format.", {
        position: "top-center",
      });
    }
  };

  const handlePasteParse = () => {
    parseAndAddCourses(pasteData);
  };

  const handleFileUpload = (e) => {
    // 1. Capture the input element immediately before the async stuff happens
    const fileInput = e.target;
    const file = fileInput.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target.result;
      parseAndAddCourses(text);
      // 2. Use the safely captured reference to reset the value
      fileInput.value = "";
    };

    reader.onerror = () => {
      toast.error("Error reading file.");
      fileInput.value = "";
    };

    reader.readAsText(file);
  };

  const handleDeletePreview = (id) => {
    setPreviewData(previewData.filter((item) => item.id !== id));
    toast.info("Course removed from preview", {
      position: "top-center",
      autoClose: 2000,
    });
  };

  const startEditing = (data) => {
    setEditingId(data.id);
    setEditForm(data);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (!editForm.courseCode || !editForm.courseName) {
      toast.error("Course Code and Name cannot be empty!");
      return;
    }
    setPreviewData(
      previewData.map((item) => (item.id === editingId ? editForm : item)),
    );
    setEditingId(null);
    toast.success("Changes saved!", {
      position: "top-center",
      autoClose: 1500,
    });
  };

  const handleFinalSubmit = () => {
    onSave(previewData);
    toast.info(
      `${previewData.length} course(s) moved to pending state. Don't forget to save to database!`,
      { position: "bottom-right", theme: "dark" },
    );
    setPreviewData([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 dark:border-slate-800">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-cyan-50/50 dark:bg-cyan-900/10 shrink-0">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              Add New Courses
            </h2>
            <p className="text-sm text-cyan-600 dark:text-cyan-400 font-medium mt-1">
              Target Branch: {selectedBranch}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-gray-500 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit mx-auto">
            {["manual", "paste", "upload"].map((method) => (
              <button
                key={method}
                onClick={() => setInputMethod(method)}
                className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${
                  inputMethod === method
                    ? "bg-white dark:bg-slate-900 shadow-sm text-cyan-600 dark:text-cyan-400 scale-100"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 scale-95 hover:scale-100"
                }`}
              >
                {method} Entry
              </button>
            ))}
          </div>

          {/* MANUAL ENTRY */}
          {inputMethod === "manual" && (
            <div className="bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 p-6 rounded-3xl shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Course Code
                  </label>
                  <input
                    placeholder="e.g. CS250"
                    value={manualForm.courseCode}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        courseCode: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div className="lg:col-span-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Course Name
                  </label>
                  <input
                    placeholder="e.g. Database Systems"
                    value={manualForm.courseName}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        courseName: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Semester
                  </label>
                  <input
                    type="number"
                    value={manualForm.semester}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, semester: e.target.value })
                    }
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    value={manualForm.credits}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, credits: e.target.value })
                    }
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Type
                  </label>
                  <CustomDropdown
                    value={manualForm.type}
                    options={["Theory", "Lab"]}
                    onChange={(val) =>
                      setManualForm({
                        ...manualForm,
                        type: val,
                      })
                    }
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Nature
                  </label>
                  <CustomDropdown
                    value={manualForm.nature}
                    options={[
                      "CORE",
                      "MINOR",
                      "ELECTIVE",
                      "PROJECT",
                      "SEMINAR",
                    ]}
                    onChange={(val) =>
                      setManualForm({
                        ...manualForm,
                        nature: val,
                      })
                    }
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Department
                  </label>
                  <input
                    placeholder="e.g. CSE"
                    value={manualForm.department}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        department: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    L
                  </label>
                  <input
                    type="number"
                    value={manualForm.l}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, l: e.target.value })
                    }
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    T
                  </label>
                  <input
                    type="number"
                    value={manualForm.t}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, t: e.target.value })
                    }
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    P
                  </label>
                  <input
                    type="number"
                    value={manualForm.p}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, p: e.target.value })
                    }
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>

                <div className="lg:col-span-1 flex items-end">
                  <button
                    onClick={handleManualAdd}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PASTE ENTRY */}
          {inputMethod === "paste" && (
            <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-700">
              <p className="text-sm text-gray-500 mb-3 font-medium">
                Format:{" "}
                <code className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 px-2 py-1 rounded-md">
                  Code, Name, Sem, Credits, Type, Dept, Nature, L, T, P
                </code>
              </p>
              <textarea
                rows="6"
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
                placeholder="CS250, Database Systems, 4, 4, Theory, CSE, CORE, 3, 1, 0&#10;CS255, Database Systems Lab, 4, 2, Lab, CSE, CORE, 0, 0, 3"
                className="w-full p-4 border border-gray-200 rounded-2xl dark:bg-slate-900 text-gray-900 dark:text-white dark:border-slate-700 font-mono text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
              />
              <button
                onClick={handlePasteParse}
                className="mt-4 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95"
              >
                Parse Data
              </button>
            </div>
          )}

          {/* UPLOAD ENTRY */}
          {inputMethod === "upload" && (
            <div className="bg-gray-50 dark:bg-slate-800/50 p-8 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Upload CSV File
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm">
                Ensure your file is comma-separated and strictly follows the
                format:
                <br />
                <code className="text-cyan-600 dark:text-cyan-400 mt-2 block">
                  Code, Name, Sem, Credits, Type, Dept, Nature, L, T, P
                </code>
              </p>
              <label className="cursor-pointer px-6 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-white rounded-xl font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-95">
                <span>Select File</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          )}

          {/* PREVIEW SECTION */}
          {previewData.length > 0 && (
            <div className="mt-10 border-t border-gray-100 dark:border-slate-800 pt-8">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-extrabold text-gray-800 dark:text-white">
                  Data Preview
                </h3>
                <span className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300 px-2 py-1 rounded-lg text-xs font-bold">
                  {previewData.length} pending
                </span>
              </div>

              <div className="flex flex-col gap-3 overflow-x-auto pb-4">
                {previewData.map((data) => (
                  <div
                    key={data.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden min-w-[700px]"
                  >
                    {editingId === data.id ? (
                      <div className="p-3 grid grid-cols-12 gap-2 items-center bg-cyan-50/50 dark:bg-cyan-900/10">
                        <input
                          value={editForm.courseCode}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              courseCode: e.target.value,
                            })
                          }
                          className="col-span-2 p-1.5 text-xs rounded border outline-none dark:bg-slate-900 text-gray-900 dark:text-white dark:border-slate-600"
                        />
                        <input
                          value={editForm.courseName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              courseName: e.target.value,
                            })
                          }
                          className="col-span-3 p-1.5 text-xs rounded border outline-none dark:bg-slate-900 text-gray-900 dark:text-white dark:border-slate-600"
                        />
                        <input
                          value={editForm.credits}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              credits: e.target.value,
                            })
                          }
                          className="col-span-1 p-1.5 text-xs rounded border outline-none dark:bg-slate-900 text-gray-900 dark:text-white dark:border-slate-600"
                          title="Credits"
                        />
                        <div className="col-span-2">
                          <CustomDropdown
                            value={editForm.type}
                            options={["Theory", "Lab"]}
                            onChange={(val) =>
                              setEditForm({
                                ...editForm,
                                type: val,
                              })
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <CustomDropdown
                            value={editForm.nature}
                            options={[
                              "CORE",
                              "MINOR",
                              "ELECTIVE",
                              "PROJECT",
                              "SEMINAR",
                            ]}
                            onChange={(val) =>
                              setEditForm({
                                ...editForm,
                                nature: val,
                              })
                            }
                          />
                        </div>
                        <div className="col-span-2 flex gap-1 justify-end">
                          <button
                            onClick={saveEdit}
                            className="p-1.5 bg-emerald-100 text-emerald-600 rounded"
                          >
                            ✅
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1.5 bg-gray-100 text-gray-600 rounded"
                          >
                            ❌
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 flex items-center justify-between gap-4">
                        <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-3 font-bold text-gray-900 dark:text-white">
                            <span className="text-cyan-600 dark:text-cyan-400 mr-2">
                              {data.courseCode}
                            </span>
                            <span className="text-sm">{data.courseName}</span>
                          </div>
                          <div className="col-span-8 flex flex-wrap gap-2 text-xs font-medium dark:text-white">
                            <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                              Sem {data.semester}
                            </span>
                            <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                              {data.credits} Credits
                            </span>
                            <span
                              className={`${data.type === "Lab" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"} px-2 py-1 rounded`}
                            >
                              {data.type}
                            </span>
                            <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                              {data.department}
                            </span>
                            <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 rounded">
                              {data.nature}
                            </span>
                            <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                              L:{data.l} T:{data.t} P:{data.p}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(data)}
                            className="p-2 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeletePreview(data.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleFinalSubmit}
            disabled={previewData.length === 0}
            className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${previewData.length > 0 ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white" : "bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed shadow-none"}`}
          >
            Confirm & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCourseModal;
