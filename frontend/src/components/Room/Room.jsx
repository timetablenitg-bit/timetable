import React, { useState, useEffect } from "react";
import RoomHeader from "./RoomHeader";
import RoomList from "./RoomList";
import AddRoomModal from "./AddRoomModal";
import useAdminStore from "../../store/useAdminStore";
import { toast } from "react-toastify";
import CustomLoader from "../../ui/CustomLoader";

const Room = () => {
  const [selectedBranch, setSelectedBranch] = useState("");
  const [pendingRooms, setPendingRooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const {
    batches: storeBatches, // Used to populate the dropdowns!
    rooms: storeRooms,
    fetchBatches,
    fetchRooms,
    saveRoomsToBackend,
    updateRoomInBackend,
    deleteRoomFromBackend,
    isRoomsLoading,
    isSaving,
  } = useAdminStore();

  useEffect(() => {
    if (selectedBranch) {
      fetchBatches(selectedBranch); // Fetch batches so we can assign them
      fetchRooms(selectedBranch); // Fetch existing room assignments
    }
  }, [selectedBranch, fetchBatches, fetchRooms]);

  const currentBranchPending = pendingRooms.filter(
    (r) => r.branch === selectedBranch,
  );
  const displayRooms = [...storeRooms, ...currentBranchPending];

  const handleFinalSubmit = async () => {
    const success = await saveRoomsToBackend(
      selectedBranch,
      currentBranchPending,
    );
    if (success) {
      toast.success("Room assignments saved to database!");
      setPendingRooms((prev) =>
        prev.filter((r) => r.branch !== selectedBranch),
      );
    } else {
      toast.error("Failed to save room assignments.");
    }
  };

  const handleDeleteClick = async (roomId) => {
    if (!window.confirm("Delete this room assignment?")) return;
    const isPending = pendingRooms.some((r) => r.id === roomId);
    if (isPending) {
      setPendingRooms((prev) => prev.filter((r) => r.id !== roomId));
      toast.info("Pending assignment removed.");
    } else {
      const success = await deleteRoomFromBackend(roomId);
      if (success) toast.success("Assignment deleted from database.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRoom.labName || !editingRoom.roomNumber) {
      toast.error("Lab Name and Room Number required");
      return;
    }
    const isPending = pendingRooms.some((r) => r.id === editingRoom.id);
    if (isPending) {
      setPendingRooms((prev) =>
        prev.map((r) => (r.id === editingRoom.id ? editingRoom : r)),
      );
      toast.success("Pending assignment updated.");
    } else {
      const success = await updateRoomInBackend(editingRoom.id, editingRoom);
      if (success) toast.success("Assignment updated in database.");
    }
    setEditingRoom(null);
  };

  return (
    <div className="min-h-full w-full bg-[#f8fafc] dark:bg-[#0f172a]  font-sans text-gray-800 dark:text-gray-100">
      <div className="w-full mx-auto space-y-4">
        <RoomHeader
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          onAddClick={() => {
            if (!selectedBranch) return toast.warn("Select a branch first!");
            setIsModalOpen(true);
          }}
        />

        {currentBranchPending.length > 0 && (
          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-500/30 p-4 rounded-2xl flex justify-between items-center animate-fade-in-up">
            <div>
              <h3 className="font-bold text-teal-900 dark:text-teal-100">
                Unsaved Assignments
              </h3>
              <p className="text-sm text-teal-700 dark:text-teal-300">
                You have {currentBranchPending.length} new assignments to save.
              </p>
            </div>
            <button
              onClick={handleFinalSubmit}
              disabled={isSaving}
              className="px-6 py-2 bg-teal-600 text-white rounded-xl font-bold shadow-md"
            >
              {isSaving ? "Saving..." : "Save to Database"}
            </button>
          </div>
        )}

        {isRoomsLoading ? (
          <div className="flex justify-center h-130 items-center text-teal-500">
            <CustomLoader variant="green"/>
          </div>
        ) : (
          <RoomList
            selectedBranch={selectedBranch}
            rooms={displayRooms}
            onEdit={setEditingRoom}
            onDelete={handleDeleteClick}
          />
        )}

        {isModalOpen && (
          <AddRoomModal
            selectedBranch={selectedBranch}
            availableBatches={storeBatches} // Passes fetched batches to modal!
            onClose={() => setIsModalOpen(false)}
            onSave={(newRooms) =>
              setPendingRooms([...pendingRooms, ...newRooms])
            }
          />
        )}

        {editingRoom && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6">
              <h2 className="text-2xl font-bold mb-4 dark:text-white">
                Edit Assignment
              </h2>
              <div className="space-y-4">
                <input
                  disabled
                  value={editingRoom.batchName}
                  className="w-full p-3 bg-gray-100 dark:bg-slate-800 rounded-xl text-gray-500"
                />
                <input
                  value={editingRoom.labName}
                  onChange={(e) =>
                    setEditingRoom({ ...editingRoom, labName: e.target.value })
                  }
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white"
                />
                <input
                  value={editingRoom.roomNumber}
                  onChange={(e) =>
                    setEditingRoom({
                      ...editingRoom,
                      roomNumber: e.target.value,
                    })
                  }
                  className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl outline-none dark:text-white"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingRoom(null)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 rounded-xl font-bold text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Room;
