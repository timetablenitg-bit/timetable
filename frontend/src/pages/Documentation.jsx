// Documentation.jsx
// Admin guide page — mounted at /doc, linked from the navbar.
//
// Usage in your router:
//   import Documentation from "./pages/Documentation";
//   <Route path="/doc" element={<Documentation />} />
//
// Content lives in ./docsContent.js — edit that file to add/change sections,
// including the Rules & Policies list, without touching this component.
// Illustrated previews live in ./docVisuals.jsx:
//   - VISUALS       → one big preview per top-level section (rendered under
//                      the section header)
//   - STEP_VISUALS  → one small preview per individual step inside a
//                      section's "How to use it" walkthrough, keyed by the
//                      optional `visual` field on that step in docsContent.js

import React, { useState, useMemo } from "react";
import {
  Menu,
  X,
  Search,
  ChevronRight,
  Compass,
  LayoutDashboard,
  CalendarDays,
  Table,
  Users,
  BookOpen,
  Layers,
  MessageSquare,
  ClipboardList,
  ShieldCheck,
  Info,
  Lightbulb,
} from "lucide-react";
import Navbaar from "../components/Navbaar";
import { docSections } from "./docsContent";
import { VISUALS, STEP_VISUALS } from "./Docvisuals";

// Map icon name strings (from docsContent.js) to actual components
const ICONS = {
  Compass,
  LayoutDashboard,
  CalendarDays,
  Table,
  Users,
  BookOpen,
  Layers,
  MessageSquare,
  ClipboardList,
  ShieldCheck,
};

const Documentation = () => {
  const [activeId, setActiveId] = useState(docSections[0]?.id);
  const [query, setQuery] = useState("");
  const [openSidebar, setOpenSidebar] = useState(false);

  const filteredSections = useMemo(() => {
    if (!query.trim()) return docSections;
    const q = query.toLowerCase();
    return docSections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q),
    );
  }, [query]);

  const active = docSections.find((s) => s.id === activeId) || docSections[0];
  const ActiveIcon = ICONS[active?.icon] || Info;
  const VisualComponent = active?.visual ? VISUALS[active.visual] : null;

  const whatItDoesParagraphs = Array.isArray(active?.whatItDoes)
    ? active.whatItDoes
    : [active?.whatItDoes].filter(Boolean);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-[#020617] transition-colors duration-300">
      <Navbaar />

      {openSidebar && (
        <div
          onClick={() => setOpenSidebar(false)}
          className="fixed inset-0 bg-black/40 z-50 md:hidden"
        />
      )}

      <div className="flex flex-1 w-full overflow-hidden">
        {/* ================= SIDEBAR ================= */}
        <div
          className={`
            fixed md:static top-0 left-0 h-full w-80 lg:w-96
            bg-white dark:bg-slate-900
            border-r border-slate-200 dark:border-slate-800
            z-50 transform transition-transform duration-300
            ${openSidebar ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0 flex flex-col
            px-6 py-7
          `}
        >
          <div className="flex justify-end md:hidden mb-4">
            <X
              size={22}
              onClick={() => setOpenSidebar(false)}
              className="cursor-pointer text-slate-900 dark:text-white"
            />
          </div>

          <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 px-2">
            Admin Guide
          </h1>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5 px-2">
            Documentation
          </h2>

          {/* Search */}
          <div className="relative mb-4 px-2">
            <Search
              size={18}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics..."
              className="w-full pl-10 pr-4 py-3 text-base rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 border border-transparent focus:border-emerald-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto">
            {filteredSections.map((s) => {
              const Icon = ICONS[s.icon] || Info;
              const isActive = s.id === activeId;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveId(s.id);
                    setOpenSidebar(false);
                  }}
                  className={`
                    flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-medium text-left
                    transition-all duration-200 cursor-pointer
                    ${
                      isActive
                        ? "bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }
                  `}
                >
                  <Icon size={20} className="shrink-0" />
                  <span className="truncate">{s.title}</span>
                </button>
              );
            })}
            {filteredSections.length === 0 && (
              <p className="text-sm text-slate-400 px-3 py-4 text-center">
                No topics match "{query}"
              </p>
            )}
          </div>

          <div className="mt-auto pt-6 text-sm text-slate-400 px-2">
            Admin Dashboard v1.0
          </div>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-6 md:p-12">
            {active && (
              <div className="flex flex-col gap-8">
                {/* Header */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                      <ActiveIcon
                        size={24}
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">
                      {active.title}
                    </h1>
                  </div>
                  <p className="text-base md:text-lg text-slate-400 dark:text-slate-500">
                    {active.summary}
                  </p>
                </div>

                {/* Preview — illustrated mockup of the actual screen */}
                {VisualComponent && (
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                      Preview
                    </h2>
                    <VisualComponent />
                  </div>
                )}

                {/* What it does */}
                {whatItDoesParagraphs.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-7">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                      What it does
                    </h2>
                    <div className="flex flex-col gap-3">
                      {whatItDoesParagraphs.map((p, i) => (
                        <p
                          key={i}
                          className="text-base leading-relaxed text-slate-600 dark:text-slate-300"
                        >
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Steps */}
                {active.steps?.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-7">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-6">
                      How to use it
                    </h2>
                    <div className="flex flex-col">
                      {active.steps.map((step, i) => {
                        // Each step can optionally point at its own small,
                        // accurate mockup of the real screen for that step
                        // (see STEP_VISUALS in docVisuals.jsx). Falls back
                        // to text-only when a step has no visual key.
                        const StepVisual = step.visual
                          ? STEP_VISUALS[step.visual]
                          : null;
                        return (
                          <div key={i} className="flex gap-4 relative">
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold shrink-0">
                                {i + 1}
                              </div>
                              {i < active.steps.length - 1 && (
                                <div className="w-px flex-1 bg-slate-100 dark:bg-slate-800 my-1.5" />
                              )}
                            </div>
                            <div className="pb-7 flex-1 min-w-0">
                              <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
                                {step.title}
                              </p>
                              <p className="text-base text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                {step.detail}
                              </p>
                              {StepVisual && <StepVisual />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {active.notes?.length > 0 && (
                  <div className="bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-2xl p-7">
                    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-4">
                      <Lightbulb size={16} />
                      Good to know
                    </h2>
                    <ul className="flex flex-col gap-3">
                      {active.notes.map((note, i) => (
                        <li
                          key={i}
                          className="flex gap-2.5 text-base text-amber-700 dark:text-amber-300/90 leading-relaxed"
                        >
                          <ChevronRight size={18} className="shrink-0 mt-0.5" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rules (only Rules & Policies section populates this) */}
                {active.rules && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-7">
                    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                      <ShieldCheck size={16} />
                      Rules
                    </h2>
                    {active.rules.length === 0 ? (
                      <p className="text-base text-slate-400 dark:text-slate-500 italic">
                        No rules added yet.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-3">
                        {active.rules.map((rule, i) => (
                          <li
                            key={i}
                            className="flex gap-2.5 text-base text-slate-600 dark:text-slate-300 leading-relaxed"
                          >
                            <ChevronRight
                              size={18}
                              className="shrink-0 mt-0.5 text-emerald-500"
                            />
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile floating menu button */}
      <button
        onClick={() => setOpenSidebar(true)}
        className="md:hidden fixed bottom-6 right-6 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:scale-105 transition z-40"
      >
        <Menu size={24} />
      </button>
    </div>
  );
};

export default Documentation;
