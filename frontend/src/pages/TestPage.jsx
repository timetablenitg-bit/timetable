import React, { useState } from "react";
// Removed useNavigate as it wasn't being used, add it back if you need it later

// 1️⃣ Corrected the lucide-react imports to match what you actually use
import {
  Menu,
  X,
  CalendarDays,
  Table,
  ClipboardCheck,
  Plane,
  BarChart3,
  MessageSquare,
} from "lucide-react";

import Navbaar from "../components/Navbaar"
// 2️⃣ Removed the duplicate TableModal import
import TableModal from "../components/TableModal";
import FacultyTimeTableModal from "../components/Faculty/FacultyTimeTableModal";
import Attendance from "../components/Attendance/Attendance";
import Leave from "../components/Faculty/Leave";
import Workload from "../components/Faculty/Workload";
import ContactAdmin from "../components/Faculty/ContactAdmin";

const Incharge = () => {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [activeView, setActiveView] = useState("schedule");

  const renderContent = () => {
    switch (activeView) {
      case "schedule":
        return <FacultyTimeTableModal />;
      case "timetable":
        return <TableModal />;
      case "attendance":
        return <Attendance />;
      case "leave":
        return <Leave />;
      case "workload":
        return <Workload />;
      case "request":
        return <ContactAdmin />;
      default:
        return <div>Select something</div>;
    }
  };

  // 🔁 Render content dynamically
  const menuItems = [
    { key: "schedule", label: "Today's Schedule", icon: CalendarDays },
    { key: "timetable", label: "Time Table", icon: Table },
    { key: "attendance", label: "Attendance", icon: ClipboardCheck },
    { key: "leave", label: "Leave Request", icon: Plane },
    { key: "workload", label: "Workload", icon: BarChart3 },
    { key: "request", label: "Request Change", icon: MessageSquare },
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden">
      {/* Navbar */}
      <InchargeNavbaar />

      {/* Overlay (Mobile) */}
      {openSidebar && (
        <div
          onClick={() => setOpenSidebar(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* Layout */}
      <div className="flex flex-1 w-full overflow-hidden px-2">
        {/* ================= SIDEBAR ================= */}
        <div
          className={`
            fixed md:static top-0 left-0 h-full w-64 
            bg-white dark:bg-slate-900
            border-r border-slate-200 dark:border-slate-800
            z-50 transform transition-transform duration-300
            ${openSidebar ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0 flex flex-col
            px-4 py-5
          `}
        >
          {/* Close Button (Mobile) */}
          <div className="flex justify-end md:hidden mb-4">
            <X
              onClick={() => setOpenSidebar(false)}
              className="cursor-pointer text-slate-900 dark:text-white"
            />
          </div>

          {/* Title */}
          <h1 className="text-2xl text-blue-600 font-bold px-2">Dr. Broken</h1>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
            Faculty Panel
          </h2>

          {/* Menu */}
          <div className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveView(item.key);
                    setOpenSidebar(false);
                  }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-200

                    ${
                      activeView === item.key
                        ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }
                  `}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-auto pt-6 text-xs text-slate-400 px-2">
            Faculty Dashboard v1.0
          </div>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="flex-1 overflow-y-auto p-1">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-4 min-h-full flex items-center justify-center">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* ================= FLOAT BUTTON ================= */}
      <button
        onClick={() => setOpenSidebar(true)}
        className="md:hidden fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-105 transition z-50"
      >
        <Menu size={24} />
      </button>
    </div>
  );
};

export default Incharge;








// import React, { useState } from "react";
// import { teacher } from "../../public/js/data";
// import {
//   X,
//   Plus,
//   Edit2,
//   Save,
//   Mail,
//   Phone,
//   MapPin,
//   Briefcase,
// } from "lucide-react";

// // Import your newly created components
// import Overview from "../components/Incharge/Overview";
// import Directory from "../components/Directory";

// const FacultyDirectory = () => {
//   const [teachersList, setTeachersList] = useState(teacher);
//   const [activeTab, setActiveTab] = useState("directory");

//   // Modal States
//   const [selectedFaculty, setSelectedFaculty] = useState(null);
//   const [isFormOpen, setIsFormOpen] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);

//   const [formData, setFormData] = useState({
//     id: "",
//     teacher: "",
//     specialization: "",
//     qualification: "",
//     email: "",
//     extensionNo: "",
//   });

//   // Form Handlers
//   const handleOpenAdd = () => {
//     setFormData({
//       id: "",
//       teacher: "",
//       specialization: "",
//       qualification: "",
//       email: "",
//       extensionNo: "",
//     });
//     setIsEditing(false);
//     setIsFormOpen(true);
//   };

//   const handleOpenEdit = (faculty) => {
//     setFormData({ ...faculty });
//     setIsEditing(true);
//     setSelectedFaculty(null);
//     setIsFormOpen(true);
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSaveTeacher = (e) => {
//     e.preventDefault();
//     if (isEditing) {
//       setTeachersList((prev) =>
//         prev.map((t) => (t.id === formData.id ? { ...t, ...formData } : t)),
//       );
//     } else {
//       const newTeacher = {
//         ...formData,
//         id: formData.id || `F-${Math.floor(Math.random() * 10000)}`,
//       };
//       setTeachersList((prev) => [newTeacher, ...prev]);
//     }
//     setIsFormOpen(false);
//     setActiveTab("directory");
//   };

//   return (
//     // 1. h-full and overflow-hidden so it strictly fits the parent
//     <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans relative overflow-hidden">
//       {/* 2. HEADER - flex-none keeps it static at the top */}
//       <div className="flex-none p-4 md:p-8 pb-4 md:pb-6 border-b border-slate-200 dark:border-slate-800">
//         <div className="flex flex-wrap items-center justify-between gap-4">
//           <div>
//             <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
//               {activeTab === "overview" ? "Faculty Overview" : "Directory"}
//             </h1>
//             <p className="text-sm text-slate-500 mt-0.5">
//               {activeTab === "overview"
//                 ? "Analytical insights and department statistics."
//                 : "Manage and view faculty members."}
//             </p>
//           </div>

//           <div className="flex items-center gap-3">
//             {/* Inline Tab Switcher */}
//             <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl">
//               <button
//                 onClick={() => setActiveTab("overview")}
//                 className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
//                   activeTab === "overview"
//                     ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
//                     : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
//                 }`}
//               >
//                 Overview
//               </button>
//               <button
//                 onClick={() => setActiveTab("directory")}
//                 className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
//                   activeTab === "directory"
//                     ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
//                     : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
//                 }`}
//               >
//                 Directory
//               </button>
//             </div>

//             <button
//               onClick={handleOpenAdd}
//               className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-md transition-all"
//             >
//               <Plus size={18} /> Add Faculty
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* 3. CONTENT AREA - flex-1 takes remaining space, overflow-y-auto enables internal scroll */}
//       <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8">
//         {activeTab === "overview" ? (
//           <Overview teachersList={teachersList} />
//         ) : (
//           <Directory
//             teachersList={teachersList}
//             setSelectedFaculty={setSelectedFaculty}
//           />
//         )}
//       </main>

//       {/* 🌟 PROFILE MODAL */}
//       {selectedFaculty && (
//         <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6">
//           <div
//             className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-400 ease-out"
//             onClick={() => setSelectedFaculty(null)}
//           />

//           <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-400 ease-out z-70">
//             {/* Modal Header */}
//             <div className="h-28 bg-linear-to-r from-indigo-600 to-purple-600 relative flex items-start justify-between p-4">
//               <button
//                 onClick={() => handleOpenEdit(selectedFaculty)}
//                 className="w-9 h-9 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors backdrop-blur-md"
//               >
//                 <Edit2 size={18} />
//               </button>
//               <button
//                 onClick={() => setSelectedFaculty(null)}
//                 className="w-9 h-9 flex items-center justify-center bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
//               >
//                 <X size={18} />
//               </button>
//             </div>

//             {/* Modal Body */}
//             <div className="px-6 pb-8">
//               <div className="relative -mt-14 mb-4 flex justify-center">
//                 <div className="p-1.5 bg-white dark:bg-slate-900 rounded-full shadow-lg">
//                   <div className="w-24 h-24 rounded-full bg-linear-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-4xl font-bold text-indigo-600 dark:text-indigo-400">
//                     {selectedFaculty.teacher
//                       ?.replace("Dr. ", "")
//                       .replace("Prof. ", "")
//                       .charAt(0) || "F"}
//                   </div>
//                 </div>
//               </div>

//               <div className="text-center mb-6">
//                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
//                   {selectedFaculty.teacher}
//                 </h2>
//                 <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm mt-1 uppercase tracking-wider">
//                   {selectedFaculty.id}
//                 </p>
//                 <span className="inline-block mt-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium">
//                   {selectedFaculty.qualification ||
//                     "Qualification Not Specified"}
//                 </span>
//               </div>

//               <div className="space-y-3">
//                 <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
//                   <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm text-indigo-500 shrink-0">
//                     <Briefcase size={18} />
//                   </div>
//                   <div className="min-w-0">
//                     <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
//                       Department / Branch
//                     </p>
//                     <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
//                       {selectedFaculty.specialization}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
//                   <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm text-purple-500 shrink-0">
//                     <Mail size={18} />
//                   </div>
//                   <div className="min-w-0">
//                     <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
//                       Email Address
//                     </p>
//                     <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
//                       {selectedFaculty.email || "N/A"}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/60">
//                   <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm text-green-500 shrink-0">
//                     <Phone size={18} />
//                   </div>
//                   <div className="min-w-0">
//                     <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
//                       Extension No.
//                     </p>
//                     <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">
//                       {selectedFaculty.extensionNo || "N/A"}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="mt-8 grid grid-cols-2 gap-3">
//                 <button
//                   onClick={() =>
//                     selectedFaculty.email
//                       ? (window.location.href = `mailto:${selectedFaculty.email}`)
//                       : null
//                   }
//                   className={`flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-md ${
//                     selectedFaculty.email
//                       ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none"
//                       : "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none"
//                   }`}
//                 >
//                   <Mail size={16} /> Send Email
//                 </button>
//                 <button className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold py-3 px-4 rounded-xl text-sm transition-all">
//                   <MapPin size={16} /> Locate Room
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* 📝 ADD/EDIT FORM MODAL */}
//       {isFormOpen && (
//         <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
//           <div
//             className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
//             onClick={() => setIsFormOpen(false)}
//           />
//           <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-4xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300 z-90">
//             <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
//               <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
//                 {isEditing ? (
//                   <Edit2 size={20} className="text-indigo-500" />
//                 ) : (
//                   <Plus size={20} className="text-indigo-500" />
//                 )}
//                 {isEditing ? "Edit Faculty" : "Add Faculty"}
//               </h2>
//               <button
//                 onClick={() => setIsFormOpen(false)}
//                 className="text-slate-400 hover:text-slate-600"
//               >
//                 <X size={20} />
//               </button>
//             </div>
//             <form onSubmit={handleSaveTeacher} className="p-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
//                 <div className="space-y-1 md:col-span-2">
//                   <label className="text-xs font-semibold uppercase text-slate-500">
//                     Faculty ID
//                   </label>
//                   <input
//                     required
//                     name="id"
//                     value={formData.id}
//                     onChange={handleInputChange}
//                     disabled={isEditing}
//                     placeholder="e.g. F-101"
//                     className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
//                   />
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-xs font-semibold uppercase text-slate-500">
//                     Full Name
//                   </label>
//                   <input
//                     required
//                     name="teacher"
//                     value={formData.teacher}
//                     onChange={handleInputChange}
//                     placeholder="Dr. John Doe"
//                     className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
//                   />
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-xs font-semibold uppercase text-slate-500">
//                     Qualification
//                   </label>
//                   <input
//                     name="qualification"
//                     value={formData.qualification}
//                     onChange={handleInputChange}
//                     placeholder="Ph.D."
//                     className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
//                   />
//                 </div>
//                 <div className="space-y-1 md:col-span-2">
//                   <label className="text-xs font-semibold uppercase text-slate-500">
//                     Department
//                   </label>
//                   <input
//                     name="specialization"
//                     value={formData.specialization}
//                     onChange={handleInputChange}
//                     placeholder="e.g. Software Eng."
//                     className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
//                   />
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-xs font-semibold uppercase text-slate-500">
//                     Email
//                   </label>
//                   <input
//                     type="email"
//                     name="email"
//                     value={formData.email}
//                     onChange={handleInputChange}
//                     placeholder="john@uni.edu"
//                     className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
//                   />
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-xs font-semibold uppercase text-slate-500">
//                     Extension
//                   </label>
//                   <input
//                     name="extensionNo"
//                     value={formData.extensionNo}
//                     onChange={handleInputChange}
//                     placeholder="4042"
//                     className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
//                   />
//                 </div>
//               </div>
//               <div className="flex gap-3 pt-2 mt-4">
//                 <button
//                   type="button"
//                   onClick={() => setIsFormOpen(false)}
//                   className="flex-1 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="flex-1 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2"
//                 >
//                   <Save size={18} /> {isEditing ? "Save" : "Add"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default FacultyDirectory;

