import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import useAdminStore from "../../store/admin";

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
    updateBatchInBackend,
    deleteBatchFromBackend,
    isLoading,
  } = useAdminStore();

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleAddBatch = async (newBatchData) => {
    const result = await saveBatchesToBackend(newBatchData);

    if (!result.success) {
      toast.error(result.message || "Failed to create batch");
      return false;
    }

    if (Array.isArray(newBatchData) && newBatchData.length > 1) {
      const insertedCount = Array.isArray(result.data) ? result.data.length : 0;
      toast.success(`${insertedCount} batches created successfully!`);
    } else {
      toast.success("Batch created successfully!");
    }

    return true;
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
      toast.error(result.message || "Failed to update batch");
    }
  };

  const handleDeleteClick = async (batchId) => {
    if (!window.confirm("Are you sure you want to delete this batch?")) return;

    const result = await deleteBatchFromBackend(batchId);
    if (result.success) {
      toast.success("Batch deleted successfully.");
    } else {
      toast.error(result.message || "Failed to delete batch");
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
