import React, { useEffect, useMemo } from "react";
import {
  Users,
  BookOpen,
  Layers,
  GraduationCap,
  DoorOpen,
  CalendarDays,
  TrendingUp,
  FlaskConical,
  BookMarked,
  Sparkles,
  Mail,
  CheckCircle2,
  Clock,
  BarChart3,
  Building2,
} from "lucide-react";
import useAdminStore from "../../store/useAdminStore";

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
  label,
  value,
  sub,
  icon: Icon,
  accent = "emerald",
  loading,
}) => {
  const iconCls = {
    emerald:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800",
    blue: "bg-blue-50    dark:bg-blue-900/20    text-blue-600    dark:text-blue-400    border border-blue-100    dark:border-blue-800",
    amber:
      "bg-amber-50   dark:bg-amber-900/20   text-amber-600   dark:text-amber-400   border border-amber-100   dark:border-amber-800",
    violet:
      "bg-violet-50  dark:bg-violet-900/20  text-violet-600  dark:text-violet-400  border border-violet-100  dark:border-violet-800",
    sky: "bg-sky-50     dark:bg-sky-900/20     text-sky-600     dark:text-sky-400     border border-sky-100     dark:border-sky-800",
  };
  const valCls = {
    emerald: "text-emerald-700 dark:text-emerald-300",
    blue: "text-blue-700    dark:text-blue-300",
    amber: "text-amber-700   dark:text-amber-300",
    violet: "text-violet-700  dark:text-violet-300",
    sky: "text-sky-700     dark:text-sky-300",
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        <span className={`p-2 rounded-xl ${iconCls[accent]}`}>
          <Icon size={14} />
        </span>
      </div>

      {loading ? (
        <div className="h-8 w-14 bg-gray-100 dark:bg-slate-800 rounded-lg animate-pulse" />
      ) : (
        <span className={`text-3xl font-bold tracking-tight ${valCls[accent]}`}>
          {value ?? "—"}
        </span>
      )}

      {sub && (
        <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug">
          {sub}
        </p>
      )}
    </div>
  );
};

// ─── Panel wrapper ────────────────────────────────────────────────────────────
const Panel = ({ title, sub, children }) => (
  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 flex flex-col gap-4">
    <div>
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        {title}
      </h2>
      {sub && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>
      )}
    </div>
    {children}
  </div>
);

// ─── Dept horizontal bar ──────────────────────────────────────────────────────
const DeptBar = ({ dept, count, max }) => (
  <div className="flex items-center gap-3">
    <span className="w-9 text-[10px] font-semibold text-gray-500 dark:text-gray-400 shrink-0">
      {dept}
    </span>
    <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
        style={{ width: `${max > 0 ? Math.round((count / max) * 100) : 0}%` }}
      />
    </div>
    <span className="w-5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 text-right shrink-0">
      {count}
    </span>
  </div>
);

// ─── Invite status row ────────────────────────────────────────────────────────
const InviteRow = ({ icon: Icon, label, count, cls }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-slate-800 last:border-0">
    <span className={`p-1.5 rounded-lg ${cls}`}>
      <Icon size={13} />
    </span>
    <span className="flex-1 text-sm text-gray-600 dark:text-gray-300">
      {label}
    </span>
    <span
      className={`text-sm font-bold ${cls.split(" ")[0].replace("bg-", "text-").replace("-50", "-600").replace("/20", "")}`}
    >
      {count}
    </span>
  </div>
);

// ─── Session card ─────────────────────────────────────────────────────────────
const SessionCard = ({ session }) => {
  const active =
    session.is_active || session.status === "Active" || session.isActive;
  return (
    <div
      className={`flex items-center justify-between gap-3 p-3 rounded-xl border
      ${
        active
          ? "bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50"
          : "bg-gray-50 dark:bg-slate-800/40 border-gray-100 dark:border-slate-700"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`p-1.5 rounded-lg shrink-0 ${
            active
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              : "bg-gray-100 dark:bg-slate-700 text-gray-400"
          }`}
        >
          <CalendarDays size={13} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
            {session.academic_year || session.name || "—"}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
            {[
              session.term,
              session.type &&
                (session.type === "EVEN" ? "Even Sem" : "Odd Sem"),
            ]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {active && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        )}
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
          ${
            active
              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
              : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
          }`}
        >
          {active ? "Active" : "Closed"}
        </span>
      </div>
    </div>
  );
};

// ─── Course nature row ────────────────────────────────────────────────────────
const NatureRow = ({ label, count, textCls, bgCls, icon: Icon }) => (
  <div className="flex items-center gap-2 py-2.5 border-b border-gray-50 dark:border-slate-800 last:border-0">
    <span className={`p-1.5 rounded-lg ${bgCls}`}>
      <Icon size={12} className={textCls} />
    </span>
    <span className="flex-1 text-xs text-gray-600 dark:text-gray-300">
      {label}
    </span>
    <span className={`text-xs font-bold ${textCls}`}>{count}</span>
  </div>
);

// ─── Sem bar chip ─────────────────────────────────────────────────────────────
const SemChip = ({ sem, count }) => (
  <div className="flex flex-col items-end gap-1" style={{ height: 80 }}>
    <div className="w-full flex-1 bg-gray-100 dark:bg-slate-800 rounded-md overflow-hidden flex items-end">
      <div
        className="w-full bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-md transition-all duration-700"
        style={{
          height: `${count > 0 ? Math.max(12, (count / 12) * 100) : 0}%`,
        }}
      />
    </div>
    <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 self-center">
      S{sem}
    </span>
    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 self-center">
      {count}
    </span>
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────
const Empty = ({ icon: Icon, label }) => (
  <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-200 dark:text-gray-700">
    <Icon size={26} />
    <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
  </div>
);

// ─── AdminOverview ────────────────────────────────────────────────────────────
const AdminOverview = () => {
  const {
    faculties,
    courses,
    batches,
    academicSessions,
    rooms,
    isLoading,
    fetchFaculties,
    fetchCourses,
    fetchBatches,
    fetchAcademicSessions,
  } = useAdminStore();

  useEffect(() => {
    fetchFaculties();
    fetchCourses();
    fetchBatches();
    fetchAcademicSessions();
  }, []);

  // Faculty invite counts
  const inviteStats = useMemo(
    () => ({
      accepted: faculties.filter((f) => f.invite_status === "accepted").length,
      pending: faculties.filter((f) => f.invite_status === "pending").length,
      uninvited: faculties.filter(
        (f) => !f.invite_status || f.invite_status === "uninvited",
      ).length,
    }),
    [faculties],
  );

  // Faculty by dept
  const facultyByDept = useMemo(() => {
    const m = {};
    faculties.forEach((f) => {
      const d = f.department || "Other";
      m[d] = (m[d] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [faculties]);
  const maxFDept = Math.max(...facultyByDept.map(([, c]) => c), 1);

  // Course nature
  const nat = useMemo(() => {
    const m = { CORE: 0, MINOR: 0, ELECTIVE: 0, PROJECT: 0, SEMINAR: 0 };
    courses.forEach((c) => {
      if (c.nature in m) m[c.nature]++;
    });
    return m;
  }, [courses]);

  const theoryCount = courses.filter(
    (c) => c.course_type === "THEORY" || !c.course_type,
  ).length;
  const labCount = courses.filter((c) => c.course_type === "LAB").length;

  // Batches by semester
  const batchBySem = useMemo(() => {
    const m = {};
    batches.forEach((b) => {
      const s = b.semester ?? "?";
      m[s] = (m[s] || 0) + 1;
    });
    return m;
  }, [batches]);

  // Batches by dept
  const batchByDept = useMemo(() => {
    const m = {};
    batches.forEach((b) => {
      const d = b.department || "Other";
      m[d] = (m[d] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [batches]);
  const maxBDept = Math.max(...batchByDept.map(([, c]) => c), 1);

  const activeSessions = academicSessions.filter(
    (s) => s.is_active || s.status === "Active" || s.isActive,
  );

  return (
    <div className="w-full flex flex-col gap-6">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
            <BarChart3
              size={14}
              className="text-emerald-600 dark:text-emerald-400"
            />
          </div>
          <h1 className="text-base font-bold text-gray-800 dark:text-white">
            Overview
          </h1>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          {activeSessions.length > 0
            ? ` · ${activeSessions.length} active session${activeSessions.length > 1 ? "s" : ""}`
            : " · No active sessions"}
        </p>
      </div>

      {/* ── Stat row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Faculties"
          value={faculties.length}
          sub={`${inviteStats.accepted} accepted · ${inviteStats.pending} pending`}
          icon={Users}
          accent="emerald"
          loading={isLoading}
        />
        <StatCard
          label="Courses"
          value={courses.length}
          sub={`${theoryCount} theory · ${labCount} lab`}
          icon={BookOpen}
          accent="blue"
          loading={isLoading}
        />
        <StatCard
          label="Batches"
          value={batches.length}
          sub={`${Object.keys(batchBySem).length} semester${Object.keys(batchBySem).length !== 1 ? "s" : ""}`}
          icon={Layers}
          accent="violet"
          loading={isLoading}
        />
        <StatCard
          label="Sessions"
          value={academicSessions.length}
          sub={`${activeSessions.length} active`}
          icon={CalendarDays}
          accent="amber"
          loading={isLoading}
        />
        <StatCard
          label="Rooms"
          value={rooms?.length ?? "—"}
          sub="registered venues"
          icon={DoorOpen}
          accent="sky"
          loading={isLoading}
        />
      </div>

      {/* ── Middle row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Sessions */}
        <Panel
          title="Academic Sessions"
          sub={`${academicSessions.length} total · ${activeSessions.length} active`}
        >
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : academicSessions.length === 0 ? (
            <Empty icon={CalendarDays} label="No sessions yet" />
          ) : (
            <div className="space-y-2">
              {academicSessions.slice(0, 4).map((s) => (
                <SessionCard key={s._id} session={s} />
              ))}
              {academicSessions.length > 4 && (
                <p className="text-[11px] text-center text-gray-400 dark:text-gray-500 pt-1">
                  +{academicSessions.length - 4} more
                </p>
              )}
            </div>
          )}
        </Panel>

        {/* Faculty */}
        <Panel title="Faculty" sub="Invite status & department spread">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
              Invite Status
            </p>
            <InviteRow
              icon={CheckCircle2}
              label="Accepted"
              count={inviteStats.accepted}
              cls="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
            />
            <InviteRow
              icon={Clock}
              label="Pending"
              count={inviteStats.pending}
              cls="bg-amber-50   dark:bg-amber-900/20   text-amber-600   dark:text-amber-400"
            />
            <InviteRow
              icon={Mail}
              label="Uninvited"
              count={inviteStats.uninvited}
              cls="bg-gray-100   dark:bg-slate-800      text-gray-500    dark:text-gray-400"
            />
          </div>

          {facultyByDept.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                By Department
              </p>
              <div className="space-y-2">
                {facultyByDept.slice(0, 6).map(([dept, count]) => (
                  <DeptBar
                    key={dept}
                    dept={dept}
                    count={count}
                    max={maxFDept}
                  />
                ))}
              </div>
            </div>
          )}
        </Panel>

        {/* Courses */}
        <Panel title="Courses" sub="By nature & type">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
              Nature
            </p>
            <NatureRow
              label="Core"
              count={nat.CORE}
              textCls="text-blue-600 dark:text-blue-400"
              bgCls="bg-blue-50 dark:bg-blue-900/20"
              icon={BookOpen}
            />
            <NatureRow
              label="Minor"
              count={nat.MINOR}
              textCls="text-violet-600 dark:text-violet-400"
              bgCls="bg-violet-50 dark:bg-violet-900/20"
              icon={BookMarked}
            />
            <NatureRow
              label="Elective"
              count={nat.ELECTIVE}
              textCls="text-amber-600 dark:text-amber-400"
              bgCls="bg-amber-50 dark:bg-amber-900/20"
              icon={Sparkles}
            />
            <NatureRow
              label="Project"
              count={nat.PROJECT}
              textCls="text-emerald-600 dark:text-emerald-400"
              bgCls="bg-emerald-50 dark:bg-emerald-900/20"
              icon={TrendingUp}
            />
            <NatureRow
              label="Seminar"
              count={nat.SEMINAR}
              textCls="text-rose-600 dark:text-rose-400"
              bgCls="bg-rose-50 dark:bg-rose-900/20"
              icon={GraduationCap}
            />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Type
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center gap-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-xl py-3">
                <BookOpen
                  size={15}
                  className="text-blue-500 dark:text-blue-400"
                />
                <span className="text-xl font-bold text-blue-600 dark:text-blue-300">
                  {theoryCount}
                </span>
                <span className="text-[10px] font-medium text-blue-400 dark:text-blue-500">
                  Theory
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/40 rounded-xl py-3">
                <FlaskConical
                  size={15}
                  className="text-violet-500 dark:text-violet-400"
                />
                <span className="text-xl font-bold text-violet-600 dark:text-violet-300">
                  {labCount}
                </span>
                <span className="text-[10px] font-medium text-violet-400 dark:text-violet-500">
                  Lab
                </span>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* ── Bottom row: Batches ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Semester mini bar chart */}
        <Panel title="Batch Distribution" sub="Grouped by semester">
          {batches.length === 0 ? (
            <Empty icon={Layers} label="No batches yet" />
          ) : (
            <div className="grid grid-cols-8 gap-1.5">
              {Array.from({ length: 8 }, (_, i) => (
                <SemChip
                  key={i + 1}
                  sem={i + 1}
                  count={batchBySem[i + 1] ?? 0}
                />
              ))}
            </div>
          )}
        </Panel>

        {/* Dept bars */}
        <Panel
          title="Batches by Department"
          sub={`${batches.length} total batches`}
        >
          {batchByDept.length === 0 ? (
            <Empty icon={Building2} label="No data yet" />
          ) : (
            <div className="space-y-2.5">
              {batchByDept.map(([dept, count]) => (
                <DeptBar key={dept} dept={dept} count={count} max={maxBDept} />
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default AdminOverview;
