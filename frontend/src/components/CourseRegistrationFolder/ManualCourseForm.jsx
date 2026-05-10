import React, { useState } from "react";
import {
  Plus,
  Hash,
  BookOpen,
  Layers,
  MousePointer2,
  GraduationCap,
  Activity,
} from "lucide-react";
import CustomDropdown from "../../ui/CustomDropdown";

const ManualCourseForm = ({ onAdd }) => {
  const [form, setForm] = useState({
    code: "",
    name: "",
    credits: 3,
    type: "Theory",
    nature: "ELECTIVE",
    L: 3,
    T: 0,
    P: 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.code || !form.name) return;

    // Now sending L, T, P from state instead of hardcoded values
    onAdd({ ...form, branch: "CUSTOM", semester: "N/A" });

    setForm({
      code: "",
      name: "",
      credits: 3,
      type: "Theory",
      nature: "ELECTIVE",
      L: 3,
      T: 0,
      P: 0,
    });
  };

  const natureOptions = ["CORE", "ELECTIVE", "BACKLOG"];
  const typeOptions = ["Theory", "Lab", "Project"];

  const fieldClass =
    "flex items-center gap-3 px-4 h-[56px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all duration-300 shadow-sm";

  const inputClass =
    "bg-transparent border-none outline-none text-sm font-semibold w-full text-slate-800 dark:text-white placeholder:text-slate-400 placeholder:font-normal";

  const labelClass =
    "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-2 mb-1.5 flex items-center gap-1.5";

  return (
    <form onSubmit={handleSubmit} className="p-1">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
        {/* Row 1: Identification */}
        <div className="md:col-span-3 space-y-1">
          <label className={labelClass}>
            <Hash size={12} /> Subject Code
          </label>
          <div className={fieldClass}>
            <input
              placeholder="e.g. CSE302"
              className={inputClass}
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
            />
          </div>
        </div>

        <div className="md:col-span-3 space-y-1">
          <label className={labelClass}>
            <BookOpen size={12} /> Course Name
          </label>
          <div className={fieldClass}>
            <input
              placeholder="e.g. Advanced Algorithms"
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
        </div>

        {/* Row 2: Metadata */}
        <div className="md:col-span-3 space-y-1">
          <label className={labelClass}>
            <Layers size={12} /> Nature
          </label>
          <CustomDropdown
            options={natureOptions}
            value={form.nature}
            onChange={(val) => setForm({ ...form, nature: val })}
          />
        </div>

        <div className="md:col-span-3 space-y-1">
          <label className={labelClass}>
            <MousePointer2 size={12} /> Type
          </label>
          <CustomDropdown
            options={typeOptions}
            value={form.type}
            onChange={(val) => setForm({ ...form, type: val })}
          />
        </div>

        {/* Row 3: Credits and LTP (Numerical Inputs) */}
        <div className="md:col-span-3 space-y-1">
          <label className={labelClass}>
            <GraduationCap size={12} /> Credits
          </label>
          <div className={fieldClass}>
            <input
              type="number"
              min="0"
              max="20"
              placeholder="3"
              className={inputClass}
              value={form.credits}
              onChange={(e) =>
                setForm({ ...form, credits: parseInt(e.target.value) || 0 })
              }
            />
          </div>
        </div>

        {/* L-T-P Inputs sharing a row */}
        <div className="md:col-span-3 grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className={labelClass} title="Lecture">
              L
            </label>
            <div className={fieldClass}>
              <input
                type="number"
                min="0"
                className={`${inputClass} text-center`}
                value={form.L}
                onChange={(e) =>
                  setForm({ ...form, L: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelClass} title="Tutorial">
              T
            </label>
            <div className={fieldClass}>
              <input
                type="number"
                min="0"
                className={`${inputClass} text-center`}
                value={form.T}
                onChange={(e) =>
                  setForm({ ...form, T: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelClass} title="Practical">
              P
            </label>
            <div className={fieldClass}>
              <input
                type="number"
                min="0"
                className={`${inputClass} text-center`}
                value={form.P}
                onChange={(e) =>
                  setForm({ ...form, P: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="md:col-span-6 pt-2">
          <button
            type="submit"
            className="cursor-pointer w-full h-[56px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/25 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <Plus size={20} strokeWidth={3} />
            Add Subject to Registration
          </button>
        </div>
      </div>
    </form>
  );
};

export default ManualCourseForm;
