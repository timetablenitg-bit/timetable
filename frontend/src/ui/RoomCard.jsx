// import React from "react";
// import { DoorClosed, Pencil, Trash2, MapPin } from "lucide-react";

// const RoomCard = ({ assignment, onEdit, onDelete }) => {
//   return (
//     <div className="group relative bg-white dark:bg-slate-900 hover:bg-green-100 dark:hover:bg-emerald-950/30 rounded-2xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full max-w-sm flex flex-col gap-5 min-h-60 h-fit">
//       {/* Key changes in the line above:
//          - Added 'hover:bg-green-100'
//          - Added 'dark:hover:bg-emerald-950/30' for a subtle dark green hover
//          - Kept 'h-fit' to prevent expansion
//       */}

//       {/* Header: Status & Actions */}
//       <div className="flex justify-between items-center shrink-0">
//         <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
//           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
//           Assigned
//         </span>

//         <div className="flex items-center gap-1">
//           <button
//             onClick={() => onEdit(assignment)}
//             className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:text-teal-400 dark:hover:bg-teal-500/10 rounded-md transition-colors"
//           >
//             <Pencil size={14} strokeWidth={2.5} />
//           </button>
//           <button
//             onClick={() => onDelete(assignment.id)}
//             className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-md transition-colors"
//           >
//             <Trash2 size={14} strokeWidth={2.5} />
//           </button>
//         </div>
//       </div>

//       {/* Body: Main Information */}
//       <div className="flex-1">
//         <h3 className="text-base font-bold text-gray-900 dark:text-white truncate mb-1.5">
//           {assignment.batchName}
//         </h3>
//         <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
//           <MapPin size={12} className="opacity-70" />
//           {assignment.labName}
//         </p>
//       </div>

//       {/* Footer: Room Information Dock */}
//       <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 transition-colors group-hover:bg-white/50 dark:group-hover:bg-slate-800">
//         <div className="flex items-center gap-3">
//           <div className="p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-gray-100 dark:border-slate-600">
//             <DoorClosed
//               size={16}
//               className="text-gray-600 dark:text-gray-300"
//               strokeWidth={2}
//             />
//           </div>
//           <div className="flex flex-col">
//             <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-0.5">
//               Room
//             </span>
//             <span className="text-sm font-extrabold text-gray-800 dark:text-gray-100 leading-none">
//               {assignment.roomNumber}
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RoomCard;


//new
// components/ui/RoomCard.jsx
import React, { useState, useEffect } from "react";
import {
  DoorClosed,
  Pencil,
  Trash2,
  MapPin,
  DoorOpen,
  Users,
  Building,
  Hash,
  Eye,
  ChevronRight,
  X,
} from "lucide-react";

const RoomCard = ({ room, onEdit, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getRoomTypeColor = (type) => {
    return type === "LAB"
      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  };

  const handleCardClick = (e) => {
    if (e.target.closest("button")) return;
    setShowDetails(true);
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showDetails) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showDetails]);

  // Handle case when room is undefined
  if (!room) {
    return null;
  }

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border border-gray-200 dark:border-slate-700"
      >
        <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-600" />

        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div
              className={`px-3 py-1.5 rounded-xl ${getRoomTypeColor(room.room_type)} shadow-sm`}
            >
              <span className="text-xs font-bold">
                {room.room_type || "LECTURE"}
              </span>
            </div>

            <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(room);
                }}
                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl transition-all"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(room._id || room.id);
                }}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight mb-2">
              {room.room_code || room.roomCode || "N/A"}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Building size={12} className="text-purple-500" />
              <span>
                {room.building_name || room.buildingName || "Gyan Mandir"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  Code
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {room.room_code || room.roomCode}
                </p>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-500" />
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  Capacity
                </p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {room.capacity || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Eye size={12} />
              <span>Click to view details</span>
            </div>
            <ChevronRight
              size={16}
              className="text-purple-500 group-hover:translate-x-1 transition-transform"
            />
          </div>
        </div>
      </div>

      {/* Details Modal - Fixed Scrolling */}
      {showDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowDetails(false)}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header - Fixed at top */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-5 flex justify-between items-center rounded-t-2xl z-10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <DoorOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Room Details</h2>
                  <p className="text-xs text-white/80">
                    Complete room information
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div
              className="flex-1 overflow-y-auto p-6"
              style={{ maxHeight: "calc(90vh - 140px)" }}
            >
              <div className="mb-6 p-5 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {room.room_code || room.roomCode}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  {room.room_type || "LECTURE"} Room
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase">
                      Building
                    </span>
                  </div>
                  <p className="text-base font-medium">
                    {room.building_name || room.buildingName || "Gyan Mandir"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-pink-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase">
                      Capacity
                    </span>
                  </div>
                  <p className="text-base font-medium">
                    {room.capacity || "Not Specified"} students
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase">
                      Room Code
                    </span>
                  </div>
                  <p className="text-base font-medium">
                    {room.room_code || room.roomCode}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <DoorClosed className="w-4 h-4 text-pink-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase">
                      Room Type
                    </span>
                  </div>
                  <p className="text-base font-medium">
                    {room.room_type || "LECTURE"}
                  </p>
                </div>
              </div>

              <div className="p-5 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/20 rounded-xl">
                <h4 className="text-sm font-semibold text-purple-600 mb-3">
                  Additional Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-slate-600 dark:text-slate-400 mb-1 sm:mb-0">
                      Room ID:
                    </span>
                    <span className="font-medium text-slate-800 dark:text-white break-all">
                      {room._id || room.id}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-slate-600 dark:text-slate-400 mb-1 sm:mb-0">
                      Created:
                    </span>
                    <span className="font-medium text-slate-800 dark:text-white">
                      {room.createdAt
                        ? new Date(room.createdAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <span className="text-slate-600 dark:text-slate-400 mb-1 sm:mb-0">
                      Last Updated:
                    </span>
                    <span className="font-medium text-slate-800 dark:text-white">
                      {room.updatedAt
                        ? new Date(room.updatedAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Fixed at bottom */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-6 py-4 flex justify-end gap-3 rounded-b-2xl flex-shrink-0">
              <button
                onClick={() => setShowDetails(false)}
                className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetails(false);
                  onEdit(room);
                }}
                className="px-5 py-2.5 rounded-xl font-medium bg-purple-600 hover:bg-purple-700 text-white transition-all flex items-center gap-2"
              >
                <Pencil size={16} />
                Edit Room
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoomCard;
