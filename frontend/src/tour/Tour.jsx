import React, { useEffect } from "react";
import { Joyride, ACTIONS, EVENTS, STATUS } from "react-joyride";
import { useTour } from "../context/TourContext";

const Tour = () => {
  const { run, steps, stop, stepIndex, setStepIndex } = useTour();

  useEffect(() => {
    if (run) {
      setStepIndex(0);
    }
  }, [run, steps]);

  const handleCallback = (data) => {
    const { action, index, status, type } = data;

    const finished = status === STATUS.FINISHED || status === STATUS.SKIPPED;
    const closed = action === ACTIONS.CLOSE;

    const targetMissing = type === EVENTS.TARGET_NOT_FOUND;

    if (finished || closed) {
      stop();
      setStepIndex(0);
      return;
    }

    if (targetMissing) {
      const next = index + 1;
      if (next >= steps.length) {
        stop();
        setStepIndex(0);
      } else {
        setStepIndex(next);
      }
      return;
    }

    if (type === EVENTS.STEP_AFTER) {
      const next = index + (action === ACTIONS.PREV ? -1 : 1);
      if (next < 0 || next >= steps.length) {
        stop();
        setStepIndex(0);
      } else {
        setStepIndex(next);
      }
    }
  };

  if (!steps.length) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      onEvent={handleCallback}
      options={{
        buttons: ["back", "close", "primary", "skip"],
        showProgress: true,
        spotlightClicks: true,
        spotlightPadding: 6,
        colors: {
          primary: "#10b981",
          textColor: "#1e293b",
          backgroundColor: "#ffffff",
          overlayColor: "rgba(15, 23, 42, 0.55)",
          arrowColor: "#ffffff",
        },
        zIndex: 9999,
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip tour",
      }}
    />
  );
};

export default Tour;
