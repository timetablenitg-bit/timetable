// import React, { useState, useEffect, useCallback } from "react";
// import { Loader2 } from "lucide-react";
// import { toast } from "react-toastify";
// import useAdminStore from "../../store/useAdminStore";

// // Components
// import BatchHeader from "../Batch/BatchHeader";
// import AddBatchModal from "../Batch/AddBatch/AddBatchModal";
// import BatchList from "../Batch/BatchList";
// import EditBatchModal from "./EditBatchModal";
// import UnsavedChangesBanner from "./UnsavedChangesBanner";
// import CustomLoader from "../../ui/CustomLoader";

// const Batch = () => {
//   const [selectedBranch, setSelectedBranch] = useState("");
//   const [pendingBatches, setPendingBatches] = useState([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingBatch, setEditingBatch] = useState(null);

//   const {
//     batches: storeBatches,
//     fetchBatches,
//     saveBatchesToBackend,
//     updateBatchInBackend,
//     deleteBatchFromBackend,
//     isLoading,
//     isSaving,
//   } = useAdminStore();

//   useEffect(() => {
//     // if (selectedBranch) fetchBatches(selectedBranch);
//     fetchBatches();
//   }, [fetchBatches]);

//   const currentBranchPending = pendingBatches.filter(
//     (b) => b.branch === selectedBranch,
//   );
//   const displayBatches = [...storeBatches, ...currentBranchPending];

//   const handleFinalSubmit = async () => {
//     console.log("Submitting batches:", currentBranchPending);
//     const success = await saveBatchesToBackend(currentBranchPending);
//     if (success) {
//       toast.success(`${currentBranchPending.length} batch(es) saved!`);
//       setPendingBatches((prev) =>
//         prev.filter((b) => b.branch !== selectedBranch),
//       );
//     } else {
//       toast.error("Failed to save batches.");
//     }
//   };

//   const handleSaveEdit = async (updatedData) => {
//     if (!updatedData.batchName || !updatedData.students) {
//       toast.error("Required fields missing!");
//       return;
//     }

//     const isPending = pendingBatches.some((b) => b.id === updatedData.id);

//     if (isPending) {
//       setPendingBatches((prev) =>
//         prev.map((b) => (b.id === updatedData.id ? updatedData : b)),
//       );
//       toast.success("Pending update saved.");
//       setEditingBatch(null);
//     } else {
//       const success = await updateBatchInBackend(updatedData.id, updatedData);
//       if (success) {
//         toast.success("Database updated.");
//         setEditingBatch(null);
//       }
//     }
//   };

//   const handleDeleteClick = async (batchId) => {
//     if (!window.confirm("Delete this batch?")) return;
//     const isPending = pendingBatches.some((b) => b.id === batchId);

//     if (isPending) {
//       setPendingBatches((prev) => prev.filter((b) => b.id !== batchId));
//       toast.info("Removed pending batch.");
//     } else {
//       const success = await deleteBatchFromBackend(batchId);
//       if (success) toast.success("Deleted from database.");
//     }
//   };
//   const displayTBatches = storeBatches;

//   return (
//     <div className="min-h-full w-full font-sans text-gray-800 dark:text-gray-100">
//       <div className="w-full mx-auto space-y-4">
//         <BatchHeader
//           selectedBranch={selectedBranch}
//           setSelectedBranch={setSelectedBranch}
//           onAddClick={() =>
//             selectedBranch
//               ? setIsModalOpen(true)
//               : toast.warn("Select a branch first!")
//           }
//         />

//         <UnsavedChangesBanner
//           count={currentBranchPending.length}
//           branch={selectedBranch}
//           onSave={handleFinalSubmit}
//           isSaving={isSaving}
//         />

//         {isLoading ? (
//           <div className="flex justify-center py-20 ">
//             <CustomLoader variant="voilet" />
//           </div>
//         ) : (
//           // <BatchList
//           //   selectedBranch={selectedBranch}
//           //   batches={displayBatches}
//           //   onEdit={setEditingBatch}
//           //   onDelete={handleDeleteClick}
//           // />
//           <BatchList
//             batches={displayTBatches}
//             onEdit={setEditingBatch}
//             onDelete={handleDeleteClick}
//           />
//         )}

//         {isModalOpen && (
//           <AddBatchModal
//             selectedBranch={selectedBranch}
//             onClose={() => setIsModalOpen(false)}
//             onSave={(newOnes) =>
//               setPendingBatches([...pendingBatches, ...newOnes])
//             }
//           />
//         )}

//         {editingBatch && (
//           <EditBatchModal
//             batch={editingBatch}
//             onClose={() => setEditingBatch(null)}
//             onSave={handleSaveEdit}
//           />
//         )}
//       </div>
//     </div>
//   );
// };

// export default Batch;
// Batch.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import useAdminStore from "../../store/useAdminStore";

// Components
import BatchHeader from "../Batch/BatchHeader";
import AddBatchModal from "./AddBatch/AddBatchModal";
import BatchList from "../Batch/BatchList";
import EditBatchModal from "./EditBatchModal";
import UnsavedChangesBanner from "./UnsavedChangesBanner";
import CustomLoader from "../../ui/CustomLoader";

const Batch = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  const {
    batches,
    fetchBatches,
    saveBatchesToBackend,
    bulkCreateBatches,
    updateBatchInBackend,
    deleteBatchFromBackend,
    isLoading,
    isSaving,
  } = useAdminStore();

  // Fetch all batches on component mount
  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);
  console.log(batches);

  const handleAddBatch = async (newBatchData) => {
    // For single batch creation
    if (!Array.isArray(newBatchData)) {
      const result = await saveBatchesToBackend([newBatchData]);
      if (result.success) {
        toast.success("Batch created successfully!");
        return true;
      } else {
        toast.error(result.error || "Failed to create batch");
        return false;
      }
    }
    // For bulk batch creation
    else {
      const result = await saveBatchesToBackend(newBatchData);
      if (result.success) {
        const { inserted, errors } = result.summary;
        if (errors > 0) {
          toast.warning(`${inserted} batches created, ${errors} failed.`);
        } else {
          toast.success(`${inserted} batches created successfully!`);
        }
        return true;
      } else {
        toast.error(result.error || "Failed to create batches");
        return false;
      }
    }
  };

  const handleSaveEdit = async (updatedData) => {
    if (!updatedData.batch_name) {
      toast.error("Batch Name is required!");
      return;
    }

    const result = await updateBatchInBackend(editingBatch._id, updatedData);
    if (result.success) {
      toast.success("Batch updated successfully.");
      setEditingBatch(null);
    } else {
      toast.error(result.error || "Failed to update batch");
    }
  };

  const handleDeleteClick = async (batchId) => {
    if (!window.confirm("Are you sure you want to delete this batch?")) return;

    const result = await deleteBatchFromBackend(batchId);
    if (result.success) {
      toast.success("Batch deleted successfully.");
    } else {
      toast.error(result.error || "Failed to delete batch");
    }
  };

  return (
    <div className="min-h-full w-full font-sans text-gray-800 dark:text-gray-100">
      <div className="w-full mx-auto space-y-4">
        <BatchHeader onAddClick={() => setIsModalOpen(true)} />

        {isLoading ? (
          <div className="flex justify-center py-20">
            <CustomLoader variant="blue" />
          </div>
        ) : (
          <BatchList
            batches={batches}
            onEdit={setEditingBatch}
            onDelete={handleDeleteClick}
          />
        )}

        {isModalOpen && (
          <AddBatchModal
            onClose={() => setIsModalOpen(false)}
            onSave={handleAddBatch}
          />
        )}

        {editingBatch && (
          <EditBatchModal
            batch={editingBatch}
            onClose={() => setEditingBatch(null)}
            onSave={handleSaveEdit}
          />
        )}
      </div>
    </div>
  );
};

export default Batch;
