import React, { useState, useEffect } from "react";
import GenerateTableHeader from "./GenerateTable/GenerateTableHeader";
import NoSessionCreated from "./GenerateTable/NoSessionCreated";
import SessionList from "./academicSession/SessionList";
import CreateSessionModal from "./academicSession/CreateSessionModal";
import SearchBar from "./GenerateTable/SearchBar";
import useAdminStore from "../../store/admin/index";
import TourButton from "../../tour/Tourbutton";
import useTourAutostart from "../../tour/Usetourautostart";

const GenerateTable = () => {
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  useTourAutostart("generate");

  const {
    academicSessions,
    fetchAcademicSessions,
    deleteAcademicSession,
    updateAcademicSession,
    createAcademicSession,
  } = useAdminStore();

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await fetchAcademicSessions();
      } catch {
        setFetchError("Failed to load academic sessions.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchAcademicSessions]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSessions(academicSessions);
    } else {
      const filtered = academicSessions.filter((session) =>
        session.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredSessions(filtered);
    }
  }, [searchQuery, academicSessions]);

  const handleAddSession = async (newSession) => {
    return await createAcademicSession(newSession);
  };

  const handleEditSession = async (updatedSession) => {
    await updateAcademicSession(updatedSession.id, updatedSession);
  };

  const handleDeleteSession = async (id) => {
    await deleteAcademicSession(id);
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GenerateTableHeader
          onAddSession={() => {
            console.log("Add Session button clicked");
            setIsModalOpen(true);
          }}
          sessionCount={filteredSessions.length}
          totalSessions={academicSessions.length}
        />

        {/* Search Bar */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalResults={filteredSessions.length}
        />

        {filteredSessions.length === 0 ? (
          searchQuery ? (
            <NoSearchResults
              searchQuery={searchQuery}
              onClear={() => setSearchQuery("")}
            />
          ) : (
            <NoSessionCreated
              onAddSession={() => {
                console.log("Create first session clicked");
                setIsModalOpen(true);
              }}
            />
          )
        ) : (
          <SessionList
            sessions={filteredSessions}
            onEdit={handleEditSession}
            onDelete={handleDeleteSession}
          />
        )}

        <CreateSessionModal
          isOpen={isModalOpen}
          onClose={() => {
            console.log("Closing modal");
            setIsModalOpen(false);
          }}
          onSave={handleAddSession}
        />
      </div>
      <TourButton view="generate" />
    </div>
  );
};

export default GenerateTable;
