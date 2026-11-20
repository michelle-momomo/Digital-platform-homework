import { useEffect, useState, type ReactNode } from "react";
import { Sprite } from "./AvatarView";
import type { Level, Region } from "./content";
import type { StarLine } from "./logic";
import { useGame } from "./store";
import { TimerTip } from "./timebar";

export type FootAction = { label: string; onClick: () => void; disabled?: boolean };

/** What the sticky bottom bar shows. */
export type Verdict =
  | { kind: "idle"; hint: string; action?: FootAction }
  | { kind: "bad"; text: string; tag?: string; action: FootAction }
  | { kind: "good"; title: string; text: string; tag?: string; lines?: StarLine[]; action: FootAction };

/**
 * One frame for every level type, built from reference-level.html:
 * sticky header (back, step dots, stars, combo, sound, timer), a 720px content
 * column (eyebrow, prompt, pal), the answer area, and a sticky result bar.
 */
export function LevelShell({
  region,
  level,
  index,
  started,
  stars,
  combo,
  prompt,
  onExit,
  verdict,
  children,
}: {
  region: Region;
  level: Level;
  index: number;
  started: number;
  stars: number;
  combo: number;
  prompt: ReactNode;
  onExit: () => void;
  verdict: Verdict;
  children: ReactNode;
}) {
  const game = useGame();
  const muted = game.save.mute;
  return (
    <div className="shell">
      <header className="hdr">
        <div className="hdr-in">
          <button type="button" className="back" onClick={onExit}>
            ← Map
          </button>
          <div className="steps" role="img" aria-label={`Level ${index + 1} of ${region.levels.length}`}>
            {region.levels.map((item, i) => (
              <i key={item.id} className={i === index ? "now" : i < index ? "done" : ""} />
            ))}
          </div>
          <div className="meta">
            <span className="hdr-stars" role="img" aria-label={`${stars} of 3 stars`}>
              {[1, 2, 3].map((n) => (n <= stars ? <b key={n}>★</b> : <span key={n}>★</span>))}
            </span>
            <span>
              <span className="lbl">Combo </span>
              <span className="combo" key={combo}>
                {combo}
              </span>
            </span>
            <button
              type="button"
              className={`sound ${muted ? "off" : ""}`}
              aria-label={muted ? "Sound off" : "Sound on"}
              aria-pressed={!muted}
              onClick={() => game.setMute(!muted)}
            >
              ♪
            </button>
          </div>
        </div>
        <Timer limitMs={level.limitMs} started={started} />
      </header>

      <main className="level-main">
        <TimerTip />
        <div className="title">
          <div>
            <p className="eyebrow">
              {region.title} · {level.title}
            </p>
            <h1 className="prompt-h">{prompt}</h1>
          </div>
          {game.save.character && <Sprite character={game.save.character} className="pal" label="" />}
        </div>
        <div className="answer">{children}</div>
      </main>

      <div className="foot">
        <div
          className={`foot-in ${verdict.kind === "idle" ? "" : verdict.kind}`}
          role="status"
          aria-live="polite"
        >
          <div className="verdict">
            {verdict.kind === "idle" && <p>{verdict.hint}</p>}
            {verdict.kind === "bad" && (
              <>
                <strong>Not quite</strong>
                <p>{verdict.text}</p>
                {verdict.tag && <span className="tag">{verdict.tag}</span>}
              </>
            )}
            {verdict.kind === "good" && (
              <>
                <strong>{verdict.title}</strong>
                <p>{verdict.text}</p>
                {verdict.tag && <span className="tag">{verdict.tag}</span>}
                {verdict.lines && (
                  <ul className="star-lines">
                    {verdict.lines.map((line) => (
                      <li key={line.label} className={line.earned ? "on" : ""}>
                        {line.earned ? "★" : "☆"} {line.label}: {line.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
          {verdict.kind !== "idle" ? (
            <button type="button" className="btn btn-primary" onClick={verdict.action.onClick}>
              {verdict.action.label}
            </button>
          ) : (
            verdict.action && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={verdict.action.disabled}
                onClick={verdict.action.onClick}
              >
                {verdict.action.label}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function Timer({ limitMs, started }: { limitMs: number; started: number }) {
  const total = Math.max(1, Math.round(limitMs / 1000));
  const read = () => Math.max(0, total - Math.floor((Date.now() - started) / 1000));
  const [left, setLeft] = useState(read);
  useEffect(() => {
    const timer = window.setInterval(() => setLeft(read()), 250);
    return () => window.clearInterval(timer);
    // read only depends on started and total
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, total]);
  const over = left <= 0;
  return (
    <div className={`timer ${!over && left <= 5 ? "low" : ""}`}>
      <span>⏱ {left}s</span>
      <div
        className="bar"
        role="progressbar"
        aria-label="Bonus timer"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={left}
      >
        <span style={{ width: `${(left / total) * 100}%` }} />
      </div>
      <span className="hint">{over ? "Bonus star missed" : `Finish in ${total}s for +1★`}</span>
    </div>
  );
}

/** Label for the button that leaves a finished level. */
export function leaveLabel(region: Region, index: number) {
  return index === region.levels.length - 1 ? "Back to map" : "Next level →";
}
