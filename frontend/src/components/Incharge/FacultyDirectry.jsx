import React, { useState } from "react";
import { Plus } from "lucide-react";
import FacultyData from "./FacultyData";
import AddFacultyModal from "../Faculty/AddFaculty/AddFacultyModal";
import useAdminStore from "../../store/useAdminStore";

const FacultyDirectry = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { createFaculty, bulkCreateFaculties } = useAdminStore();

  const handleAddFaculty = async (facultyList) => {
    if (facultyList.length === 1) {
      const faculty = facultyList[0];
      const result = await createFaculty({
        faculty_code: faculty.facultyId,
        name: faculty.name,
        department: faculty.department,
      });
      if (!result.success) throw new Error(result.message);
    } else {
      const rows = facultyList.map((f) => ({
        faculty_code: f.facultyId,
        name: f.name,
        department: f.department,
      }));
      const result = await bulkCreateFaculties(rows);
      if (!result.success) throw new Error(result.message);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-[#020617] transition-colors duration-500">
      {/* Minimal header with title and Add Faculty button */}
      <div className="w-full px-4 md:px-8 pt-6 pb-2 flex flex-row items-center justify-between gap-4">
        <h1 className="text-lg md:text-2xl font-extrabold tracking-tight bg-gradient-to-br from-emerald-600 to-teal-700 bg-clip-text text-transparent">
          Faculty Directory
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98] whitespace-nowrap"
        >
          <Plus size={16} />
          <span>Add Faculty</span>
        </button>
      </div>

      {/* Content area: only the directory table */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#020617] relative">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        <div className="relative p-4 md:p-8 max-w-[1600px] mx-auto animate-in fade-in zoom-in-95 duration-500">
          <FacultyData />
        </div>
      </div>

      <AddFacultyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddFaculty={handleAddFaculty}
      />
    </div>
  );
};

export default FacultyDirectry;
