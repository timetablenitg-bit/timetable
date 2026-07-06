import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import useAdminStore from "../../../store/useAdminStore";

const CourseRegistrationTab = ({ session }) => {
  const { fetchRegistrationOverview } = useAdminStore();
  const [batches, setBatches] = useState([]);
  const [openBatches, setOpenBatches] = useState({});
  const [openStudents, setOpenStudents] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchRegistrationOverview(session._id);
      setBatches(data || []);
      setLoading(false);
    };
    load();
  }, [session._id]);

  const toggleBatch = (batchId) =>
    setOpenBatches((prev) => ({ ...prev, [batchId]: !prev[batchId] }));

  const toggleStudent = (studentId) =>
    setOpenStudents((prev) => ({ ...prev, [studentId]: !prev[studentId] }));

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-gray-400">
        Loading registration data…
      </div>
    );
  }

  if (!batches.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
        <Users size={32} />
        <p className="text-sm">No batch data found for this session.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {batches.map(({ batch, students }) => {
        const completed = students.filter(
          (s) => s.registration?.status === "COMPLETED",
        );
        const notStarted = students.filter(
          (s) => !s.registration || s.registration?.status === "NOT_STARTED",
        );
        const isOpen = !!openBatches[batch._id];

        return (
          <div
            key={batch._id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
          >
            {/* Batch header */}
            <button
              onClick={() => toggleBatch(batch._id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown size={16} className="text-slate-400" />
                ) : (
                  <ChevronRight size={16} className="text-slate-400" />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {batch.batch_name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Semester {batch.semester} · {students.length} students
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {completed.length} completed
                </span>
                {notStarted.length > 0 && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    {notStarted.length} not started
                  </span>
                )}
              </div>
            </button>

            {isOpen && (
              <>
                {/* Stats bar */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  {[
                    { label: "Total", value: students.length, color: "" },
                    {
                      label: "Completed",
                      value: completed.length,
                      color: "text-emerald-600 dark:text-emerald-400",
                    },
                    {
                      label: "Not Started",
                      value: notStarted.length,
                      color: "text-red-500 dark:text-red-400",
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center py-3"
                    >
                      <span
                        className={`text-lg font-semibold text-slate-800 dark:text-slate-100 ${color}`}
                      >
                        {value}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 mt-0.5">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Students */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
                  {students.map(({ student, registration }) => {
                    const isCompleted = registration?.status === "COMPLETED";
                    const isStudentOpen = !!openStudents[student._id];

                    const courses = registration?.backlogCourses || [];
                    const totalCredits = courses.reduce(
                      (sum, c) => sum + (c.course?.credits || 0),
                      0,
                    );

                    return (
                      <div key={student._id}>
                        <button
                          onClick={() =>
                            isCompleted && toggleStudent(student._id)
                          }
                          className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors ${
                            isCompleted
                              ? "hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer"
                              : "cursor-default"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                isCompleted ? "bg-emerald-500" : "bg-red-400"
                              }`}
                            />
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                                isCompleted
                                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                                  : "bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400"
                              }`}
                            >
                              {getInitials(student.fullName || student.name)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                {student.fullName || student.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {student.rollNo || student.studentId}
                                {isCompleted
                                  ? ` · ${courses.length} courses · ${totalCredits} credits`
                                  : " · Not yet registered"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                isCompleted
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                              }`}
                            >
                              {isCompleted ? "Completed" : "Not Started"}
                            </span>
                            {isCompleted &&
                              (isStudentOpen ? (
                                <ChevronDown
                                  size={14}
                                  className="text-slate-400"
                                />
                              ) : (
                                <ChevronRight
                                  size={14}
                                  className="text-slate-400"
                                />
                              ))}
                          </div>
                        </button>

                        {/* Course list */}
                        {isStudentOpen && (
                          <div className="mx-5 mb-3 rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-800/30">
                            <table className="w-full text-left table-fixed">
                              <thead>
                                <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                  <th className="px-4 py-2 w-[100px]">Code</th>
                                  <th className="px-4 py-2">Name</th>
                                  <th className="px-4 py-2 text-center w-[80px]">
                                    Credits
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {courses.map((entry, i) => {
                                  const c = entry.course;
                                  return (
                                    <tr
                                      key={i}
                                      className="bg-white dark:bg-slate-900"
                                    >
                                      <td className="px-4 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                        {c?.course_code}
                                      </td>
                                      <td className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 truncate">
                                        {c?.course_name}
                                      </td>
                                      <td className="px-4 py-2.5 text-xs text-center font-medium text-slate-700 dark:text-slate-300">
                                        {c?.credits}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CourseRegistrationTab;
