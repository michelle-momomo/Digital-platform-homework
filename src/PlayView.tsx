import { useEffect, useRef, useState } from "react";
import { Sprite } from "./AvatarView";
import { MiniLevel } from "./mini";
import type { AssignStep, ChoiceStep, Level, OrderStep, PokerStep, Region, Step } from "./content";
import { gradedCount } from "./content";
import { rate, starLines, voiceRank } from "./logic";
import { sfx } from "./sfx";
import { useGame } from "./store";
import { TimeBonus } from "./timebar";
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

function LegacyPlay({
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
  const game = useGame();
  const seen = useRef(new Map<string, boolean>());
  const correct = useRef(0);
  const combo = useRef(0);
  const bestCombo = useRef(0);
  const started = useRef(Date.now());
  const step = level.steps[stepIndex];
  const total = gradedCount(level);

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

  const shown = rate(correct.current, total, Date.now() - started.current, level.limitMs, bestCombo.current);
  const shownStars = shown.stars;
  if (step.kind !== "order" && step.kind !== "choice" && step.kind !== "assign" && step.kind !== "poker") {
    return null;
  }

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
        <TimeBonus limitMs={level.limitMs} started={started.current} />
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
            grade(done);
          }}
        />
      )}
      {step.kind === "choice" && (
          <ChoicePlay
            key={stepIndex}
            preview={region.id === "linkedin"}
            step={step}
          onMark={(ok) => mark(`${stepIndex}:choice`, ok)}
          onReveal={(line, src, done) => {
            setWhy(line);
            setSource(src);
            setReady(done);
            grade(done);
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
            grade(done);
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
            grade(done);
          }}
        />
      )}
      {why && (
        <p className={`result-bar ${ready ? "yes" : "no"}`} role="status">
          {ready
            ? `Correct! ${shown.stars}★`
            : `Not quite ${why}`}{" "}
          <span className="src">{source}</span>
        </p>
      )}
      {ready && (
        <ul className="star-lines">
          {starLines(correct.current, total, Date.now() - started.current, level.limitMs).map((line) => (
            <li key={line.label} className={line.earned ? "on" : ""}>
              {line.earned ? "★" : "☆"} {line.label}: {line.reason}
            </li>
          ))}
        </ul>
      )}
      {ready && (
        <button className="go" onClick={next}>
          {index === region.levels.length - 1 && stepIndex === level.steps.length - 1 ? "Back to map" : "Next level →"}
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
  const [marks, setMarks] = useState<Record<string, boolean> | null>(null);
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
    const next: Record<string, boolean> = {};
    order.forEach((id, index) => {
      next[id] = id === correct[index];
      onMark(id, next[id]);
    });
    setMarks(next);
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
              className={`${drag === index || picked === index ? "lift" : ""} ${marks?.[id] ? "right" : ""} ${marks && marks[id] === false ? "wrong" : ""}`}
              style={marks?.[id] ? { animationDelay: `${index * 80}ms` } : undefined}
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
              <span className="grip" aria-hidden="true">⋮⋮</span>
              <span className="slot">{index + 1}</span>
              <span className="ico" aria-hidden="true">{iconFor(item.label)}</span>
              <b>{item.label}</b>
              {marks?.[id] && <span className="tick" style={{ animationDelay: `${index * 80}ms` }}>✓</span>}
              <span className="mini">
                <button aria-label={`Move ${item.label} up`} disabled={index === 0} onClick={() => move(index, index - 1)}>
                  ▲
                </button>
                <button aria-label={`Move ${item.label} down`} disabled={index === order.length - 1} onClick={() => move(index, index + 1)}>
                  ▼
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      {!(marks && order.every((id, index) => id === correct[index])) && (
        <button className="go" onClick={check}>
          Check order
        </button>
      )}
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
  onReveal: (why: string, source: string, done: boolean) => void;
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
            className={`tile ${picked === step.answer && option.id === step.answer ? "good" : ""} ${picked === option.id && option.id !== step.answer ? "bad" : ""}`}
            disabled={picked === step.answer}
            onPointerEnter={() => setHover(option.id)}
            onPointerLeave={() => setHover("")}
            onClick={() => {
              const ok = option.id === step.answer;
              setPicked(option.id);
              onMark(ok);
              onReveal(step.why, step.source, ok);
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
  const [cleared, setCleared] = useState(false);
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
    setCleared(true);
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
              className={`agent ${jam && placed[jam] === agent.id ? "shake" : ""} ${cursor >= 0 && step.tasks[cursor]?.agent === agent.id ? "lit" : ""} ${selected || dragId ? "placeable" : ""}`}
              style={{ ["--seat" as string]: color }}
              onClick={() => drop(agent.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter") drop(agent.id);
              }}
            >
              <span className="bot" aria-hidden="true">
                {agent.id === "you" ? "🙂" : agent.id === "buyer" || agent.id === "analyst" ? "📦" : "🤖"}
              </span>
              <b>{agent.label}</b>
              <div className="chip-slot">
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
            disabled={!!placed[task.id]}
            aria-pressed={selected === task.id}
            className={selected === task.id ? "picked tile" : "tile"}
            onPointerDown={(event) => {
              // One pointer-based drag for mouse, touch and pen. Nothing is selected here,
              // so a plain tap still reaches onClick; a drag only starts after 10px of movement.
              if (event.button !== 0 || placed[task.id]) return;
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
      {!cleared && (
        <button className="go" onClick={() => void run()} disabled={Object.keys(placed).length < step.tasks.length}>
          Run
        </button>
      )}
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

export function PlayView(props: {
  region: Region;
  level: Level;
  index: number;
  muted: boolean;
  onExit: () => void;
  onDone: (result: LevelResult) => void;
}) {
  if (props.region.id === "vibe" && props.level.id === "pipeline") return <SimpleLevel {...props} />;
  if (props.region.id === "agentic" || props.region.id === "linkedin") return <MiniLevel {...props} />;
  return <LegacyPlay {...props} />;
}

function SimpleLevel({
  level,
  index,
  muted,
  onExit,
  onDone,
  region,
}: {
  region: Region;
  level: Level;
  index: number;
  muted: boolean;
  onExit: () => void;
  onDone: (result: LevelResult) => void;
}) {
  const step = level.steps[0];
  const choice = step?.kind === "choice" ? step : null;
  const [wrongId, setWrongId] = useState("");
  const [ok, setOk] = useState(false);
  const [shake, setShake] = useState("");
  const missed = useRef(false);
  const started = useRef(Date.now());
  const game = useGame();
  const [options] = useState(() => (choice ? shuffle(choice.options) : []));

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
    setShake(id);
    sfx("bad", muted);
    window.setTimeout(() => setShake(""), 420);
  }

  function finish() {
    if (!choice) return;
    const ms = Date.now() - started.current;
    const correct = missed.current ? 0 : 1;
    const rated = rate(correct, gradedCount(level), ms, level.limitMs, correct);
    onDone({
      ...rated,
      correct,
      total: gradedCount(level),
      ms,
      at: new Date().toISOString(),
    });
  }

  if (!choice) return null;

  return (
    <main className={`sheet theme-${region.id} play`}>
      <header className="hud">
        <button className="text-btn" onClick={onExit}>
          ← Back
        </button>
        <span className="level-dots" aria-label={`Level ${index + 1} of ${region.levels.length}`}>
          {region.levels.map((item, i) => (
            <i key={item.id} className={i === index ? "now" : i < index ? "done" : ""} />
          ))}
        </span>
        <b className="combo">Combo {ok ? 1 : 0}</b>
        <TimeBonus limitMs={level.limitMs} started={started.current} />
      </header>
      <section className="play-scene">
        <p className="tap-label">Tap the right answer</p>
        <div className={`actor ${ok ? "happy" : wrongId ? "sad" : ""}`}>
          {game.save.character && (
            <Sprite character={game.save.character} className={ok ? "hop" : "bounce"} />
          )}
        </div>
        <p className="prompt">{choice.prompt}</p>
        <div className="choices">
          {options.map((option) => (
            <button
              key={option.id}
              className={`candy ${ok && option.id === choice.answer ? "good" : ""} ${wrongId === option.id ? "bad" : ""} ${shake === option.id ? "shake" : ""}`}
              onClick={() => pick(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="result-slot">
        {(ok || wrongId) && (
          <p className={`result-bar ${ok ? "yes" : "no"}`} role="status">
            {ok
              ? `Correct! ${rate(missed.current ? 0 : 1, gradedCount(level), Date.now() - started.current, level.limitMs, ok ? 1 : 0).stars}★`
              : `Not quite ${choice.why}`}{" "}
            <span className="src">{choice.source}</span>
          </p>
        )}
        </div>
        {ok && (
          <button className="go big" onClick={() => { sfx("fanfare", muted); finish(); }}>
            {index === region.levels.length - 1 ? "Back to map" : "Next level →"}
          </button>
        )}
        {ok && (
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} style={{ left: `${6 + i * 8}%` }} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
