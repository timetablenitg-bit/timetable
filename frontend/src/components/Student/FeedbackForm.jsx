import React, { useState } from "react";
import { MessageSquare, Send, Star, Bug, Lightbulb } from "lucide-react";
import { useFeedbackStore } from "../../store/useFeedbackStore";

const TYPE_OPTIONS = [
  { key: "general", label: "General", icon: MessageSquare },
  { key: "bug", label: "Bug / Glitch", icon: Bug },
  { key: "suggestion", label: "Suggestion", icon: Lightbulb },
];

const FeedbackForm = () => {
  const { submitFeedback, isSubmitting } = useFeedbackStore();
  const [type, setType] = useState("general");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const ok = await submitFeedback({
      type,
      message,
      rating: rating || undefined,
      page: window.location.pathname,
    });

    if (ok) {
      setMessage("");
      setRating(0);
      setType("general");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 max-w-2xl mx-auto p-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Share Your Feedback
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ran into a bug, or have an idea to make the portal better? Let us
          know.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5"
      >
        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            What's this about?
          </label>
          <div className="flex gap-2 flex-wrap">
            {TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = type === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setType(opt.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    active
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon size={16} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Overall experience (optional)
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n === rating ? 0 : n)}
                className="p-1"
              >
                <Star
                  size={24}
                  className={
                    n <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-slate-300 dark:text-slate-600"
                  }
                />
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Details
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Describe the bug, or tell us what could be better..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !message.trim()}
          className={`flex items-center justify-center gap-2 w-full rounded-xl py-3 font-semibold text-white transition-colors ${
            isSubmitting || !message.trim()
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          <Send size={16} />
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </button>

        {submitted && (
          <p className="text-sm text-green-600 dark:text-green-400 text-center">
            Feedback submitted — thank you!
          </p>
        )}
      </form>
    </div>
  );
};

export default FeedbackForm;
