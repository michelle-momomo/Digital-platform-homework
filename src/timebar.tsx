import { useEffect, useState } from "react";

const TIP_KEY = "dp-timer-tip";

export function TimeBonus({ limitMs, started }: { limitMs: number; started: number }) {
  const total = Math.max(1, Math.round(limitMs / 1000));
  const [left, setLeft] = useState(() => Math.max(0, total - Math.floor((Date.now() - started) / 1000)));
  useEffect(() => {
    const timer = window.setInterval(() => {
      setLeft(Math.max(0, total - Math.floor((Date.now() - started) / 1000)));
    }, 250);
    return () => window.clearInterval(timer);
  }, [started, total]);
  const over = left <= 0;
  return (
    <span className={`timebonus ${!over && left <= 5 ? "urgent" : ""} ${over ? "over" : ""}`}>
      <small>{over ? "Bonus star missed" : `Finish in ${total}s for +1★`}</small>
      <span
        className="timebar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={left}
        aria-label={over ? "Bonus star missed" : `Bonus ${left}s`}
      >
        <i style={{ width: `${(left / total) * 100}%` }} />
      </span>
      <b>⏱ {left}</b>
    </span>
  );
}

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
