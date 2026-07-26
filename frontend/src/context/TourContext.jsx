import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { getStepsForView, getViewSpecificSteps } from "../tour/Toursteps";

const TourContext = createContext(null);

const SEEN_KEY_PREFIX = "tour:seen:";

const getSeenKey = (view, userId) =>
  `${SEEN_KEY_PREFIX}${userId || "guest"}:${view}`;

const isTargetRenderable = (target) => {
  if (target === "body") return true;
  try {
    return !!document.querySelector(target);
  } catch {
    return false;
  }
};

const getRenderableSteps = (steps) =>
  steps.filter((step) => isTargetRenderable(step.target));

export const TourProvider = ({ children, userId }) => {
  const [run, setRun] = useState(false);
  const [view, setView] = useState(null);
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [shellShown, setShellShown] = useState(false);

  const [buttonStack, setButtonStack] = useState([]);

  const registerButton = useCallback((id) => {
    setButtonStack((s) => [...s, id]);
    return () => setButtonStack((s) => s.filter((x) => x !== id));
  }, []);

  const start = useCallback(
    (targetView, { force = true, includeShell } = {}) => {
      const isSessionView = targetView.startsWith("academic-session-");
      const shellSeenKey = getSeenKey("academic-session-shell", userId);
      const shellAlreadySeen = localStorage.getItem(shellSeenKey) === "true";

      const shouldIncludeShell =
        includeShell !== undefined
          ? includeShell
          : isSessionView && !shellAlreadySeen;

      const stepsForView = getStepsForView(targetView, {
        includeShell: shouldIncludeShell,
      });

      const allSteps = getRenderableSteps(stepsForView);

      if (!allSteps.length) return false;

      // A "success" that only turned up base/shell steps — because the
      // view's own [data-tour] targets haven't mounted yet — isn't a real
      // success. Treat it the same as finding nothing, so the autostart
      // retry loop keeps trying instead of permanently marking this view
      // "seen" with generic content standing in for the real tour.
      const viewOwnSteps = getViewSpecificSteps(targetView);
      const hasOwnStepsDefined = viewOwnSteps.length > 0;
      const hasOwnStepsRenderable = viewOwnSteps.some((step) =>
        isTargetRenderable(step.target),
      );
      if (hasOwnStepsDefined && !hasOwnStepsRenderable) return false;

      setView(targetView);
      setSteps(allSteps);
      setRun(true);
      setStepIndex(0);

      if (shouldIncludeShell) {
        setShellShown(true);
        localStorage.setItem(shellSeenKey, "true");
      }

      if (force) localStorage.setItem(getSeenKey(targetView, userId), "true");
      return true;
    },
    [userId],
  );

  const stop = useCallback(() => {
    setRun(false);
    setShellShown(false);
    setStepIndex(0);
  }, []);

  const hasSeen = useCallback(
    (targetView) => {
      return localStorage.getItem(getSeenKey(targetView, userId)) === "true";
    },
    [userId],
  );

  const resetSeen = useCallback(
    (targetView) => {
      if (targetView) {
        localStorage.removeItem(getSeenKey(targetView, userId));
      } else {
        Object.keys(localStorage)
          .filter((k) =>
            k.startsWith(`${SEEN_KEY_PREFIX}${userId || "guest"}:`),
          )
          .forEach((k) => localStorage.removeItem(k));
      }
    },
    [userId],
  );

  const switchView = useCallback(
    (targetView) => {
      if (!run) return;
      const ok = start(targetView, { force: false, includeShell: !shellShown });
      if (!ok) setRun(false);
    },
    [run, start, shellShown],
  );

  const value = useMemo(
    () => ({
      run,
      view,
      steps,
      stepIndex,
      setStepIndex,
      start,
      stop,
      hasSeen,
      resetSeen,
      switchView,
      registerButton,
      buttonStack,
    }),
    [
      run,
      view,
      steps,
      stepIndex,
      start,
      stop,
      hasSeen,
      resetSeen,
      switchView,
      registerButton,
      buttonStack,
    ],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export const useTour = () => {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within a TourProvider");
  return ctx;
};
