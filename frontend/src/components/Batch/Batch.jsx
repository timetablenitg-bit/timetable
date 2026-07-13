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
