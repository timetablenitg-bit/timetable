import React, { useMemo, useEffect } from "react";
import useAdminStore from "../../store/admin/index";
import CustomLoader from "../../ui/CustomLoader";
import {
  Users,
  Building,
  GraduationCap,
  Loader2,
  AlertCircle,
  Award,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const OverviewFacultyData = () => {
  const { faculties, isLoading, error, fetchFaculties } = useAdminStore();

  useEffect(() => {
    if (faculties.length === 0) {
      fetchFaculties();
    }
  }, [fetchFaculties, faculties.length]);

  // --- 1. BASIC AGGREGATIONS ---
  const stats = useMemo(() => {
    const totalFaculty = faculties.length;
    const uniqueDepartments = new Set(faculties.map((f) => f.department)).size;
    const phdHolders = faculties.filter((f) =>
      /ph\.?d/i.test(f.qualification),
    ).length;
    return { totalFaculty, uniqueDepartments, phdHolders };
  }, [faculties]);

  const departmentData = useMemo(() => {
    const counts = faculties.reduce((acc, curr) => {
      const dept = curr.department || "Unknown";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [faculties]);

  const designationData = useMemo(() => {
    const counts = faculties.reduce((acc, curr) => {
      const desig = curr.designation || "Unknown";
      acc[desig] = (acc[desig] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [faculties]);

  // --- 2. ADVANCED DEGREE CLASSIFICATION ---
  const qualificationData = useMemo(() => {
    const counts = {
      "B.Tech / B.E. Only": 0,
      "M.Tech / M.E. Only": 0,
      "Ph.D. Only": 0,
      "Dual: B.Tech + M.Tech": 0,
      "Dual: M.Tech + Ph.D.": 0,
      "Triple: B.Tech + M.Tech + Ph.D.": 0,
      "Other Qualifications": 0,
    };

    faculties.forEach((f) => {
      const q = (f.qualification || "").toLowerCase();

      // Regex to smartly catch different formats (e.g., B.Tech, BTech, B.E., M.E., Ph.D, PhD)
      const hasB = /b\.?tech|b\.?e\.?/i.test(q);
      const hasM = /m\.?tech|m\.?e\.?/i.test(q);
      const hasP = /ph\.?d/i.test(q);

      if (hasB && hasM && hasP) counts["Triple: B.Tech + M.Tech + Ph.D."]++;
      else if (hasB && hasM && !hasP) counts["Dual: B.Tech + M.Tech"]++;
      else if (!hasB && hasM && hasP) counts["Dual: M.Tech + Ph.D."]++;
      else if (hasB && !hasM && hasP)
        counts["Other Qualifications"]++; // Edge case (Btech + PhD without Masters)
      else if (hasB && !hasM && !hasP) counts["B.Tech / B.E. Only"]++;
      else if (!hasB && hasM && !hasP) counts["M.Tech / M.E. Only"]++;
      else if (!hasB && !hasM && hasP) counts["Ph.D. Only"]++;
      else counts["Other Qualifications"]++;
    });

    // Filter out categories with 0 to keep the chart clean, then sort descending
    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [faculties]);

  const COLORS = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f43f5e",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
  ];

  // --- LOADING & ERROR UI ---
  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center text-slate-500 dark:text-slate-400">
        <CustomLoader variant="green" />
        <p className="text-base font-medium animate-pulse">
          Analyzing faculty data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center text-slate-500 dark:text-slate-400">
        <AlertCircle size={40} className="mb-4 text-rose-500" />
        <p className="text-base font-medium text-slate-900 dark:text-white">
          Failed to load analytics
        </p>
        <button
          onClick={fetchFaculties}
          className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (faculties.length === 0) return null;

  return (
    <div className="flex-1 h-full w-full overflow-y-auto pr-2 pb-4 space-y-4 scrollbar-hide">
      {/* ROW 1: TOP STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Faculty
            </p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {stats.totalFaculty}
            </h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
            <Building size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Departments
            </p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {stats.uniqueDepartments}
            </h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
            <GraduationCap size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ph.D. Holders
            </p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {stats.phdHolders}
            </h3>
          </div>
        </div>
      </div>

      {/* ROW 2: GENERAL CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Designation Bar Chart */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-64">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Faculty by Designation
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={designationData}
                margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#334155"
                  opacity={0.2}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) =>
                    val.length > 10 ? val.substring(0, 10) + "..." : val
                  }
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#6366f1", opacity: 0.1 }}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#6366f1"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Pie Chart */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-64">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Department Distribution
          </h3>
          <div className="flex-1 w-full min-h-0 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {departmentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 max-w-30">
              {departmentData.slice(0, 5).map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></span>
                  <span className="truncate" title={entry.name}>
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: DEGREE CLASSIFICATION (Numerical + Graphical) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
          <Award size={18} className="text-purple-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Degree Classification Breakdown
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-700">
          {/* Numerical Format (Left Side) */}
          <div className="p-4 lg:col-span-1 flex flex-col justify-center gap-3 bg-white dark:bg-slate-800">
            {qualificationData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {item.name}
                </span>
                <span className="text-xs font-bold px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md">
                  {item.value} {item.value === 1 ? "Teacher" : "Teachers"}
                </span>
              </div>
            ))}
          </div>

          {/* Graphical Format (Right Side - Horizontal Bar Chart) */}
          <div className="p-4 lg:col-span-2 h-56 flex flex-col bg-white dark:bg-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              {/* layout="vertical" flips the chart so long degree names fit perfectly on the Y-Axis */}
              <BarChart
                layout="vertical"
                data={qualificationData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#334155"
                  opacity={0.2}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  tick={{ fill: "#64748b", fontSize: 10, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#8b5cf6", opacity: 0.1 }}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#8b5cf6"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewFacultyData;
