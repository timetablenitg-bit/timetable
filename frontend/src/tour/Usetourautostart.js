import { useEffect } from "react";
import { useTour } from "../context/TourContext";

/**
 * Auto-launches the tour the first time a user lands on `view`, once its
 * anchor elements exist. Retries briefly instead of firing on a hard-coded
 * timeout, since data-driven panels (stats, lists) can take a beat to render.
 */
const useTourAutostart = (
  view,
  { enabled = true, maxAttempts = 10, intervalMs = 300 } = {},
) => {
  const { start, hasSeen, run } = useTour();

  useEffect(() => {
    if (!enabled || !view || run || hasSeen(view)) return;

    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const started = start(view);
      if (started || attempts >= maxAttempts) {
        clearInterval(timer);
      }
    }, intervalMs);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, enabled]);
};

export default useTourAutostart;
