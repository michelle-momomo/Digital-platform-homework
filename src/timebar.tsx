import { useEffect, useState } from "react";

const TIP_KEY = "dp-timer-tip";

export function TimeBonus({ limitMs, started }: { limitMs: number; started: number }) {
  const total = Math.max(1, Math.round(limitMs / 1000));
  const [left, setLeft] = useState(() => Math.max(0, total - Math.floor((Date.now() - started) / 1000)));
  const [tip, setTip] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setLeft(Math.max(0, total - Math.floor((Date.now() - started) / 1000)));
    }, 250);
    return () => window.clearInterval(timer);
  }, [started, total]);
  useEffect(() => {
    try {
      if (!localStorage.getItem(TIP_KEY)) setTip(true);
    } catch {
      /* storage unavailable */
    }
  }, []);
  function close() {
    setTip(false);
    try {
      localStorage.setItem(TIP_KEY, "1");
    } catch {
      /* storage unavailable */
    }
  }
  const over = left <= 0;
  return (
    <span className={`timebonus ${!over && left <= 5 ? "urgent" : ""} ${over ? "over" : ""}`}>
      <small>{over ? "限时星已错过" : `${total} 秒内答对 +1★`}</small>
      <span
        className="timebar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={left}
        aria-label={over ? "限时星已错过" : `Bonus ${left}s`}
      >
        <i style={{ width: `${(left / total) * 100}%` }} />
      </span>
      <b>⏱ {left}</b>
      {tip && (
        <button type="button" className="time-tip" onClick={close}>
          限时内答对可以多拿一颗星。点这里关闭。
        </button>
      )}
    </span>
  );
}
