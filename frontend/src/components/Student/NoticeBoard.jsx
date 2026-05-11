import React, { useState, useMemo } from "react";
import {
  Bell,
  Calendar,
  Search,
  Filter,
  Pin,
  ExternalLink,
  Clock,
  ChevronRight,
  LayoutGrid,
} from "lucide-react";

const NoticeBoard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = [
    "All",
    "Academic",
    "Examinations",
    "Events",
    "Placement",
    "General",
  ];

  const notices = [
    {
      id: 1,
      title: "End Semester Examination Schedule - Spring 2026",
      date: "May 12, 2026",
      category: "Examinations",
      isUrgent: true,
      author: "Dean of Academics",
      description:
        "Final schedule for all undergraduate and postgraduate programs has been released. Please check the portal for room assignments.",
    },
    {
      id: 2,
      title: "Annual Tech Fest 'Kshiti' Registration",
      date: "May 10, 2026",
      category: "Events",
      isUrgent: false,
      author: "Student Council",
      description:
        "Registrations are now open for all technical events and workshops. Early bird discounts available until May 15th.",
    },
    {
      id: 3,
      title: "Campus Recruitment Drive: Google Cloud",
      date: "May 08, 2026",
      category: "Placement",
      isUrgent: true,
      author: "Placement Cell",
      description:
        "Google Cloud is visiting for the Associate Engineer role. Eligibility: CGPA > 8.0. Mandatory pre-placement talk tomorrow.",
    },
    {
      id: 4,
      title: "Revised Hostel Timings & Mess Menu",
      date: "May 05, 2026",
      category: "General",
      isUrgent: false,
      author: "Chief Warden",
      description:
        "Updated mess timings and weekly menu changes are applicable starting from next Monday.",
    },
  ];

  // Fixed Functional Logic: Combined Filter and Search
  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      const matchesCategory =
        activeCategory === "All" || notice.category === activeCategory;
      const matchesSearch =
        notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* TOP HEADER: Stats, Search, and Category Filters */}
        <header className="bg-white dark:bg-slate-900 rounded-[0.5rem] shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
            {/* Quick Stats */}
            <div className="flex items-center gap-4 bg-indigo-50 dark:bg-indigo-950/30 px-6 py-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
              <div className="p-2 bg-indigo-600 rounded-lg text-white">
                <Bell size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600/60 dark:text-indigo-400/60">
                  Live Updates
                </p>
                <h2 className="text-xl font-black text-indigo-950 dark:text-indigo-100">
                  {notices.length} Active
                </h2>
              </div>
            </div>

            {/* Functional Search Bar */}
            <div className="relative w-full md:w-96">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or content..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <div className="flex items-center gap-2 text-slate-400 mr-2">
              <Filter size={16} />
              <span className="text-xs font-bold uppercase tracking-tight">
                Filter:
              </span>
            </div>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeCategory === cat
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        {/* LISTED NOTICES SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 mb-2">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <LayoutGrid size={14} /> Recent Announcements
            </h3>
            <span className="text-[10px] font-bold text-slate-400 italic">
              Showing {filteredNotices.length} results
            </span>
          </div>

          {filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className="group bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-lg flex flex-col md:flex-row md:items-center gap-6 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
            >
              {/* Left Side: Date Box */}
              <div className="flex flex-row md:flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 min-w-[100px]">
                <Calendar
                  size={18}
                  className="text-indigo-600 mb-1 hidden md:block"
                />
                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                  {notice.date.split(",")[0]}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {notice.date.split(",")[1]}
                </span>
              </div>

              {/* Middle: Content */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3 mb-1">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                      notice.isUrgent
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                    }`}
                  >
                    {notice.category}
                  </span>
                  {notice.isUrgent && (
                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                  {notice.title}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                  Posted by{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {notice.author}
                  </span>
                </p>
              </div>

              {/* Right Side: Action */}
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer">
                  View Notice <ExternalLink size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredNotices.length === 0 && (
            <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-slate-800">
              <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                No notices found
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                Try adjusting your search or category filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
                className="mt-6 text-indigo-600 text-sm font-black uppercase tracking-widest hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoticeBoard;
