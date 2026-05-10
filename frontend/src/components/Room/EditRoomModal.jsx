// components/Room/EditRoomModal.jsx
import React, { useState } from "react";
import { X, DoorOpen } from "lucide-react";
import { toast } from "react-toastify";

const EditRoomModal = ({ room, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    room_code: room.room_code || "",
    building_name: room.building_name || "Gyan Mandir",
    room_type: room.room_type || "LECTURE",
    capacity: room.capacity || "",
  });

  const roomTypeOptions = ["LECTURE", "LAB"];
  const buildingOptions = [
    "Gyan Mandir",
    "Academic Block",
    "Science Block",
    "Engineering Block",
    "Admin Block",
  ];

  const handleSave = () => {
    if (!formData.room_code || !formData.room_type) {
      toast.error("Room Code and Room Type are required!");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-purple-50/50 dark:bg-purple-900/10">
          <div className="flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Edit Room
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-4">
            {/* Room Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Room Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.room_code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    room_code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., LAB-101, L-201"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              />
            </div>

            {/* Building Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Building Name
              </label>
              <select
                value={formData.building_name}
                onChange={(e) =>
                  setFormData({ ...formData, building_name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              >
                {buildingOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Room Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Room Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.room_type}
                onChange={(e) =>
                  setFormData({ ...formData, room_type: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              >
                {roomTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                LECTURE = Regular classroom | LAB = Laboratory/Computer Lab
              </p>
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Capacity
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: e.target.value })
                }
                placeholder="e.g., 60"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Optional: Maximum number of students the room can accommodate
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl font-medium bg-purple-600 hover:bg-purple-700 text-white shadow-lg transition-all active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRoomModal;
