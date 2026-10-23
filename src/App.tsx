import { useEffect, useRef, useState } from "react";
import { maxScore, sessions } from "./data";
import type { Challenge, Session, Source } from "./data";
import {
  createAttempt,
  emptyProgress,
  outcome,
  parseProgress,
  saveAttempt,
  STORAGE_KEY,
  transition,
} from "./model";
import type { Action, Attempt, Progress, Result } from "./model";
import "./styles.css";

function Icon({
  name,
  size = 20,
}: {
  name: "arrow" | "layers" | "connect" | "launch" | "check" | "book" | "close";
  size?: number;
}) {
  const paths = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />
      </>
    ),
    connect: (
      <>
        <rect x="3" y="4" width="6" height="6" rx="2" />
        <rect x="15" y="14" width="6" height="6" rx="2" />
        <path d="M9 7h6a3 3 0 0 1 3 3v4M6 10v7h9" />
      </>
    ),
    launch: (
      <>
        <path d="m14 4 6-1-1 6-8 8-4-4 7-9ZM7 13l-3 1-1 5 5-1M11 17l-1 4 4-1 2-5" />
        <path d="m15 7 2 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    book: (
      <>
        <path d="M12 6v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v14c-4-1-6 0-9 2-3-2-5-3-9-2V4Z" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
function Citation({ source }: { source: Source }) {
  return (
    <span className="citation">
      {source.extra
        ? "Extra tip · not from the lecture"
        : `Lecture ${source.pages.length === 1 ? "p." : "pp."} ${source.pages.join(", ")}`}
    </span>
  );
}
function load() {
  try {
    const value = parseProgress(localStorage.getItem(STORAGE_KEY));
    return { ...value, unavailable: false };
  } catch {
    return { progress: emptyProgress(), recovered: false, unavailable: true };
  }
}
const initial = load();
export default function App() {
  const [progress, setProgress] = useState<Progress>(initial.progress);
  const [storageError, setStorageError] = useState(initial.unavailable);
  const [notice, setNotice] = useState(
    initial.recovered
      ? "Some saved progress was outdated or unreadable, so it was safely reset."
      : "",
  );
  const [sessionId, setSessionId] = useState(sessions[0].id);
  const [view, setView] = useState<"session" | "challenge">(
    initial.progress.sessions[sessions[0].id]?.active ? "challenge" : "session",
  );
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const modalRef = useRef<HTMLDialogElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);
  const s = sessions.find((x) => x.id === sessionId)!;
  const current = progress.sessions[s.id];
  const active = current?.active;
  const challenge = s.challenges.find((c) => c.id === active?.challengeId);
  const completed = s.challenges.filter(
    (c) => current?.results[c.id]?.completed,
  ).length;
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [progress]);
  useEffect(() => {
    if (resetOpen) modalRef.current?.showModal();
    else modalRef.current?.close();
  }, [resetOpen]);
  function focusContent() {
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      headingRef.current?.scrollIntoView({
        block: "start",
        behavior: "instant",
      });
    });
  }
  function start(c: Challenge, resume = false) {
    if (!resume) setProgress((p) => saveAttempt(p, s, c, createAttempt(c)));
    setKnowledgeOpen(false);
    setView("challenge");
    focusContent();
  }
  function dispatch(action: Action) {
    if (!active || !challenge) return;
    setProgress((p) => {
      const a = p.sessions[s.id]?.active;
      return a
        ? saveAttempt(p, s, challenge, transition(challenge, a, action))
        : p;
    });
  }
  function back() {
    setView("session");
    setKnowledgeOpen(false);
    focusContent();
  }
  function reset() {
    setProgress(emptyProgress());
    setView("session");
    setKnowledgeOpen(false);
    setNotice("Progress reset. A fresh start, whenever you are ready.");
    setResetOpen(false);
    requestAnimationFrame(() => resetRef.current?.focus());
  }
  const isPlaying = view === "challenge" && active && challenge;
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="site-shell">
        <header className="masthead">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              back();
            }}
            aria-label="After Class home"
          >
            <span className="brand-mark">
              a<span>c</span>
            </span>
            After Class<span className="brand-dot">.</span>
          </a>
          <span className="header-note">
            Made for the part after the lecture.
          </span>
        </header>
        <div className="intro">
          <p className="eyebrow">CLOSE YOUR NOTES. OPEN YOUR CURIOSITY.</p>
          <h1>
            A little play.
            <br className="mobile-break" /> A lot to remember.
          </h1>
          <p>
            Your guest sessions, turned into small challenges. Take a few
            minutes to make it stick.
          </p>
        </div>
        <nav className="session-nav" aria-label="Guest sessions">
          <div role="tablist" aria-label="Available sessions">
            {sessions.map((session) => (
              <button
                key={session.id}
                role="tab"
                id={`tab-${session.id}`}
                aria-selected={s.id === session.id}
                aria-controls={`panel-${session.id}`}
                tabIndex={s.id === session.id ? 0 : -1}
                onKeyDown={(e) => {
                  if (
                    ["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)
                  ) {
                    e.preventDefault();
                    const i = sessions.findIndex((x) => x.id === s.id);
                    const next =
                      e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? sessions.length - 1
                          : (i +
                              (e.key === "ArrowRight" ? 1 : -1) +
                              sessions.length) %
                            sessions.length;
                    setSessionId(sessions[next].id);
                    setView("session");
                    setKnowledgeOpen(false);
                    document
                      .getElementById(`tab-${sessions[next].id}`)
                      ?.focus();
                  }
                }}
                onClick={() => {
                  setSessionId(session.id);
                  setView("session");
                  setKnowledgeOpen(false);
                }}
              >
                <Icon name="layers" size={17} />
                {session.title}
              </button>
            ))}
          </div>
          <span className="coming">More sessions coming soon</span>
        </nav>
        <main id="main" tabIndex={-1}>
          <section
            role="tabpanel"
            id={`panel-${s.id}`}
            aria-labelledby={`tab-${s.id}`}
          >
            {storageError && (
              <p className="notice" role="status">
                Browser storage is unavailable. You can still play, but progress
                will last only for this visit.
              </p>
            )}
            {notice && (
              <div className="notice" role="status">
                <span>{notice}</span>
                <button
                  aria-label="Dismiss notification"
                  className="icon-button"
                  onClick={() => setNotice("")}
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            )}
            {isPlaying ? (
              <>
                <button className="back-button" onClick={back}>
                  ← Back to session
                </button>
                <div className="game-title">
                  <div>
                    <p className="eyebrow">
                      {s.title.toUpperCase()} / {challenge.label.toUpperCase()}
                    </p>
                    <h2 ref={headingRef} tabIndex={-1}>
                      {challenge.title}
                    </h2>
                  </div>
                  <span className="time-pill">{challenge.minutes}</span>
                </div>
                {active.done ? (
                  <Results
                    c={challenge}
                    a={active}
                    result={current?.results[challenge.id]}
                    retry={() => start(challenge)}
                    back={back}
                  />
                ) : (
                  <div className="game-card">
                    <Game
                      key={challenge.id}
                      c={challenge}
                      a={active}
                      dispatch={dispatch}
                    />
                  </div>
                )}
                <p className="save-note">
                  {storageError
                    ? "Progress is kept in memory for this visit."
                    : "Your place is saved in this browser, including this attempt."}
                </p>
              </>
            ) : (
              <>
                <div className="session-heading">
                  <div>
                    <p className="eyebrow">THE SESSION RECAP</p>
                    <h2 ref={headingRef} tabIndex={-1}>
                      {s.title}
                    </h2>
                    <p className="session-description">{s.description}</p>
                    {(s.speaker || s.date) && (
                      <p className="muted">
                        {[s.speaker, s.date].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="session-summary">
                    <span className="summary-fraction">
                      {completed}
                      <span> / {s.challenges.length}</span>
                    </span>
                    <span>challenges completed</span>
                    <div
                      className="progress-track"
                      role="progressbar"
                      aria-label="Session completion"
                      aria-valuenow={completed}
                      aria-valuemin={0}
                      aria-valuemax={s.challenges.length}
                    >
                      <span
                        style={{
                          width: `${(completed / s.challenges.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                {completed === s.challenges.length && (
                  <div className="completion" role="status">
                    <Icon name="check" />
                    <span>
                      <strong>Session wrapped.</strong> You worked through every
                      challenge. Come back for a quick refresh anytime.
                    </span>
                  </div>
                )}
                <div className="knowledge">
                  <button
                    className="knowledge-toggle"
                    aria-expanded={knowledgeOpen}
                    aria-controls="knowledge-content"
                    onClick={() => setKnowledgeOpen(!knowledgeOpen)}
                  >
                    <span className="knowledge-label">
                      <Icon name="book" />
                      <span>
                        A quick refresher
                        <span className="muted knowledge-sub">
                          {s.takeaways.length} ideas worth keeping
                        </span>
                      </span>
                    </span>
                    <span className="toggle-label">
                      {knowledgeOpen ? "Close notes −" : "Open notes +"}
                    </span>
                  </button>
                  {knowledgeOpen && (
                    <div id="knowledge-content" className="knowledge-content">
                      {s.takeaways.map((t, i) => (
                        <article key={t.title}>
                          <span className="note-number">0{i + 1}</span>
                          <div>
                            <h3>{t.title}</h3>
                            <p>{t.text}</p>
                            <Citation source={t.source} />
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
                <div className="section-label">
                  <div>
                    <h3>Your next few minutes</h3>
                    <p>Pick a challenge. Learn by doing.</p>
                  </div>
                  <span>{s.challenges.length} WAYS TO MAKE IT STICK</span>
                </div>
                <div className="challenge-grid">
                  {s.challenges.map((c, i) => {
                    const result = current?.results[c.id];
                    const resumable =
                      active?.challengeId === c.id && !active.done;
                    return (
                      <article className="challenge-card" key={c.id}>
                        <div className="card-top">
                          <span className={`challenge-icon icon-${c.type}`}>
                            <Icon
                              name={
                                c.type === "pipeline"
                                  ? "layers"
                                  : c.type === "matching"
                                    ? "connect"
                                    : "launch"
                              }
                              size={24}
                            />
                          </span>
                          <span className={`status ${result ? "is-done" : ""}`}>
                            {result ? (
                              <>
                                <Icon name="check" size={14} />
                                Completed
                              </>
                            ) : resumable ? (
                              "In progress"
                            ) : (
                              "Ready to play"
                            )}
                          </span>
                        </div>
                        <p className="card-number">CHALLENGE 0{i + 1}</p>
                        <h3>{c.title}</h3>
                        <p className="card-description">{c.description}</p>
                        <div className="card-meta">
                          <span>{c.label}</span>
                          <span>~ {c.minutes}</span>
                        </div>
                        {result && (
                          <p className="card-score">
                            Last {result.latest}/{maxScore(c)}
                            <span>
                              Best {result.best}/{maxScore(c)}
                            </span>
                          </p>
                        )}
                        <button
                          className="button secondary"
                          onClick={() => start(c, resumable)}
                        >
                          {resumable
                            ? "Resume challenge"
                            : result
                              ? "Try again"
                              : "Start challenge"}
                          <Icon name="arrow" size={18} />
                        </button>
                      </article>
                    );
                  })}
                </div>
                <p className="learning-note">
                  <span className="tiny-line" />A missed answer is a useful
                  clue. You can correct it, finish, and try again.
                </p>
                <SourceNotes session={s} />
              </>
            )}
          </section>
        </main>
        <footer>
          <span>
            After Class<span className="footer-dot">.</span>
            <span className="footer-caption"> A little more remembered.</span>
          </span>
          <div>
            <span className="local-note">Saved on this browser only</span>
            <button ref={resetRef} onClick={() => setResetOpen(true)}>
              Reset progress
            </button>
          </div>
        </footer>
      </div>
      <dialog
        ref={modalRef}
        aria-labelledby="reset-title"
        onCancel={() => setResetOpen(false)}
        onClose={() => setResetOpen(false)}
      >
        <h2 id="reset-title">Start fresh?</h2>
        <p>
          This clears all session scores, best scores, and unfinished attempts
          in this browser. It cannot be undone.
        </p>
        <div className="dialog-actions">
          <button
            className="button secondary"
            autoFocus
            onClick={() => setResetOpen(false)}
          >
            Keep progress
          </button>
          <button className="button primary" onClick={reset}>
            Reset progress
          </button>
        </div>
      </dialog>
    </>
  );
}
function SourceNotes({ session }: { session: Session }) {
  return (
    <details className="source-notes">
      <summary>About the content & sources</summary>
      <p>
        Based on{" "}
        <a href={session.source.url} target="_blank" rel="noreferrer">
          {session.source.title} ↗
        </a>
        . References use PDF page numbers (1–31), not slide labels.
      </p>
      <p>
        The pipeline combines pages 4, 7, 20 and 21. Tool roles: pages 8, 14, 19
        and 28. File roles: page 24. Launch decisions: pages 15, 18, 19, 21 and
        26–28. The localStorage question is an extra learning tip, not a claim
        from the speaker.
      </p>
      <p>
        Speaker and session date are left blank because the supplied material
        does not clearly establish them. Content version:{" "}
        {session.contentVersion}.
      </p>
    </details>
  );
}
function Game({
  c,
  a,
  dispatch,
}: {
  c: Challenge;
  a: Attempt;
  dispatch: (a: Action) => void;
}) {
  const [dragged, setDragged] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const feedbackRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  function move(from: number, to: number) {
    dispatch({ type: "move", from, to });
    setAnnouncement(`Step moved to position ${to + 1}.`);
    requestAnimationFrame(() =>
      document
        .getElementById(`move-${to === 0 ? "down" : "up"}-${a.order[from]}`)
        ?.focus(),
    );
  }
  function next(action: Action) {
    dispatch(action);
    requestAnimationFrame(() => questionRef.current?.focus());
  }
  function answer(id: string) {
    dispatch({ type: "answer", id });
    requestAnimationFrame(() => feedbackRef.current?.focus());
  }
  if (c.type === "pipeline")
    return (
      <>
        <GameHeader
          kicker="ONE SEQUENCE · FOUR STEPS"
          title="What happens first?"
          description="Drag the steps into order, or use the arrow buttons. Check when you are ready. Your first submission determines your score."
        />
        <p className="context-note">{c.note}</p>
        <ol className="pipeline-list">
          {a.order.map((id, i) => {
            const step = c.steps.find((s) => s.id === id)!;
            return (
              <li
                key={id}
                draggable
                onDragStart={(e) => {
                  setDragged(i);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", id);
                }}
                onDragEnd={() => setDragged(null)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragged !== null) move(dragged, i);
                  setDragged(null);
                }}
                className={dragged === i ? "dragging" : ""}
              >
                <span className="drag-handle" aria-hidden="true">
                  ⠿
                </span>
                <span className="step-position">{i + 1}</span>
                <span className="step-text">{step.text}</span>
                <span className="move-controls">
                  <button
                    id={`move-up-${id}`}
                    className="icon-button"
                    disabled={i === 0}
                    aria-label={`Move ${step.text} up`}
                    onClick={() => move(i, i - 1)}
                  >
                    ↑
                  </button>
                  <button
                    id={`move-down-${id}`}
                    className="icon-button"
                    disabled={i === a.order.length - 1}
                    aria-label={`Move ${step.text} down`}
                    onClick={() => move(i, i + 1)}
                  >
                    ↓
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
        <span className="sr-only" role="status">
          {announcement}
        </span>
        {a.pipelineFeedback === false && (
          <div className="feedback incorrect" role="status">
            <strong>↻ A little rearranging needed.</strong>
            <p>
              The first submission scored 0/1. Put design before building;
              upload the finished code before connecting hosting. Correct the
              order to complete the challenge.
            </p>
            <ol className="explanation-list">
              {c.steps.map((step) => (
                <li key={step.id}>
                  <strong>{step.text}</strong> {step.explanation}{" "}
                  <Citation source={step.source} />
                </li>
              ))}
            </ol>
          </div>
        )}
        <div className="game-bottom">
          <span>
            {a.checks === 0
              ? "First submission counts · 1 point possible"
              : "Corrections finish the challenge; they do not add points."}
          </span>
          <button
            className="button primary"
            onClick={() => dispatch({ type: "check" })}
          >
            Check order
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </>
    );
  if (c.type === "matching") {
    const round = c.rounds[a.round];
    const done = round.pairs.every((p) => a.matched.includes(p.id));
    const last = a.lastPair;
    const correct = last?.task === last?.choice;
    const pair = round.pairs.find((p) => p.id === last?.task);
    return (
      <>
        <div className="game-progress">
          <span>
            Round {a.round + 1} of {c.rounds.length}
          </span>
          <span>
            {round.pairs.filter((p) => a.matched.includes(p.id)).length} /{" "}
            {round.pairs.length} matched
          </span>
        </div>
        <h3 ref={questionRef} tabIndex={-1} className="question-title">
          {round.title}
        </h3>
        <p className="game-instructions">{round.note}</p>
        <p className="scoring-note">
          Each pair’s first match counts. If you miss one, you can keep trying.
        </p>
        <div className="match-grid">
          <div className="match-column">
            <h4>1. Pick a task</h4>
            {round.pairs.map((p) => (
              <button
                key={p.id}
                aria-pressed={a.selectedTask === p.id}
                disabled={a.matched.includes(p.id)}
                className={`match-option ${a.selectedTask === p.id ? "selected" : ""} ${a.matched.includes(p.id) ? "matched" : ""}`}
                onClick={() => dispatch({ type: "task", id: p.id })}
              >
                <span>
                  {p.task}
                  {a.matched.includes(p.id) && <small>→ {p.answer}</small>}
                </span>
                {a.matched.includes(p.id) ? (
                  <Icon name="check" size={18} />
                ) : a.selectedTask === p.id ? (
                  <span className="selection-dot" aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>
          <div className="match-column">
            <h4>2. Pick its {a.round === 0 ? "tool" : "file"}</h4>
            {a.optionOrders[a.round].map((id) => {
              const p = round.pairs.find((p) => p.id === id)!;
              return (
                <button
                  key={id}
                  disabled={a.matched.includes(id) || !a.selectedTask}
                  className={`match-option answer-option ${a.matched.includes(id) ? "matched" : ""}`}
                  onClick={() => dispatch({ type: "pair", id })}
                >
                  {p.answer}
                  {a.matched.includes(id) && <Icon name="check" size={18} />}
                </button>
              );
            })}
          </div>
        </div>
        <div aria-live="polite" aria-atomic="true">
          {last && pair && (
            <div className={`feedback ${correct ? "correct" : "incorrect"}`}>
              <strong>
                {correct
                  ? "✓ Connected."
                  : "↻ Not this connection. Try another."}
              </strong>
              <p>
                {correct
                  ? pair.explanation
                  : "That tool or file has a different job. Your task stays selected; choose another option, or select a different task."}
              </p>
              {correct && <Citation source={pair.source} />}
            </div>
          )}
        </div>
        <div className="game-bottom">
          <span>
            {done
              ? "All connections made. Nice work."
              : a.selectedTask
                ? "Task selected. Now choose on the right."
                : "Start with a task on the left."}
          </span>
          <button
            className="button primary"
            disabled={!done}
            onClick={() => next({ type: "nextRound" })}
          >
            {a.round === c.rounds.length - 1 ? "See results" : "Next round"}
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </>
    );
  }
  const q = c.scenarios[a.question];
  const chosen = a.answers[a.question];
  const option = q.options.find((o) => o.id === chosen);
  return (
    <>
      <div className="game-progress">
        <span>
          Situation {a.question + 1} of {c.scenarios.length}
        </span>
        <span>{q.source.extra ? "Extra tip" : "Launch-day decisions"}</span>
      </div>
      <div className="mini-progress" aria-hidden="true">
        {c.scenarios.map((x, i) => (
          <span className={i <= a.question ? "filled" : ""} key={x.id} />
        ))}
      </div>
      <p className="game-instructions">
        Choose the next step, then read why it helps. Each situation’s first
        choice counts.
      </p>
      {q.source.extra && (
        <span className="extra-pill">Extra tip · beyond the lecture</span>
      )}
      <h3
        className="question-title scenario-title"
        ref={questionRef}
        tabIndex={-1}
      >
        {q.prompt}
      </h3>
      <div className="decision-options">
        {a.optionOrders[a.question].map((id, i) => {
          const o = q.options.find((o) => o.id === id)!;
          const selected = chosen === id;
          const correct = !!chosen && id === q.answer;
          return (
            <button
              key={id}
              disabled={!!chosen}
              className={`decision-option ${selected ? "selected" : ""} ${correct ? "correct-answer" : selected ? "wrong-answer" : ""}`}
              onClick={() => answer(id)}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + i)}
              </span>
              <span>{o.text}</span>
              {correct ? (
                <span className="answer-label">✓ Best next step</span>
              ) : selected ? (
                <span className="answer-label">↻ Your choice</span>
              ) : null}
            </button>
          );
        })}
      </div>
      {option && (
        <div
          ref={feedbackRef}
          tabIndex={-1}
          className={`feedback ${chosen === q.answer ? "correct" : "incorrect"}`}
          role="status"
        >
          <strong>
            {chosen === q.answer
              ? "✓ Good call."
              : "↻ Here’s the useful distinction."}
          </strong>
          <p>{option.why}</p>
          <Citation source={q.source} />
        </div>
      )}
      <div className="game-bottom">
        <span>
          {chosen
            ? "The why matters more than the click."
            : "Choose one option to continue."}
        </span>
        <button
          className="button primary"
          disabled={!chosen}
          onClick={() => next({ type: "nextQuestion" })}
        >
          {a.question === c.scenarios.length - 1
            ? "See results"
            : "Next situation"}
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </>
  );
}
function GameHeader({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <>
      <p className="eyebrow">{kicker}</p>
      <h3 className="question-title">{title}</h3>
      <p className="game-instructions">{description}</p>
    </>
  );
}
function Results({
  c,
  a,
  result,
  retry,
  back,
}: {
  c: Challenge;
  a: Attempt;
  result?: Result;
  retry: () => void;
  back: () => void;
}) {
  const { score, review } = outcome(c, a);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  return (
    <div className="result-card">
      <div className="result-top">
        <span className="result-check">
          <Icon name="check" size={28} />
        </span>
        <p className="eyebrow">CHALLENGE COMPLETED</p>
        <h3 ref={titleRef} tabIndex={-1}>
          {score === maxScore(c) ? "That’s a keeper." : "A little clearer now."}
        </h3>
        <p>
          {score === maxScore(c)
            ? "Every first answer landed. Keep that understanding close."
            : "You worked through it. The corrections count as learning, too."}
        </p>
      </div>
      <div className="score-row">
        <div>
          <strong>
            {score}
            <span> / {maxScore(c)}</span>
          </strong>
          <span>This attempt</span>
        </div>
        <div>
          <strong>
            {result?.best ?? score}
            <span> / {maxScore(c)}</span>
          </strong>
          <span>Personal best</span>
        </div>
        <div className="score-method">
          {c.type === "pipeline"
            ? "1 point for a completely correct first submission."
            : c.type === "matching"
              ? "1 point for each pair matched correctly on its first try."
              : "1 point for each situation’s correct first choice."}
          <br />A retry replaces the latest score; your best is kept.
        </div>
      </div>
      <section className="review-section">
        <h4>
          {review.length ? "Worth another look" : "What to take with you"}
        </h4>
        {review.length ? (
          <ul>
            {review.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        ) : (
          <p>
            {c.type === "pipeline"
              ? "Design, build, upload the code, then connect hosting: a workflow you can explain."
              : c.type === "matching"
                ? "Choose the tool or file for its job: storage, hosting, building, backend, structure, style, or behaviour."
                : "Choose the next step by finding what is actually missing: upload, review, hosting, or saved data."}
          </p>
        )}
      </section>
      <details className="result-explanations" open={c.type === "pipeline"}>
        <summary>Review the answers & explanations</summary>
        {c.type === "pipeline" ? (
          <ol className="explanation-list">
            {c.steps.map((p) => (
              <li key={p.id}>
                <strong>{p.text}</strong>
                <p>{p.explanation}</p>
                <Citation source={p.source} />
              </li>
            ))}
          </ol>
        ) : c.type === "matching" ? (
          c.rounds.map((r) => (
            <div key={r.title}>
              <h4>{r.title}</h4>
              <p className="muted">{r.note}</p>
              {r.pairs.map((p) => (
                <div className="answer-review" key={p.id}>
                  <strong>
                    {p.task} → {p.answer}
                  </strong>
                  <p>{p.explanation}</p>
                  <Citation source={p.source} />
                </div>
              ))}
            </div>
          ))
        ) : (
          c.scenarios.map((q) => (
            <div className="answer-review" key={q.id}>
              <strong>{q.prompt}</strong>
              <p>{q.options.find((o) => o.id === q.answer)!.why}</p>
              <Citation source={q.source} />
            </div>
          ))
        )}
      </details>
      <div className="result-actions">
        <button className="button primary" onClick={retry}>
          Try again
          <Icon name="arrow" size={18} />
        </button>
        <button className="button secondary" onClick={back}>
          Back to session
        </button>
      </div>
    </div>
  );
}
