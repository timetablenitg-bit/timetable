import React, { useState } from "react";
import { Edit2, Trash2, Calendar, BookOpen, XCircle, X } from "lucide-react";
import EditSessionModal from "./EditSessionModal";
import AcademicSession from "./AcademicSession";

const SessionList = ({ sessions, onEdit, onDelete }) => {
  const [editingSession, setEditingSession] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  // Transform session data to match AcademicSession expected format
  const transformSessionData = (session) => {
    return {
      _id: session.id,
      academic_year: session.name,
      term: session.type,
      isActive: session.status === "Active",
      ...session,
    };
  };
  const getStatusBadge = (status) => {
    return status === "Active" ? (
      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 ">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Active
      </span>
    ) : (
      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        <XCircle className="w-3 h-3" />
        Inactive
      </span>
    );
  };

  const getTypeBadge = (type) => (
    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
      <BookOpen className="w-3 h-3" />
      {type}
    </span>
  );

  const handleSessionClick = (session, e) => {
    // Prevent opening modal if clicking on edit/delete buttons
    if (
      e.target.closest("button") &&
      (e.target.closest("button").title === "Edit" ||
        e.target.closest("button").title === "Delete")
    ) {
      return;
    }
    setSelectedSession(session);
  };
  return (
    <>
      <div className="space-y-4 animate-fadeInUp" data-tour="session-list">
        {sessions.map((session) => (
          <div
            key={session._id}
            onClick={(e) => handleSessionClick(session, e)}
            className="cursor-pointer group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 
                       transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:bg-emerald-50/50"
          >
            <div className="flex items-center justify-between gap-4 flex-nowrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-gray-700 dark:to-gray-700 rounded-xl shrink-0">
                  <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 truncate">
                    {session.academic_year}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {getTypeBadge(session.term)}
                    {getStatusBadge(session.isActive ? "Active" : "Inactive")}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  title="Edit"
                  onClick={() => setEditingSession(session)}
                  className="cursor-pointer p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 transition-all duration-200 transform hover:scale-110 active:scale-95"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  title="Delete"
                  onClick={() => setSessionToDelete(session)}
                  className="cursor-pointer p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 transition-all duration-200 transform hover:scale-110 active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Session Details Modal Overlay */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative bg-white dark:bg-gray-900 shadow-2xl max-w-6xl w-full h-screen max-h-screen sm:max-h-[95vh] sm:rounded-2xl flex flex-col overflow-hidden">
            <AcademicSession
              session={transformSessionData(selectedSession)}
              onClose={() => setSelectedSession(null)}
            />
          </div>
        </div>
      )}

      {/* Centered Delete Confirmation Overlay */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-gray-200 dark:border-gray-700 animate-scaleUp">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
              Confirm Delete
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                "{sessionToDelete.academic_year}"
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onDelete(sessionToDelete._id);
                  setSessionToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => setSessionToDelete(null)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          activeSession={sessions.find((s) => s.isActive)}
          onClose={() => setEditingSession(null)}
          onSave={(s) => {
            onEdit(s);
            setEditingSession(null);
          }}
        />
      )}
    </>
  );
};

export default SessionList;
