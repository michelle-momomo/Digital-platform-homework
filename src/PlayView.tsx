import { useEffect, useRef, useState } from "react";
import { Sprite } from "./AvatarView";
import type { AssignStep, ChoiceStep, Level, OrderStep, PokerStep, Region, Step } from "./content";
import { gradedCount } from "./content";
import { rate } from "./logic";
import { sfx } from "./sfx";
import { useGame } from "./store";
import type { LevelResult } from "./storage";

function shuffle<T>(items: T[]) {
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

export function PlayView({
  region,
  level,
  index,
  muted,
  onExit,
  onDone,
}: {
  region: Region;
  level: Level;
  index: number;
  muted: boolean;
  onExit: () => void;
  onDone: (result: LevelResult) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [why, setWhy] = useState("");
  const [source, setSource] = useState("");
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);
  const [mood, setMood] = useState<"idle" | "happy" | "sad">("idle");
  const [left, setLeft] = useState(Math.round(level.limitMs / 1000));
  const game = useGame();
  const seen = useRef(new Set<string>());
  const correct = useRef(0);
  const combo = useRef(0);
  const bestCombo = useRef(0);
  const started = useRef(Date.now());
  const step = level.steps[stepIndex];
  const total = gradedCount(level);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  function mark(key: string, ok: boolean) {
    if (seen.current.has(key)) return;
    seen.current.add(key);
    if (ok) {
      correct.current += 1;
      combo.current += 1;
      bestCombo.current = Math.max(bestCombo.current, combo.current);
      sfx("ok", muted);
      setMood("happy");
    } else {
      combo.current = 0;
      sfx("bad", muted);
      setMood("sad");
    }
    setTick((value) => value + 1);
  }

  function finish() {
    const ms = Date.now() - started.current;
    const rated = rate(correct.current, total, ms, level.limitMs, bestCombo.current);
    onDone({
      ...rated,
      correct: correct.current,
      total,
      ms,
      at: new Date().toISOString(),
    });
  }

  function next() {
    if (stepIndex < level.steps.length - 1) {
      setStepIndex((value) => value + 1);
      setReady(false);
      setWhy("");
      return;
    }
    sfx("fanfare", muted);
    finish();
  }

  const meter = total === 0 ? 0 : Math.round((correct.current / total) * 100);

  return (
    <main className="sheet">
      <button className="text-btn" onClick={onExit}>
        ← Map path
      </button>
      <div className="play-top">
        <p>
          {region.title} · {index + 1}/{region.levels.length}
        </p>
        <p>{level.title}</p>
      </div>
      <div className="hud">
        <b className="combo" key={combo.current}>
          Combo {combo.current}
        </b>
        <span className="timebar" aria-label={left > 0 ? `Bonus ${left}s` : "Bonus over"}>
          <i style={{ width: `${(left / Math.max(1, Math.round(level.limitMs / 1000))) * 100}%` }} />
        </span>
        {region.id === "linkedin" && (
          <span className="gauge" aria-label="AI citation meter">
            <i style={{ width: `${meter}%` }} />
            <em>Citations</em>
          </span>
        )}
      </div>
      <div className="scene">
        {game.save.character && (
          <div className={`actor ${mood}`}>
            <Sprite character={game.save.character} className={mood === "happy" ? "hop" : "bounce"} />
            {mood === "sad" && <span className="sweat">!</span>}
          </div>
        )}
        <div className="board">
      <p className="prompt">{step.prompt}</p>
      {step.kind === "order" && (
        <OrderPlay
          key={stepIndex}
          step={step}
          onMark={(id, ok) => mark(`${stepIndex}:${id}`, ok)}
          onReveal={(line, src, done) => {
            setWhy(line);
            setSource(src);
            setReady(done);
          }}
        />
      )}
      {step.kind === "choice" && (
        <ChoicePlay
          key={stepIndex}
          step={step}
          onMark={(ok) => mark(`${stepIndex}:choice`, ok)}
          onReveal={(line, src) => {
            setWhy(line);
            setSource(src);
            setReady(true);
          }}
        />
      )}
      {step.kind === "assign" && (
        <AssignPlay
          key={stepIndex}
          step={step}
          color={region.color}
          onMark={(id, ok) => mark(`${stepIndex}:${id}`, ok)}
          onReveal={(line, src, done) => {
            setWhy(line);
            setSource(src);
            setReady(done);
          }}
        />
      )}
      {step.kind === "poker" && (
        <PokerPlay
          key={stepIndex}
          step={step}
          onMark={(id, ok) => mark(`${stepIndex}:${id}`, ok)}
          onReveal={(line, src, done) => {
            setWhy(line);
            setSource(src);
            setReady(done);
          }}
        />
      )}
      {why && (
        <p className="reveal" role="status">
          {why} <span className="src">{source}</span>
        </p>
      )}
      {ready && (
        <button className="go" onClick={next}>
          {stepIndex === level.steps.length - 1 ? "Finish" : "Next"}
        </button>
      )}
        </div>
      </div>
      {mood === "happy" && <ConfettiLite />}
      <span className="sr-only">{tick}</span>
    </main>
  );
}

function ConfettiLite() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} style={{ left: `${8 + i * 9}%` }} />
      ))}
    </div>
  );
}

function OrderPlay({
  step,
  onMark,
  onReveal,
}: {
  step: OrderStep;
  onMark: (id: string, ok: boolean) => void;
  onReveal: (why: string, source: string, done: boolean) => void;
}) {
  const [order, setOrder] = useState(() => dealOrder(step));
  const [drag, setDrag] = useState<number | null>(null);
  const correct = step.items.map((item) => item.id);
  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrder(next);
  }
  function check() {
    order.forEach((id, index) => onMark(id, id === correct[index]));
    onReveal(step.why, step.source, order.every((id, index) => id === correct[index]));
  }
  return (
    <>
      <ol className="stack">
        {order.map((id, index) => {
          const item = step.items.find((entry) => entry.id === id)!;
          return (
            <li
              key={id}
              draggable
              onDragStart={() => setDrag(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (drag !== null) move(drag, index);
                setDrag(null);
              }}
            >
              <span>{index + 1}</span>
              <b>{item.label}</b>
              <span className="mini">
                <button aria-label={`Move ${item.label} up`} onClick={() => move(index, index - 1)}>
                  Up
                </button>
                <button aria-label={`Move ${item.label} down`} onClick={() => move(index, index + 1)}>
                  Down
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      <button className="go" onClick={check}>
        Check order
      </button>
    </>
  );
}

function ChoicePlay({
  step,
  onMark,
  onReveal,
}: {
  step: ChoiceStep;
  onMark: (ok: boolean) => void;
  onReveal: (why: string, source: string) => void;
}) {
  const [options] = useState(() => shuffle(step.options));
  const [picked, setPicked] = useState("");
  return (
    <div className="choices">
      {options.map((option) => (
        <button
          key={option.id}
          className={picked && option.id === step.answer ? "good" : picked === option.id ? "bad" : ""}
          disabled={!!picked}
          onClick={() => {
            setPicked(option.id);
            onMark(option.id === step.answer);
            onReveal(step.why, step.source);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function AssignPlay({
  step,
  color,
  onMark,
  onReveal,
}: {
  step: AssignStep;
  color: string;
  onMark: (id: string, ok: boolean) => void;
  onReveal: (why: string, source: string, done: boolean) => void;
}) {
  const [tasks] = useState(() => shuffle(step.tasks));
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState("");
  const [cursor, setCursor] = useState(-1);
  const [jam, setJam] = useState("");
  function lift(taskId: string) {
    setPlaced((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
    setJam("");
  }
  function drop(agentId: string, taskId = selected) {
    if (!taskId || placed[taskId]) return;
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
    for (let i = 0; i < step.tasks.length; i++) {
      const task = step.tasks[i];
      setCursor(i);
      setJam("");
      await wait(380);
      if (placed[task.id] !== task.agent) {
        setJam(task.id);
        onReveal(task.why, task.source, false);
        return;
      }
    }
    onReveal("The chain ran clean.", step.tasks[0].source, true);
  }
  return (
    <>
      <div className="desk">
        {step.agents.map((agent) => (
          <div
            key={agent.id}
            role="button"
            tabIndex={0}
            aria-label={`Desk ${agent.label}`}
            className={`agent ${cursor >= 0 && step.tasks[cursor]?.agent === agent.id ? "lit" : ""}`}
            style={{ background: color }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              drop(agent.id, event.dataTransfer.getData("text/plain"));
            }}
            onClick={() => drop(agent.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter") drop(agent.id);
            }}
          >
            <b>{agent.label}</b>
            <small>{agent.note}</small>
            {step.tasks
              .filter((task) => placed[task.id] === agent.id)
              .map((task) => (
                <button
                  key={task.id}
                  className={jam === task.id ? "chip smoke" : "chip"}
                  onClick={(event) => {
                    event.stopPropagation();
                    lift(task.id);
                  }}
                >
                  {task.label}
                </button>
              ))}
          </div>
        ))}
      </div>
      <div className="tasks">
        {tasks.map((task) => (
          <button
            key={task.id}
            draggable={!placed[task.id]}
            disabled={!!placed[task.id]}
            aria-pressed={selected === task.id}
            className={selected === task.id ? "picked" : ""}
            onDragStart={(event) => event.dataTransfer.setData("text/plain", task.id)}
            onClick={() => setSelected(task.id)}
          >
            {task.label}
          </button>
        ))}
      </div>
      <button className="go" onClick={() => void run()} disabled={Object.keys(placed).length < step.tasks.length}>
        Run
      </button>
    </>
  );
}

function PokerPlay({
  step,
  onMark,
  onReveal,
}: {
  step: PokerStep;
  onMark: (id: string, ok: boolean) => void;
  onReveal: (why: string, source: string, done: boolean) => void;
}) {
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
  return (
    <>
      <div className="cards">
        {cards.map((card) => (
          <article key={card.id}>
            <p>{card.text}</p>
            <div>
              <button
                aria-pressed={calls[card.id] === true}
                aria-label={`Hold. ${card.text}`}
                onClick={() => setCalls((prev) => ({ ...prev, [card.id]: true }))}
              >
                Hold
              </button>
              <button
                aria-pressed={calls[card.id] === false}
                aria-label={`Fold. ${card.text}`}
                onClick={() => setCalls((prev) => ({ ...prev, [card.id]: false }))}
              >
                Fold
              </button>
            </div>
          </article>
        ))}
      </div>
      <button className="go" onClick={show}>
        Show the hand
      </button>
    </>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function stepKind(step: Step) {
  return step.kind;
}
