import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  Shield,
  Server,
  Sparkles,
  ArrowLeft,
  Building2,
  Mail,
  Zap,
  Cpu,
  ShieldCheck,
  Globe,
  Bell,
  ExternalLink,
  Fingerprint,
  Database,
  BarChart3,
  MessageSquare,
  Upload,
} from "lucide-react";

const DocumentationPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const sections = {
    overview: { title: "Introduction", icon: <BookOpen size={18} /> },
    admin: { title: "Admin Workflow", icon: <Shield size={18} /> },
    faculty: { title: "Faculty Experience", icon: <Users size={18} /> },
    student: { title: "Student Access", icon: <GraduationCap size={18} /> },
    technical: { title: "Architecture", icon: <Server size={18} /> },
  };

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Scrollbar CSS */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 1. HEADER (Fixed Height) */}
      <nav className="flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16">
        <div className="w-full mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button




              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                N
              </div>
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Documentation
              </span>
            </div>
          </div>
          <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-100 dark:border-blue-800">
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest italic">
              v1.0.0 Stable
            </span>
          </div>
        </div>
      </nav>

      {/* 2. MAIN CONTENT AREA (Scrollable, No Scrollbar) */}
      <div className="flex-grow overflow-y-auto no-scrollbar">
        <div className="w-full mx-auto px-4 py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar Navigation */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="lg:sticky lg:top-0 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-3">
                  Sections
                </p>
                {Object.entries(sections).map(([id, { icon, title }]) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                      activeTab === id
                        ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20"
                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    {icon}
                    {title}
                  </button>
                ))}
              </div>
            </aside>

            {/* Content Content Content */}
            <main className="flex-1 max-w-4xl pb-10">
              {/* INTRODUCTION */}
              {activeTab === "overview" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-12 text-white relative overflow-hidden mb-12 shadow-2xl">
                    <h1 className="text-5xl font-black mb-6 tracking-tight relative z-10">
                      Modernizing <br /> Campus Schedules.
                    </h1>
                    <p className="text-xl text-blue-100 max-w-xl relative z-10 leading-relaxed">
                      Chromex is an end-to-end ecosystem that bridges the gap
                      between academic planning and student execution.
                    </p>
                    <Sparkles className="absolute -right-10 -bottom-10 w-64 h-64 text-blue-400/20 rotate-12" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                        <Globe />
                      </div>
                      <h3 className="text-xl font-bold mb-3">
                        Institutional Sync
                      </h3>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        Centralized database management ensures that room
                        bookings or faculty leaves are reflected instantly.
                      </p>
                    </div>
                    <div className="p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                        <ShieldCheck />
                      </div>
                      <h3 className="text-xl font-bold mb-3">
                        Domain Security
                      </h3>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        Authentication limited to institutional emails, keeping
                        internal schedules private.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN DETAIL */}
              {activeTab === "admin" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                  <h1 className="text-4xl font-black mb-4">
                    Admin: System Architecture
                  </h1>
                  <p className="text-lg text-slate-500 leading-relaxed">
                    The portal serves as the single source of truth for all
                    institutional metadata.
                  </p>
                  <div className="space-y-4">
                    {[
                      {
                        title: "Department Mapping",
                        icon: <Building2 />,
                        desc: "Create departments and link HODs to specific courses.",
                      },
                      {
                        title: "Faculty Onboarding",
                        icon: <Mail />,
                        desc: "Trigger secure email invitations for teachers to join.",
                      },
                      {
                        title: "Constraint Management",
                        icon: <Fingerprint />,
                        desc: "Define working hours, lunch breaks, and workload caps.",
                      },
                      {
                        title: "Algorithm Logic",
                        icon: <Zap />,
                        desc: "Trigger conflict-checking and generate final schedules.",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-6 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-400 transition-colors"
                      >
                        <div className="text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{item.title}</h4>
                          <p className="text-sm text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FACULTY DETAIL */}
              {activeTab === "faculty" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                  <h1 className="text-4xl font-black mb-4">
                    Faculty: Personal Workspace
                  </h1>
                  <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Users size={120} />
                    </div>
                    {[
                      {
                        step: "Verification",
                        text: "Join via secure institutional link sent to your ID.",
                        icon: "1",
                      },
                      {
                        step: "Personalization",
                        text: "Input preferred time slots and elective subject choices.",
                        icon: "2",
                      },
                      {
                        step: "Collaboration",
                        text: "Directly request class swaps with available peers.",
                        icon: "3",
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="flex gap-4 relative z-10">
                        <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-1">
                            {item.step}
                          </h3>
                          <p className="text-slate-400 text-sm">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STUDENT DETAIL */}
              {activeTab === "student" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                  <h1 className="text-4xl font-black tracking-tight">
                    Student Experience
                  </h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 bg-emerald-50 dark:bg-emerald-950/20 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/40">
                      <Calendar size={32} className="text-emerald-600 mb-4" />
                      <h4 className="font-bold text-xl mb-2 text-emerald-800 dark:text-emerald-300">
                        Smart View
                      </h4>
                      <p className="text-sm text-emerald-700/70 dark:text-emerald-400/70">
                        Automatically detects your Batch/Semester. No
                        configuration needed.
                      </p>
                    </div>
                    <div className="p-8 bg-amber-50 dark:bg-amber-950/20 rounded-[2.5rem] border border-amber-100 dark:border-amber-900/40">
                      <Bell size={32} className="text-amber-600 mb-4" />
                      <h4 className="font-bold text-xl mb-2 text-amber-800 dark:text-amber-300">
                        Live Notices
                      </h4>
                      <p className="text-sm text-amber-700/70 dark:text-amber-400/70">
                        Push notifications for room changes or faculty leave
                        updates.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TECHNICAL DETAIL */}
              {activeTab === "technical" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                  <h1 className="text-4xl font-black tracking-tight">
                    Architecture
                  </h1>
                  <div className="p-8 bg-slate-950 rounded-[2rem] text-blue-400 font-mono text-sm leading-relaxed border border-slate-800">
                    <p className="text-slate-500 mb-4">
                      // System Architecture v1.0
                    </p>
                    <p>
                      <span className="text-indigo-400">const</span> stack ={" "}
                      {"{"}
                    </p>
                    <p className="ml-6">
                      "Frontend": "React + Tailwind + Framer",
                    </p>
                    <p className="ml-6">"Auth": "JWT + Domain-Restricted",</p>
                    <p className="ml-6">
                      "Engine": "Genetic Optimization / CSP",
                    </p>
                    <p className="ml-6">
                      "Database": "MongoDB Aggregation Pipeline"
                    </p>
                    <p>{"}"}</p>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* 3. FOOTER (Strictly Fixed 20px Height) */}
      <footer className="flex-shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 h-[50px] flex items-center">
        <div className=" mx-auto px-4 w-full flex justify-between items-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
            © 2024 CHROMEX INSTITUTIONAL SYSTEMS • ALL RIGHTS RESERVED
          </p>
          <div className="flex gap-4 items-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              SUPPORT <ExternalLink size={8} />
            </span>
            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">
              v1.0.0 STABLE
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DocumentationPage;
