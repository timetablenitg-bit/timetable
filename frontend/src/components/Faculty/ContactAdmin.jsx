import React, { useState, useEffect } from "react";
import { useFacultyStore } from "../../store/useFacultyStore"; // Adjust path if needed

const ContactAdmin = () => {
  // Local Form State
  const [formData, setFormData] = useState({
    issueType: "timetable",
    subject: "",
    subjectCode: "",
    branch: "",
    day: "",
    message: "",
  });

  const [showSuccess, setShowSuccess] = useState(false);

  // Extract variables and functions from our Zustand store
  const {
    requests,
    isLoading,
    isSubmitting,
    fetchContactRequests,
    submitContactRequest,
  } = useFacultyStore();

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Fetch history on component mount
  useEffect(() => {
    fetchContactRequests();
  }, [fetchContactRequests]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Call the store action and await the result
    const isSuccess = await submitContactRequest(formData);

    if (isSuccess) {
      setShowSuccess(true);

      // Reset form UI after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setFormData({
          issueType: "timetable",
          subject: "",
          subjectCode: "",
          branch: "",
          day: "",
          message: "",
        });
      }, 3000);
    }
  };

  const formatDate = (dateString) => {
    const options = { month: "short", day: "numeric", year: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const isFormValid =
    formData.issueType === "timetable"
      ? formData.subject.trim() !== "" &&
        formData.subjectCode.trim() !== "" &&
        formData.branch.trim() !== "" &&
        formData.day !== "" &&
        formData.message.trim() !== ""
      : formData.message.trim() !== "";

  return (
    <div className="w-full mx-auto p-1 text-slate-900 dark:text-slate-100 font-sans">
      {/* 1. ================= PAGE HEADER ================= */}
      <div className="flex items-center gap-4 mb-8 px-1 sm:px-2">
        <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-sm border border-emerald-200 dark:border-emerald-500/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Support Portal
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Request a timetable change or contact the admin for other issues
          </p>
        </div>
      </div>

      {/* 2. ================= GUIDELINES || CONTACT DETAILS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-stretch">
        {/* Guidelines */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-5 rounded-2xl">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Guidelines
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-200/80 space-y-2 list-disc list-inside">
            <li>Timetable changes usually take 24-48 hours to process.</li>
            <li>Provide a clear reason for your schedule conflict.</li>
            <li>For urgent system issues, please use the "Other" option.</li>
          </ul>
        </div>

        {/* Direct Contact */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-5 rounded-2xl flex flex-col justify-center">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
            Direct Contact
          </h3>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <p className="flex items-center">
              <svg
                className="w-4 h-4 mr-3 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              admin@university.edu
            </p>
            <p className="flex items-center">
              <svg
                className="w-4 h-4 mr-3 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              +1 (555) 123-4567
            </p>
          </div>
        </div>
      </div>

      {/* 3. ================= CONTACT FORM ================= */}
      <div className="w-full bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all mb-8">
        {showSuccess ? (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Request Sent Successfully!
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
              The admin team has received your message and will get back to you
              shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                What do you need help with?
              </label>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-lg">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, issueType: "timetable" })
                  }
                  className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all flex items-center justify-center ${
                    formData.issueType === "timetable"
                      ? "bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300 shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Timetable Change
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, issueType: "other" })
                  }
                  className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all flex items-center justify-center ${
                    formData.issueType === "other"
                      ? "bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300 shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  Other Issue
                </button>
              </div>
            </div>

            {formData.issueType === "timetable" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 animate-in fade-in duration-300">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Networks"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    name="subjectCode"
                    value={formData.subjectCode}
                    onChange={handleInputChange}
                    placeholder="e.g., CS401"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Branch
                  </label>
                  <input
                    type="text"
                    name="branch"
                    value={formData.branch}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Day of the Week
                  </label>
                  <div className="relative">
                    <select
                      name="day"
                      value={formData.day}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="" disabled>
                        Select a day
                      </option>
                      {daysOfWeek.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {formData.issueType === "timetable"
                  ? "Reason for Change"
                  : "Describe your issue"}
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                placeholder={
                  formData.issueType === "timetable"
                    ? "Please explain why you need this schedule altered..."
                    : "How can the admin help you today?"
                }
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`w-full md:w-auto px-8 py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 flex justify-center items-center space-x-2 ${
                  isFormValid && !isSubmitting
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
                    : "bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send Message to Admin</span>
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 4. ================= REQUEST HISTORY ================= */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all">
        <h3 className="text-xl font-bold mb-6 flex items-center text-slate-900 dark:text-white">
          <svg
            className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Request History
        </h3>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <svg
              className="animate-spin h-6 w-6 text-blue-600 dark:text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg
              className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              No requests found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="group relative p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                      {req.type === "timetable" ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {req.type === "timetable"
                        ? "Schedule Change"
                        : "General Issue"}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                      req.status === "Resolved"
                        ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50"
                        : req.status === "Pending"
                          ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50"
                          : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <div className="mb-4">
                  {req.type === "timetable" && (
                    <>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                        {req.subject}{" "}
                        <span className="text-slate-400 font-normal">
                          ({req.day})
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">
                        {req.subjectCode} • {req.branch}
                      </p>
                    </>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                    "{req.message}"
                  </p>
                </div>

                <div className="text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-700/60 pt-3 mt-auto">
                  Requested on {formatDate(req.date)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactAdmin;
