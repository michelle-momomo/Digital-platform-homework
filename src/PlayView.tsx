import { useEffect, useRef, useState } from "react";
import { MiniLevel } from "./mini";
import type { AssignStep, ChoiceStep, Level, OrderStep, PokerStep, Region } from "./content";
import { gradedCount } from "./content";
import { LevelShell, leaveLabel, type FootAction, type Verdict } from "./LevelShell";
import { rate, starLines } from "./logic";
import { sfx } from "./sfx";
import type { LevelResult } from "./storage";
import { ToolIcon } from "./toolIcons";

export function shuffle<T>(items: T[]) {
  // Fisher-Yates
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function dealOrder(step: OrderStep) {
  const ids = step.items.map((item) => item.id);
  let order = shuffle(ids);
  if (order.every((id, i) => id === ids[i])) order = [...order.slice(1), order[0]];
  return order;
}

type PlayProps = {
  region: Region;
  level: Level;
  index: number;
  muted: boolean;
  onExit: () => void;
  onDone: (result: LevelResult) => void;
};

/** What an answer component hands the shell: the submit button for the idle bar. */
type Bind = (action: FootAction | undefined) => void;

const HINTS = {
  choice: "Tap an answer. Wrong picks cost the bonus star.",
  order: "Drag the cards or use the arrows, then check the order.",
  assign: "Tap a job, then tap its tool. Or drag the job onto the tool.",
  poker: "Hold or fold every card, then show the hand.",
};

export function PlayView(props: PlayProps) {
  if (props.region.id === "vibe" && props.level.id === "pipeline") return <SimpleLevel {...props} />;
  if (props.region.id === "agentic" || props.region.id === "linkedin") return <MiniLevel {...props} />;
  return <StepLevel {...props} />;
}

/** Vibe Coding level 1: one tap question, scored on the first try. */
function SimpleLevel({ region, level, index, muted, onExit, onDone }: PlayProps) {
  const step = level.steps[0];
  const choice = step?.kind === "choice" ? step : null;
  const [wrongId, setWrongId] = useState("");
  const [ok, setOk] = useState(false);
  const missed = useRef(false);
  const started = useRef(Date.now());
  const [options] = useState(() => (choice ? shuffle(choice.options) : []));

  if (!choice) return null;
  const total = gradedCount(level);
  const correct = missed.current ? 0 : 1;
  const stars = rate(correct, total, Date.now() - started.current, level.limitMs, correct).stars;

  function pick(id: string) {
    if (ok || !choice) return;
    if (id === choice.answer) {
      setOk(true);
      setWrongId("");
      sfx("ok", muted);
      return;
    }
    missed.current = true;
    setWrongId(id);
    sfx("bad", muted);
  }

  function finish() {
    if (!choice) return;
    const ms = Date.now() - started.current;
    const rated = rate(correct, total, ms, level.limitMs, correct);
    sfx("fanfare", muted);
    onDone({ ...rated, correct, total, ms, at: new Date().toISOString() });
  }

  const verdict: Verdict = ok
    ? {
        kind: "good",
        title: `Correct! +${stars}★`,
        text: choice.why,
        tag: choice.source,
        lines: starLines(correct, total, Date.now() - started.current, level.limitMs),
        action: { label: leaveLabel(region, index), onClick: finish },
      }
    : wrongId
      ? { kind: "bad", text: choice.why, tag: choice.source, action: { label: "Try again", onClick: () => setWrongId("") } }
      : { kind: "idle", hint: HINTS.choice };

  return (
    <LevelShell
      region={region}
      level={level}
      index={index}
      started={started.current}
      stars={ok ? stars : 0}
      combo={ok ? 1 : 0}
      prompt={choice.prompt}
      onExit={onExit}
      verdict={verdict}
    >
      <Options
        options={options}
        answer={choice.answer}
        wrongId={wrongId}
        solved={ok}
        onPick={pick}
      />
    </LevelShell>
  );
}

/** A/B/C option list from the reference: neutral until graded. */
function Options({
  options,
  answer,
  wrongId,
  solved,
  onPick,
}: {
  options: { id: string; label: string }[];
  answer: string;
  wrongId: string;
  solved: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <div className={`opts ${solved ? "locked" : ""}`}>
      {options.map((option, i) => {
        const state = solved ? (option.id === answer ? "good" : "dim") : option.id === wrongId ? "bad" : "";
        return (
          <button
            type="button"
            key={option.id}
            className={`opt ${state}`}
            disabled={solved}
            onClick={() => onPick(option.id)}
          >
            <span className="key" aria-hidden="true">
              {String.fromCharCode(65 + i)}
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Vibe Coding levels 2-6: one or more steps (choice, order, assign). */
function StepLevel({ region, level, index, muted, onExit, onDone }: PlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [why, setWhy] = useState("");
  const [source, setSource] = useState("");
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const [, setTick] = useState(0);
  const [submit, setSubmit] = useState<FootAction | undefined>(undefined);
  const seen = useRef(new Map<string, boolean>());
  const correct = useRef(0);
  const combo = useRef(0);
  const bestCombo = useRef(0);
  const started = useRef(Date.now());
  const step = level.steps[stepIndex];
  const total = gradedCount(level);
  const lastStep = stepIndex === level.steps.length - 1;

  function mark(key: string, ok: boolean) {
    seen.current.set(key, ok);
    correct.current = [...seen.current.values()].filter(Boolean).length;
    setTick((value) => value + 1);
  }
  function grade(ok: boolean) {
    if (ok) {
      combo.current += 1;
      bestCombo.current = Math.max(bestCombo.current, combo.current);
      sfx("ok", muted);
    } else {
      combo.current = 0;
      sfx("bad", muted);
    }
  }
  function reveal(line: string, src: string, done: boolean) {
    setWhy(line);
    setSource(src);
    setReady(done);
    grade(done);
  }
  function finish() {
    const ms = Date.now() - started.current;
    const rated = rate(correct.current, total, ms, level.limitMs, bestCombo.current);
    sfx("fanfare", muted);
    onDone({ ...rated, correct: correct.current, total, ms, at: new Date().toISOString() });
  }
  function next() {
    if (!lastStep) {
      setStepIndex((value) => value + 1);
      setReady(false);
      setWhy("");
      setSubmit(undefined);
      window.scrollTo(0, 0);
      return;
    }
    finish();
  }
  function tryAgain() {
    setWhy("");
    setRetry((value) => value + 1);
  }

  if (step.kind !== "order" && step.kind !== "choice" && step.kind !== "assign" && step.kind !== "poker") return null;

  const elapsed = Date.now() - started.current;
  const shown = rate(correct.current, total, elapsed, level.limitMs, bestCombo.current);
  const verdict: Verdict = ready
    ? lastStep
      ? {
          kind: "good",
          title: `Correct! +${shown.stars}★`,
          text: why,
          tag: source,
          lines: starLines(correct.current, total, elapsed, level.limitMs),
          action: { label: leaveLabel(region, index), onClick: next },
        }
      : { kind: "good", title: "Correct!", text: why, tag: source, action: { label: "Next question →", onClick: next } }
    : why
      ? { kind: "bad", text: why, tag: source, action: { label: "Try again", onClick: tryAgain } }
      : { kind: "idle", hint: HINTS[step.kind], action: submit };

  const common = {
    retry,
    bind: setSubmit as Bind,
    onReveal: reveal,
  };

  return (
    <LevelShell
      region={region}
      level={level}
      index={index}
      started={started.current}
      stars={correct.current > 0 ? shown.stars : 0}
      combo={combo.current}
      prompt={step.prompt}
      onExit={onExit}
      verdict={verdict}
    >
      {level.steps.length > 1 && (
        <p className="step-count">
          Question {stepIndex + 1} of {level.steps.length}
        </p>
      )}
      {step.kind === "order" && (
        <OrderPlay key={stepIndex} {...common} step={step} onMark={(id, ok) => mark(`${stepIndex}:${id}`, ok)} />
      )}
      {step.kind === "choice" && (
        <ChoicePlay key={stepIndex} {...common} step={step} onMark={(ok) => mark(`${stepIndex}:choice`, ok)} />
      )}
      {step.kind === "assign" && (
        <AssignPlay key={stepIndex} {...common} step={step} onMark={(id, ok) => mark(`${stepIndex}:${id}`, ok)} />
      )}
      {step.kind === "poker" && (
        <PokerPlay key={stepIndex} {...common} step={step} onMark={(id, ok) => mark(`${stepIndex}:${id}`, ok)} />
      )}
    </LevelShell>
  );
}

type ChildProps = {
  retry: number;
  bind: Bind;
  onReveal: (why: string, source: string, done: boolean) => void;
};

function ChoicePlay({
  step,
  retry,
  onMark,
  onReveal,
}: ChildProps & { step: ChoiceStep; onMark: (ok: boolean) => void }) {
  const [options] = useState(() => shuffle(step.options));
  const [picked, setPicked] = useState("");
  useEffect(() => {
    if (retry) setPicked("");
  }, [retry]);
  const solved = picked === step.answer;
  return (
    <Options
      options={options}
      answer={step.answer}
      wrongId={solved ? "" : picked}
      solved={solved}
      onPick={(id) => {
        const ok = id === step.answer;
        setPicked(id);
        onMark(ok);
        onReveal(step.why, step.source, ok);
      }}
    />
  );
}

function OrderPlay({
  step,
  retry,
  bind,
  onMark,
  onReveal,
}: ChildProps & { step: OrderStep; onMark: (id: string, ok: boolean) => void }) {
  const [order, setOrder] = useState(() => dealOrder(step));
  const [drag, setDrag] = useState<number | null>(null);
  const [marks, setMarks] = useState<Record<string, boolean> | null>(null);
  const list = useRef<HTMLOListElement>(null);
  const dragRef = useRef<number | null>(null);
  const correct = step.items.map((item) => item.id);
  const solved = !!marks && order.every((id, index) => id === correct[index]);

  useEffect(() => {
    if (retry) setMarks(null);
  }, [retry]);

  function move(from: number, to: number) {
    setMarks(null);
    setOrder((current) => {
      if (from === to || to < 0 || to >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }
  function check() {
    const next: Record<string, boolean> = {};
    order.forEach((id, index) => {
      next[id] = id === correct[index];
      onMark(id, next[id]);
    });
    setMarks(next);
    onReveal(step.why, step.source, order.every((id, index) => id === correct[index]));
  }
  const checkRef = useRef(check);
  checkRef.current = check;
  useEffect(() => {
    bind(solved ? undefined : { label: "Check order", onClick: () => checkRef.current() });
  }, [bind, solved]);

  function placeAt(clientY: number) {
    const rows = [...(list.current?.querySelectorAll("li") ?? [])];
    let to = 0;
    rows.forEach((row, index) => {
      const box = row.getBoundingClientRect();
      if (clientY > box.top + box.height / 2) to = index;
    });
    return to;
  }
  return (
    <ol className={`order ${solved ? "locked" : ""}`} ref={list}>
      {order.map((id, index) => {
        const item = step.items.find((entry) => entry.id === id)!;
        const state = marks ? (marks[id] ? "good" : "bad") : "";
        return (
          <li
            key={id}
            className={`opt order-row ${drag === index ? "lift" : ""} ${state}`}
            onPointerDown={(event) => {
              if (solved || (event.target as HTMLElement).closest("button")) return;
              dragRef.current = index;
              setDrag(index);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const from = dragRef.current;
              if (from === null || from !== index) return;
              const to = placeAt(event.clientY);
              if (to !== from) {
                move(from, to);
                dragRef.current = to;
                setDrag(to);
              }
            }}
            onPointerUp={() => {
              dragRef.current = null;
              setDrag(null);
            }}
            onPointerCancel={() => {
              dragRef.current = null;
              setDrag(null);
            }}
          >
            <span className="key" aria-hidden="true">
              {index + 1}
            </span>
            <span className="order-label">{item.label}</span>
            <span className="order-moves">
              <button
                type="button"
                className="btn btn-text"
                aria-label={`Move ${item.label} up`}
                disabled={solved || index === 0}
                onClick={() => move(index, index - 1)}
              >
                ▲
              </button>
              <button
                type="button"
                className="btn btn-text"
                aria-label={`Move ${item.label} down`}
                disabled={solved || index === order.length - 1}
                onClick={() => move(index, index + 1)}
              >
                ▼
              </button>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function AssignPlay({
  step,
  retry,
  bind,
  onMark,
  onReveal,
}: ChildProps & { step: AssignStep; onMark: (id: string, ok: boolean) => void }) {
  const [tasks] = useState(() => shuffle(step.tasks));
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState("");
  const [cursor, setCursor] = useState(-1);
  const [jam, setJam] = useState("");
  const [cleared, setCleared] = useState(false);
  const [running, setRunning] = useState(false);
  const [ghost, setGhost] = useState<{ id: string; x: number; y: number } | null>(null);
  const [dragId, setDragId] = useState("");
  const touch = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected("");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // "Try again" lifts every job that sits on the wrong tool.
  useEffect(() => {
    if (!retry) return;
    setPlaced((prev) => {
      const next: Record<string, string> = {};
      for (const [taskId, agentId] of Object.entries(prev)) {
        if (step.tasks.find((task) => task.id === taskId)?.agent === agentId) next[taskId] = agentId;
      }
      return next;
    });
    setJam("");
    setCursor(-1);
  }, [retry, step.tasks]);

  function lift(taskId: string) {
    if (cleared || running) return;
    setPlaced((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
    setJam("");
  }
  function drop(agentId: string, taskId = selected) {
    if (!taskId || placed[taskId] || cleared || running) return;
    const task = step.tasks.find((item) => item.id === taskId)!;
    setPlaced((prev) => ({ ...prev, [taskId]: agentId }));
    onMark(taskId, agentId === task.agent);
    setSelected("");
    if (agentId !== task.agent) {
      setJam(taskId);
      onReveal(task.why, task.source, false);
    }
  }
  async function run() {
    if (Object.keys(placed).length < step.tasks.length) return;
    setRunning(true);
    for (let i = 0; i < step.tasks.length; i++) {
      const task = step.tasks[i];
      setCursor(i);
      setJam("");
      await wait(380);
      if (placed[task.id] !== task.agent) {
        setJam(task.id);
        setRunning(false);
        onReveal(task.why, task.source, false);
        return;
      }
    }
    setRunning(false);
    setCleared(true);
    onReveal("The chain ran clean.", step.tasks[0].source, true);
  }
  const runRef = useRef(run);
  runRef.current = run;
  const full = Object.keys(placed).length === step.tasks.length;
  useEffect(() => {
    bind(cleared ? undefined : { label: "Run", disabled: !full || running, onClick: () => void runRef.current() });
  }, [bind, cleared, full, running]);

  const ready = !!(selected || dragId);
  return (
    <div className="assign">
      <div className="slots">
        {step.agents.map((agent) => {
          const here = step.tasks.filter((task) => placed[task.id] === agent.id);
          return (
            <div
              key={agent.id}
              role="button"
              tabIndex={0}
              data-agent={agent.id}
              aria-label={`Tool ${agent.label}`}
              className={`slot ${ready ? "ready" : ""} ${jam && placed[jam] === agent.id ? "shake" : ""} ${cursor >= 0 && step.tasks[cursor]?.agent === agent.id ? "lit" : ""}`}
              onClick={() => drop(agent.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  drop(agent.id);
                }
              }}
            >
              <div className="nm">
                <ToolIcon id={agent.id} size={20} />
                <span>{agent.label}</span>
              </div>
              <div className="drop">
                {here.length === 0 && <span>Drop here</span>}
                {here.map((task) => (
                  <button
                    type="button"
                    key={task.id}
                    className={`chip ${jam === task.id ? "bad" : ""} ${cleared ? "good" : ""}`}
                    aria-label={`${task.label}. Tap to take it back.`}
                    onClick={(event) => {
                      event.stopPropagation();
                      lift(task.id);
                    }}
                  >
                    {task.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {tasks.some((task) => !placed[task.id]) && (
        <div className="jobs">
          {tasks
            .filter((task) => !placed[task.id])
            .map((task) => (
              <button
                type="button"
                key={task.id}
                aria-pressed={selected === task.id}
                className={`job ${selected === task.id ? "picked" : ""} ${dragId === task.id ? "dragging" : ""}`}
                onPointerDown={(event) => {
                  // One pointer-based drag for mouse, touch and pen. Nothing is selected here,
                  // so a plain tap still reaches onClick; a drag starts only after 10px of movement.
                  if (event.button !== 0) return;
                  touch.current = { id: task.id, x: event.clientX, y: event.clientY, moved: false };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  const t = touch.current;
                  if (!t || t.id !== task.id) return;
                  if (!t.moved && Math.hypot(event.clientX - t.x, event.clientY - t.y) < 10) return;
                  if (!t.moved) {
                    t.moved = true;
                    setDragId(task.id);
                  }
                  setGhost({ id: task.id, x: event.clientX, y: event.clientY });
                }}
                onPointerUp={(event) => {
                  const t = touch.current;
                  touch.current = null;
                  if (!t || !t.moved) return;
                  suppressClick.current = true;
                  const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-agent]");
                  const agentId = hit?.getAttribute("data-agent");
                  if (agentId) drop(agentId, task.id);
                  setDragId("");
                  setGhost(null);
                }}
                onPointerCancel={() => {
                  touch.current = null;
                  setDragId("");
                  setGhost(null);
                }}
                onClick={() => {
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  setSelected((current) => (current === task.id ? "" : task.id));
                }}
              >
                {task.label}
              </button>
            ))}
        </div>
      )}
      {ghost && (
        <div className="ghost-chip" style={{ left: ghost.x, top: ghost.y }}>
          {tasks.find((task) => task.id === ghost.id)?.label}
        </div>
      )}
    </div>
  );
}

function PokerPlay({
  step,
  bind,
  onMark,
  onReveal,
}: ChildProps & { step: PokerStep; onMark: (id: string, ok: boolean) => void }) {
  const [cards] = useState(() => shuffle(step.cards));
  const [calls, setCalls] = useState<Record<string, boolean | undefined>>({});
  function show() {
    if (cards.some((card) => calls[card.id] === undefined)) return;
    cards.forEach((card) => onMark(card.id, calls[card.id] === card.hold));
    const miss = cards.find((card) => calls[card.id] !== card.hold);
    if (miss) {
      onReveal(miss.why, miss.source, false);
      return;
    }
    onReveal("That hand matches what she said.", cards[0].source, true);
  }
  const showRef = useRef(show);
  showRef.current = show;
  const all = cards.every((card) => calls[card.id] !== undefined);
  useEffect(() => {
    bind({ label: "Show the hand", disabled: !all, onClick: () => showRef.current() });
  }, [bind, all]);
  return (
    <div className="opts">
      {cards.map((card) => (
        <div key={card.id} className="opt poker-row">
          <span className="order-label">{card.text}</span>
          <span className="order-moves">
            <button
              type="button"
              className={`btn btn-secondary ${calls[card.id] === true ? "on" : ""}`}
              aria-pressed={calls[card.id] === true}
              aria-label={`Hold. ${card.text}`}
              onClick={() => setCalls((prev) => ({ ...prev, [card.id]: true }))}
            >
              Hold
            </button>
            <button
              type="button"
              className={`btn btn-secondary ${calls[card.id] === false ? "on" : ""}`}
              aria-pressed={calls[card.id] === false}
              aria-label={`Fold. ${card.text}`}
              onClick={() => setCalls((prev) => ({ ...prev, [card.id]: false }))}
            >
              Fold
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
