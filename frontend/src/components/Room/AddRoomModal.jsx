import React, { useState } from "react";
import CustomDropdown from "../../ui/CustomDropdown";
import { toast } from "react-toastify";

const AddRoomModal = ({
  selectedBranch,
  availableBatches = [], // Added safety fallback
  onClose,
  onSave,
}) => {
  const [inputMethod, setInputMethod] = useState("manual");
  const [previewData, setPreviewData] = useState([]);

  const [manualForm, setManualForm] = useState({
    batchName: "",
    labName: "",
    roomNumber: "",
  });
  const [pasteData, setPasteData] = useState("");

  // FIXED: Convert available batches into a simple string array for the CustomDropdown
  const batchOptions = availableBatches.map((b) => b.batchName);

  const handleManualAdd = () => {
    if (
      !manualForm.batchName ||
      !manualForm.labName ||
      !manualForm.roomNumber
    ) {
      toast.error("All fields are required!");
      return;
    }
    setPreviewData([
      ...previewData,
      { id: Date.now(), branch: selectedBranch, ...manualForm },
    ]);
    setManualForm({ batchName: "", labName: "", roomNumber: "" });
    toast.success("Room assignment added to preview!");
  };

  const handlePasteParse = () => {
    if (!pasteData.trim()) {
      toast.warn("Please paste some data first!");
      return;
    }
    const rows = pasteData.split("\n");
    const newRooms = rows
      .filter((row) => row.trim() !== "")
      .map((row, index) => {
        const [batchName, labName, roomNumber] = row.split(",");
        return {
          id: Date.now() + index,
          branch: selectedBranch,
          batchName: batchName?.trim(),
          labName: labName?.trim(),
          roomNumber: roomNumber?.trim(),
        };
      });
    setPreviewData([...previewData, ...newRooms]);
    setPasteData("");
    toast.success("Data Parsed Successfully");
  };

  // CSV FILE UPLOAD LOGIC
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target.result;
      const rows = csvData.split("\n");

      const newRooms = rows
        .filter((row) => row.trim() !== "")
        .map((row, index) => {
          const [batchName, labName, roomNumber] = row.split(",");
          return {
            id: Date.now() + index,
            branch: selectedBranch,
            batchName: batchName?.trim() || "Unknown",
            labName: labName?.trim() || "Unknown",
            roomNumber: roomNumber?.trim() || "Unknown",
          };
        });

      if (newRooms.length > 0) {
        setPreviewData((prev) => [...prev, ...newRooms]);
        toast.success(`Successfully loaded ${newRooms.length} rows from CSV!`);
      } else {
        toast.error("CSV file appears to be empty or malformed.");
      }
    };

    reader.onerror = () => {
      toast.error("Error reading the file.");
    };

    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Assign Rooms ({selectedBranch})
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-500 hover:text-red-500 transition-colors"
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
                className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                  inputMethod === method
                    ? "bg-white dark:bg-slate-900 shadow-sm text-teal-600 dark:text-teal-400"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          {/* 1. MANUAL TAB */}
          {inputMethod === "manual" && (
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
                  Select Batch
                </label>
                <CustomDropdown
                  options={batchOptions}
                  value={manualForm.batchName}
                  onChange={(val) =>
                    setManualForm({ ...manualForm, batchName: val })
                  }
                  placeholder={
                    batchOptions.length > 0
                      ? "Select a batch..."
                      : "No batches found. Create batches first."
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
                  Lab / Subject Name
                </label>
                <input
                  value={manualForm.labName}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, labName: e.target.value })
                  }
                  placeholder="e.g. DBMS Lab"
                  className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none text-gray-800 dark:text-white font-medium focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
                  Room Number
                </label>
                <input
                  value={manualForm.roomNumber}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, roomNumber: e.target.value })
                  }
                  placeholder="e.g. Lab-304"
                  className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none text-gray-800 dark:text-white font-medium focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <button
                onClick={handleManualAdd}
                className="md:col-span-3 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-colors"
              >
                + Add to Preview
              </button>
            </div>
          )}

          {/* 2. PASTE TAB */}
          {inputMethod === "paste" && (
            <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-gray-100 dark:border-slate-700">
              <p className="text-sm text-gray-500 mb-3">
                Format:{" "}
                <code className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 px-2 py-1 rounded">
                  Batch Name, Lab Name, Room Number
                </code>
              </p>
              <textarea
                rows="4"
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
                placeholder="1st_Year_Sec_A, Physics Lab, Room-101&#10;3rd_Year_DBMS, Database Lab, Lab-304"
                className="w-full p-4 border border-gray-200 rounded-xl dark:bg-slate-900 dark:border-slate-700 font-mono text-sm outline-none text-gray-800 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={handlePasteParse}
                className="mt-4 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-colors"
              >
                Parse Data
              </button>
            </div>
          )}

          {/* 3. UPLOAD TAB */}
          {inputMethod === "upload" && (
            <div className="relative border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-3xl p-12 text-center bg-gray-50 dark:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-colors group">
              <svg
                className="w-12 h-12 mx-auto text-teal-400 group-hover:text-teal-600 mb-4 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                ></path>
              </svg>
              <p className="font-bold text-gray-700 dark:text-gray-300 text-lg">
                Click to upload a CSV File
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Format must be:{" "}
                <span className="font-mono bg-gray-200 dark:bg-slate-700 px-1 rounded">
                  Batch Name, Lab Name, Room Number
                </span>
              </p>

              {/* Invisible File Input overlaying the whole box */}
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          )}

          {/* PREVIEW SECTION */}
          {previewData.length > 0 && (
            <div className="mt-8 border-t border-gray-100 dark:border-slate-800 pt-6">
              <h3 className="font-bold mb-4 text-gray-800 dark:text-white">
                Preview ({previewData.length})
              </h3>
              <div className="flex flex-col gap-3">
                {previewData.map((data) => (
                  <div
                    key={data.id}
                    className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700"
                  >
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {data.batchName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {data.labName} •{" "}
                        <strong className="text-teal-600 dark:text-teal-400">
                          {data.roomNumber}
                        </strong>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setPreviewData(
                          previewData.filter((i) => i.id !== data.id),
                        );
                        toast.info("Removed from preview", { autoClose: 1500 });
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        ></path>
                      </svg>
                    </button>
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
            onClick={() => {
              onSave(previewData);
              onClose();
            }}
            disabled={!previewData.length}
            className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-teal-500 to-emerald-500 text-white disabled:opacity-50 transition-opacity"
          >
            Save Assignments
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRoomModal;
