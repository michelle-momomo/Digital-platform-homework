import { useEffect, useRef, useState } from "react";
import { Sprite } from "./AvatarView";
import type { AssignStep, ChoiceStep, Level, OrderStep, PokerStep, Region, Step } from "./content";
import { gradedCount } from "./content";
import { rate, voiceRank } from "./logic";
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

  const shownStars = Math.min(3, correct.current);

  return (
    <main className={`sheet theme-${region.id}`}>
      <header className="hud">
        <button className="text-btn" onClick={onExit}>
          ← Map path
        </button>
        <span className="level-dots" aria-label={`Level ${index + 1} of ${region.levels.length}`}>
          {region.levels.map((item, i) => (
            <i key={item.id} className={i === index ? "now" : i < index ? "done" : ""} />
          ))}
        </span>
        <span className="stars" aria-label={`${shownStars} stars`}>
          {[1, 2, 3].map((star) => (
            <i key={star} className={star <= shownStars ? "on" : ""} />
          ))}
        </span>
        <b className="combo" key={combo.current}>
          Combo {combo.current}
        </b>
        <span className="timebar" aria-label={left > 0 ? `Bonus ${left}s` : "Bonus over"}>
          <i style={{ width: `${(left / Math.max(1, Math.round(level.limitMs / 1000))) * 100}%` }} />
        </span>
        <button className="ghost tiny" aria-pressed={muted} onClick={() => game.setMute(!game.save.mute)}>
          {muted ? "Muted" : "Sound"}
        </button>
      </header>
      <div className={`scene ${ready ? "cleared" : ""}`}>
        <div className="sky" aria-hidden="true" />
        {game.save.character && (
          <div className={`actor ${mood}`}>
            <Sprite character={game.save.character} className={mood === "happy" ? "hop" : "bounce"} />
            {mood === "sad" && <span className="sweat">💧</span>}
            {mood === "happy" && <span className="flystar" key={tick}>★</span>}
          </div>
        )}
        <div className="board">
          <p className="kicker">
            {region.title} · {level.title}
          </p>
      <p className="prompt">{step.prompt}</p>
      {region.id === "linkedin" && (
        <div className="meter-row">
          <b className="rank">{voiceRank(game.cleared("linkedin"))}</b>
          <span className="sr-only">Citation progress {meter}%</span>
        </div>
      )}
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
            preview={region.id === "linkedin"}
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
        {mood === "happy" && <ConfettiLite />}
        {region.id === "vibe" && (
          <div className={`rocket ${ready ? "launch" : ""}`} aria-hidden="true">
            <span>🚀</span>
          </div>
        )}
      </div>
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

function iconFor(label: string) {
  const icons = ["✦", "❀", "★", "☁", "♥", "✎", "✿", "◆"];
  let n = 0;
  for (const ch of label) n += ch.charCodeAt(0);
  return icons[n % icons.length];
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
  const [picked, setPicked] = useState<number | null>(null);
  const list = useRef<HTMLOListElement>(null);
  const moved = useRef(false);
  const dragRef = useRef<number | null>(null);
  const correct = step.items.map((item) => item.id);
  function move(from: number, to: number) {
    setOrder((current) => {
      if (from === to || to < 0 || to >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }
  function check() {
    order.forEach((id, index) => onMark(id, id === correct[index]));
    onReveal(step.why, step.source, order.every((id, index) => id === correct[index]));
  }
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
    <>
      <ol className="stack" ref={list}>
        {order.map((id, index) => {
          const item = step.items.find((entry) => entry.id === id)!;
          return (
            <li
              key={id}
              className={drag === index || picked === index ? "lift" : ""}
              onPointerDown={(event) => {
                if ((event.target as HTMLElement).closest("button")) return;
                moved.current = false;
                dragRef.current = index;
                setDrag(index);
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const from = dragRef.current;
                if (from === null || from !== index) return;
                if (Math.abs(event.movementY) > 2) moved.current = true;
                const to = placeAt(event.clientY);
                if (to !== from) {
                  move(from, to);
                  dragRef.current = to;
                  setDrag(to);
                }
              }}
              onPointerUp={() => {
                if (!moved.current && dragRef.current === index) {
                  if (picked === null) setPicked(index);
                  else {
                    move(picked, index);
                    setPicked(null);
                  }
                }
                dragRef.current = null;
                setDrag(null);
              }}
            >
              <span className="slot">{index + 1}</span>
              <span className="ico" aria-hidden="true">{iconFor(item.label)}</span>
              <b>{item.label}</b>
              <span className="mini">
                <button aria-label={`Move ${item.label} up`} onClick={() => move(index, index - 1)}>
                  ▲
                </button>
                <button aria-label={`Move ${item.label} down`} onClick={() => move(index, index + 1)}>
                  ▼
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
  preview,
  onMark,
  onReveal,
}: {
  step: ChoiceStep;
  preview?: boolean;
  onMark: (ok: boolean) => void;
  onReveal: (why: string, source: string) => void;
}) {
  const [options] = useState(() => shuffle(step.options));
  const [picked, setPicked] = useState("");
  const [hover, setHover] = useState("");
  const shown = options.find((option) => option.id === (picked || hover));
  const [followers, setFollowers] = useState(1200);
  useEffect(() => {
    if (!preview || !picked) return;
    const target = picked === step.answer ? 1480 : 1224;
    const timer = window.setInterval(() => {
      setFollowers((value) => (value >= target ? target : value + Math.ceil((target - value) / 6)));
    }, 40);
    return () => window.clearInterval(timer);
  }, [picked, preview, step.answer]);
  const live = picked ? (picked === step.answer ? 100 : 22) : hover === step.answer ? 78 : hover ? 30 : 12;
  return (
    <>
      {preview && (
        <article className="post-card">
          <small>Post preview</small>
          <b>{shown?.label ?? "Hover a line to see the post"}</b>
          <span>Followers {followers.toLocaleString("en-US")}</span>
          <span className="gauge big" aria-label="Live citation meter">
            <i style={{ width: `${live}%` }} />
            <em>Citations {live}</em>
          </span>
        </article>
      )}
      <div className="choices">
        {options.map((option) => (
          <button
            key={option.id}
            className={`tile ${picked && option.id === step.answer ? "good" : picked === option.id ? "bad" : ""}`}
            disabled={!!picked}
            onPointerEnter={() => setHover(option.id)}
            onPointerLeave={() => setHover("")}
            onClick={() => {
              setPicked(option.id);
              onMark(option.id === step.answer);
              onReveal(step.why, step.source);
            }}
          >
            <span className="ico" aria-hidden="true">{iconFor(option.label)}</span>
            {option.label}
          </button>
        ))}
      </div>
    </>
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
  const [ghost, setGhost] = useState<{ id: string; x: number; y: number } | null>(null);
  const dragging = useRef("");
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
  const tokenAt = cursor < 0 ? 0 : Math.max(0, step.agents.findIndex((agent) => agent.id === step.tasks[cursor]?.agent));
  const jammed = step.tasks.find((task) => task.id === jam);
  return (
    <>
      <div className="desk">
        {step.agents.map((agent, index) => (
          <div key={agent.id} className="seat">
            {index > 0 && <span className="arrow" aria-hidden="true">→</span>}
            <div
              role="button"
              tabIndex={0}
              data-agent={agent.id}
              aria-label={`Desk ${agent.label}`}
              className={`agent ${jam && placed[jam] === agent.id ? "shake" : ""} ${cursor >= 0 && step.tasks[cursor]?.agent === agent.id ? "lit" : ""}`}
              style={{ ["--seat" as string]: color }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                drop(agent.id, event.dataTransfer.getData("text/plain") || dragging.current);
              }}
              onClick={() => drop(agent.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter") drop(agent.id);
              }}
            >
              <span className="bot" aria-hidden="true">
                {agent.id === "you" ? "🙂" : agent.id === "buyer" || agent.id === "analyst" ? "📦" : "🤖"}
              </span>
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
              {jam && placed[jam] === agent.id && jammed && <span className="puff">{jammed.why}</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="conveyor" aria-hidden="true">
        <span className="token" style={{ left: `${(tokenAt / Math.max(1, step.agents.length - 1)) * 86}%` }} />
      </div>
      <div className="tasks">
        {tasks.filter((task) => !placed[task.id]).map((task) => (
          <button
            key={task.id}
            draggable={!placed[task.id]}
            disabled={!!placed[task.id]}
            aria-pressed={selected === task.id}
            className={selected === task.id ? "picked tile" : "tile"}
            onDragStart={(event) => {
              dragging.current = task.id;
              event.dataTransfer.setData("text/plain", task.id);
            }}
            onPointerDown={(event) => {
              if (placed[task.id]) return;
              dragging.current = task.id;
              setSelected(task.id);
              setGhost({ id: task.id, x: event.clientX, y: event.clientY });
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (dragging.current !== task.id) return;
              setGhost({ id: task.id, x: event.clientX, y: event.clientY });
            }}
            onPointerUp={(event) => {
              const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-agent]");
              const agentId = hit?.getAttribute("data-agent");
              if (agentId) drop(agentId, task.id);
              dragging.current = "";
              setGhost(null);
            }}
            onClick={() => setSelected(task.id)}
          >
            <span className="ico" aria-hidden="true">{iconFor(task.label)}</span>
            {task.label}
          </button>
        ))}
      </div>
      {ghost && (
        <div className="ghost-tile" style={{ left: ghost.x, top: ghost.y }}>
          {tasks.find((task) => task.id === ghost.id)?.label}
        </div>
      )}
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
      <div className="felt">
      <div className="cards">
        {cards.map((card) => (
          <article key={card.id} className={calls[card.id] === true ? "held" : calls[card.id] === false ? "folded" : ""}>
            <p>{card.text}</p>
            <div className="chips">
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
