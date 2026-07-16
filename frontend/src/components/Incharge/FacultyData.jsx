import React, { useState, useMemo, useEffect } from "react";
import useAdminStore from "../../store/admin/index";
import FacultyDetailsModal from "../Faculty/FacultyDetailModal";
import {
  Search,
  X,
  Loader2,
  AlertCircle,
  Mail,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  UserX,
} from "lucide-react";
import { toast } from "react-toastify";
import CustomLoader from "../../ui/CustomLoader";

// Badge component for invite status
const InviteStatusBadge = ({ status }) => {
  const config = {
    accepted: {
      label: "Joined",
      icon: <CheckCircle size={12} />,
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    pending: {
      label: "Pending",
      icon: <Clock size={12} />,
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    uninvited: {
      label: "Not Invited",
      icon: <UserX size={12} />,
      className:
        "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
    },
  };

  const { label, icon, className } = config[status] || config.uninvited;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {icon}
      {label}
    </span>
  );
};

const FacultyData = () => {
  const {
    faculties,
    facultyUsers, // ← users with role=faculty (has invite_status + faculty_code)
    isLoading,
    error,
    fetchFaculties,
    fetchUserByRole, // ← new store action
    deleteFaculty,
    updateFaculty,
    inviteFaculty,
  } = useAdminStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All"); // ← new filter
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchFaculties();
    fetchUserByRole("faculty"); // ← fetch in parallel
  }, []);

  // Build a lookup map: faculty_code → { invite_status, user _id, email }
  const facultyUserMap = useMemo(() => {
    const map = {};
    facultyUsers.forEach((u) => {
      if (u.faculty_code) {
        map[u.faculty_code] = {
          invite_status: u.invite_status,
          userId: u._id,
          email: u.email,
        };
      }
    });
    return map;
  }, [facultyUsers]);

  // Enrich each faculty with live invite_status from the user record
  const enrichedFaculties = useMemo(() => {
    return faculties.map((f) => {
      const matched = facultyUserMap[f.faculty_code];
      return {
        ...f,
        invite_status: matched?.invite_status ?? "uninvited",
        email: f.email || matched?.email || null,
      };
    });
  }, [faculties, facultyUserMap]);

  const branches = useMemo(() => {
    const uniqueBranches = [...new Set(faculties.map((f) => f.department))];
    return ["All", ...uniqueBranches];
  }, [faculties]);

  const statusFilters = ["All", "accepted", "pending", "uninvited"];

  const filteredFaculty = useMemo(() => {
    return enrichedFaculties.filter((f) => {
      const matchesSearch =
        f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.faculty_code?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBranch =
        selectedBranch === "All" || f.department === selectedBranch;
      const matchesStatus =
        selectedStatus === "All" || f.invite_status === selectedStatus;
      return matchesSearch && matchesBranch && matchesStatus;
    });
  }, [searchQuery, selectedBranch, selectedStatus, enrichedFaculties]);

  const handleEdit = (faculty, e) => {
    e.stopPropagation();
    setSelectedFaculty(faculty);
    setIsEditing(true);
  };

  const handleSaveFaculty = async (updatedFaculty) => {
    const result = await updateFaculty(updatedFaculty._id, updatedFaculty);
    if (result.success) {
      setSelectedFaculty(null);
      setIsEditing(false);
    } else {
      console.error("Update failed:", result.message);
    }
  };

  const handleDelete = async (faculty, e) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Delete ${faculty.name}? This cannot be undone.`,
    );
    if (!confirmed) return;
    setActionLoading(faculty._id);
    const success = await deleteFaculty(faculty._id);
    setActionLoading(null);
    if (!success) alert("Failed to delete faculty.");
  };

  const handleInvite = async (faculty, e) => {
    e.stopPropagation();
    if (faculty.invite_status === "pending") {
      toast.info(`${faculty.name} already has a pending invite.`);
      return;
    }
    if (faculty.invite_status === "accepted") {
      toast.info(`${faculty.name} has already joined.`);
      return;
    }
    if (!faculty.email) {
      toast.error(
        `No email found for ${faculty.name}. Please edit and add one first.`,
      );
      return;
    }
    setActionLoading(faculty._id);
    const result = await inviteFaculty(faculty._id);
    setActionLoading(null);
    if (result.success) {
      toast.success(`Invite sent to ${faculty.email}!`);
      fetchUserByRole("faculty"); // ← refresh status after invite
    } else {
      toast.error(result.message || "Failed to send invite.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-[80vh] w-full items-center justify-center text-slate-500 dark:text-slate-400">
        <CustomLoader variant="green" />
        <p className="text-lg font-medium animate-pulse">
          Loading faculty directory...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center text-slate-500 dark:text-slate-400">
        <AlertCircle size={48} className="mb-4 text-rose-500" />
        <p className="text-lg font-medium text-slate-900 dark:text-white">
          Failed to load data
        </p>
        <p className="text-sm mt-1 mb-4">{error}</p>
        <button
          onClick={fetchFaculties}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-none space-y-4 mb-6">
        {/* Search */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search faculty by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Branch filter */}
        <div className="flex overflow-x-auto pb-1 -mx-2 px-2 scrollbar-hide gap-2">
          {branches.map((branch, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedBranch(branch)}
              className={`cursor-pointer whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedBranch === branch
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              {branch}
            </button>
          ))}
        </div>

        {/* ← NEW: Invite status filter */}
        <div className="flex gap-2">
          {statusFilters.map((status) => {
            const labelMap = {
              All: "All",
              accepted: "✓ Joined",
              pending: "⏳ Pending",
              uninvited: "✗ Not Invited",
            };
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
                  selectedStatus === status
                    ? "bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-800 dark:border-white"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {labelMap[status]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Faculty list */}
      {filteredFaculty.length > 0 ? (
        <div className="flex-1 overflow-y-auto pr-2 pb-4">
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 rounded-t-xl border border-b-0 border-slate-200 dark:border-slate-700">
            <div className="col-span-4">Faculty</div>
            <div className="col-span-2">Department</div>
            <div className="col-span-2">Status</div> {/* ← new column */}
            <div className="col-span-4 text-right">Actions</div>
          </div>

          <div className="space-y-2">
            {filteredFaculty.map((fac) => (
              <div
                key={fac._id}
                onClick={() => {
                  setSelectedFaculty(fac);
                  setIsEditing(false);
                }}
                className="group bg-white dark:bg-slate-800/50 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:bg-emerald-50/50 dark:hover:bg-slate-800 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <div className="flex flex-col md:grid md:grid-cols-12 gap-3 p-4">
                  {/* Name + code */}
                  <div className="md:col-span-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg font-bold text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                      {fac.name ? fac.name.replace("Dr. ", "").charAt(0) : "F"}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 dark:text-white truncate">
                        {fac.name}
                      </h3>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {fac.faculty_code}
                      </span>
                    </div>
                  </div>

                  {/* Department */}
                  <div className="md:col-span-2 flex items-center">
                    <span className="inline-block px-2.5 py-1 bg-slate-50 dark:bg-slate-700/30 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                      {fac.department}
                    </span>
                  </div>

                  {/* ← Invite status badge */}
                  <div className="md:col-span-2 flex items-center">
                    <InviteStatusBadge status={fac.invite_status} />
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-4 flex items-center justify-start md:justify-end gap-1">
                    <button
                      onClick={(e) => handleInvite(fac, e)}
                      disabled={
                        actionLoading === fac._id ||
                        fac.invite_status === "accepted"
                      }
                      className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                        fac.invite_status === "accepted"
                          ? "text-emerald-500 dark:text-emerald-400 cursor-not-allowed"
                          : fac.invite_status === "pending"
                            ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 dark:text-slate-400 dark:hover:text-emerald-400"
                      }`}
                      title={
                        fac.invite_status === "accepted"
                          ? "Already joined"
                          : fac.invite_status === "pending"
                            ? "Invite pending — click to resend"
                            : "Send invite"
                      }
                    >
                      {actionLoading === fac._id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Mail size={18} />
                      )}
                    </button>

                    <button
                      onClick={(e) => handleEdit(fac, e)}
                      className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 dark:text-slate-400 dark:hover:text-amber-400 transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>

                    <button
                      onClick={(e) => handleDelete(fac, e)}
                      disabled={actionLoading === fac._id}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 dark:text-slate-400 dark:hover:text-rose-400 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
          <Search size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">No faculty found.</p>
          <p className="text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      )}

      <FacultyDetailsModal
        faculty={selectedFaculty}
        isEditing={isEditing}
        onSave={handleSaveFaculty}
        onClose={() => {
          setSelectedFaculty(null);
          setIsEditing(false);
        }}
      />
    </div>
  );
};

export default FacultyData;
