import React, { useEffect, useLayoutEffect, useRef } from "react";
import { HelpCircle } from "lucide-react";
import { useTour } from "../context/TourContext";
import { useAuthStore } from "../store/useAuthStore";

const TourButton = ({ view, className = "" }) => {
  const { start, stop, hasSeen, registerButton, buttonStack } = useTour();
  const { authUser } = useAuthStore();
  const idRef = useRef(Symbol(view));

  useLayoutEffect(() => {
    const unregister = registerButton(idRef.current);
    return unregister;
  }, [registerButton]);

  const isTopmost = buttonStack[buttonStack.length - 1] === idRef.current;
  const isFirstVisit = !hasSeen(view);

  if (authUser?.role !== "admin") return null;
  if (!isTopmost) return null; // a button mounted later (deeper view) takes priority

  const handleClick = () => {
    stop();
    start(view);
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-6 right-6 bg-emerald-600 text-white p-3 rounded-full shadow-lg hover:scale-105 transition z-9995 ${className}`}
      aria-label="Start guided tour"
      title="Take a tour of this page"
    >
      <HelpCircle size={24} />
      {isFirstVisit && (
        <span
          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
          aria-hidden="true"
        />
      )}
    </button>
  );
};

export default TourButton;
