import { useEffect, useState } from "react";

const TIP_KEY = "dp-timer-tip";

/** Shown once: on the first level a player opens. Seeing it marks it as seen. */
export function TimerTip() {
  const [show, setShow] = useState(() => {
    try {
      return !localStorage.getItem(TIP_KEY);
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (!show) return;
    try {
      localStorage.setItem(TIP_KEY, "1");
    } catch {
      /* storage unavailable */
    }
  }, [show]);
  if (!show) return null;
  return (
    <button type="button" className="time-tip" onClick={() => setShow(false)}>
      Beat the timer to earn a bonus star. Tap to dismiss.
    </button>
  );
}
