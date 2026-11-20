import { useRef, useState, type ReactNode } from "react";
import { Sprite } from "./AvatarView";
import type { Level, MatchStep, MemoryStep, Region, SortStep, SwipeCard } from "./content";
import { gradedCount } from "./content";
import { rate, starLines } from "./logic";
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

export function MiniLevel(props: {
  region: Region;
  level: Level;
  index: number;
  muted: boolean;
  onExit: () => void;
  onDone: (result: LevelResult) => void;
}) {
  const [ready, setReady] = useState(false);
  const step = props.level.steps[0];
  const learn = props.level.learn;
  if (!step) return null;
  if (!ready && learn) {
    return (
      <Shell region={props.region} level={props.level} index={props.index} onExit={props.onExit} how="Learn, then play">
        <article className="learn-card">
          <span className="learn-icon" aria-hidden="true">{learn.icon}</span>
          <h2>{props.level.title}</h2>
          <ul>
            {learn.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <p className="src">{learn.source}</p>
          <button className="go big" onClick={() => setReady(true)}>
            Start game
          </button>
        </article>
      </Shell>
    );
  }
  if (step.kind === "swipe") return <SwipeGame {...props} cards={step.cards} how="Swipe right if true, left if false" />;
  if (step.kind === "match") return <MatchGame {...props} step={step} />;
  if (step.kind === "memory") return <MemoryGame {...props} step={step} />;
  if (step.kind === "sort") return <SortGame {...props} step={step} />;
  if (step.kind === "chat") return <ChatGame {...props} step={step} />;
  return null;
}

function Shell({
  region,
  level,
  index,
  onExit,
  how,
  children,
}: {
  region: Region;
  level: Level;
  index: number;
  onExit: () => void;
  how: string;
  children: ReactNode;
}) {
  return (
    <main className={`sheet theme-${region.id} swipe-play`}>
      <header className="hud">
        <button className="text-btn" onClick={onExit}>
          ← Back
        </button>
        <span className="level-dots" aria-label={`Level ${index + 1}`}>
          {level && region.levels.map((item, i) => (
            <i key={item.id} className={i === index ? "now" : i < index ? "done" : ""} />
          ))}
        </span>
      </header>
      <section className="swipe-stage">
        <p className="swipe-hint">{how}</p>
        {children}
      </section>
    </main>
  );
}

function Feedback({
  ok,
  why,
  source,
  last,
  onNext,
  leave = "下一关 →",
}: {
  ok: boolean;
  why: string;
  source: string;
  last: boolean;
  onNext: () => void;
  leave?: string;
}) {
  return (
    <div className={`swipe-feedback ${ok ? "yes" : "no"}`} role="status">
      {ok && <Confetti />}
      <p>
        {ok ? `答对了！ ${why}` : `还差一点 ${why}`} <span className="src">{source}</span>
      </p>
      <button className="go big" onClick={onNext}>
        {last ? leave : "Next card"}
      </button>
    </div>
  );
}

function StarsEnd({
  stars,
  onNext,
  leave = "下一关 →",
  lines,
}: {
  stars: number;
  onNext: () => void;
  leave?: string;
  lines?: { label: string; earned: boolean; reason: string }[];
}) {
  return (
    <div className="swipe-end">
      <p className="result-bar yes">答对了！ {stars}★</p>
      {lines && (
        <ul className="star-lines">
          {lines.map((line) => (
            <li key={line.label} className={line.earned ? "on" : ""}>
              {line.earned ? "★" : "☆"} {line.label}：{line.reason}
            </li>
          ))}
        </ul>
      )}
      <span className="stars" aria-label={`${stars} stars`}>
        {[1, 2, 3].map((star) => (
          <i key={star} className={star <= stars ? "on" : ""} />
        ))}
      </span>
      <button className="go big" onClick={onNext}>
        {leave}
      </button>
    </div>
  );
}

function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <span key={i} style={{ left: `${8 + i * 11}%` }} />
      ))}
    </div>
  );
}

function useFinish(
  level: Level,
  muted: boolean,
  onDone: (result: LevelResult) => void,
) {
  const started = useRef(Date.now());
  const correct = useRef(0);
  const snap = useRef<null | { stars: 1 | 2 | 3; score: number; ms: number; total: number; lines: ReturnType<typeof starLines> }>(null);
  function shot() {
    if (!snap.current) {
      const ms = Date.now() - started.current;
      const total = gradedCount(level);
      const rated = rate(correct.current, total, ms, level.limitMs, correct.current);
      snap.current = { ...rated, ms, total, lines: starLines(correct.current, total, ms, level.limitMs) };
    }
    return snap.current;
  }
  function finish() {
    const frozen = shot();
    sfx("fanfare", muted);
    onDone({
      stars: frozen.stars,
      score: frozen.score,
      correct: correct.current,
      total: frozen.total,
      ms: frozen.ms,
      at: new Date().toISOString(),
    });
  }
  return { correct, finish, shot };
}

function SwipeGame({
  region,
  level,
  index,
  muted,
  onExit,
  onDone,
  cards,
  how,
}: {
  region: Region;
  level: Level;
  index: number;
  muted: boolean;
  onExit: () => void;
  onDone: (result: LevelResult) => void;
  cards: SwipeCard[];
  how: string;
}) {
  const [order] = useState(() => shuffle(cards));
  const [cursor, setCursor] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [fly, setFly] = useState<"" | "left" | "right">("");
  const [note, setNote] = useState<{ ok: boolean; why: string; source: string } | null>(null);
  const origin = useRef(0);
  const dxRef = useRef(0);
  const { correct, finish, shot } = useFinish(level, muted, onDone);
  const card = order[cursor];
  const done = cursor >= order.length;

  function judge(item: SwipeCard, sayTrue: boolean) {
    if (note || fly) return;
    const ok = sayTrue === item.truth;
    if (ok) correct.current += 1;
    sfx(ok ? "ok" : "bad", muted);
    setFly(sayTrue ? "right" : "left");
    window.setTimeout(() => {
      setNote({ ok, why: item.why, source: item.source });
      setFly("");
      setDx(0);
    }, 220);
  }

  function advance() {
    const next = cursor + 1;
    setNote(null);
    if (next >= order.length) shot();
    setCursor(next);
  }

  return (
    <Shell region={region} level={level} index={index} onExit={onExit} how={how}>
      <b className="swipe-count">{done ? `${correct.current}/${order.length}` : `${cursor + 1}/${order.length}`}</b>
      {done ? (
        <StarsEnd stars={shot().stars} lines={shot().lines} onNext={finish} leave={index === region.levels.length - 1 ? "回到地图" : "下一关 →"} />
      ) : note ? (
        <Feedback ok={note.ok} why={note.why} source={note.source} last={false} onNext={advance} />
      ) : card ? (
        <>
          <div className="swipe-stack">
            <div className="swipe-back two" />
            <div className="swipe-back one" />
            <article
              className={`swipe-card ${dragging ? "drag" : ""} ${fly ? `fly-${fly}` : ""}`}
              style={{ transform: fly ? undefined : `translateX(${dx}px) rotate(${dx / 18}deg)` }}
              onPointerDown={(event) => {
                origin.current = event.clientX;
                setDragging(true);
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!dragging) return;
                const next = event.clientX - origin.current;
                dxRef.current = next;
                setDx(next);
              }}
              onPointerUp={() => {
                if (!dragging) return;
                setDragging(false);
                const moved = dxRef.current;
                if (moved > 80) judge(card, true);
                else if (moved < -80) judge(card, false);
                else setDx(0);
              }}
            >
              <p>{card.text}</p>
            </article>
          </div>
          <div className="swipe-actions">
            <button className="candy false" aria-label="False" onClick={() => judge(card, false)}>✕ False</button>
            <button className="candy true" aria-label="True" onClick={() => judge(card, true)}>✓ True</button>
          </div>
        </>
      ) : null}
    </Shell>
  );
}

function MatchGame({
  region,
  level,
  index,
  muted,
  onExit,
  onDone,
  step,
}: {
  region: Region;
  level: Level;
  index: number;
  muted: boolean;
  onExit: () => void;
  onDone: (result: LevelResult) => void;
  step: MatchStep;
}) {
  const [rights] = useState(() => shuffle(step.pairs));
  const [picked, setPicked] = useState("");
  const [linked, setLinked] = useState<string[]>([]);
  const [shake, setShake] = useState("");
  const [note, setNote] = useState<{ ok: boolean; why: string; source: string } | null>(null);
  const missed = useRef(new Set<string>());
  const { correct, finish, shot } = useFinish(level, muted, onDone);
  const board = useRef<HTMLDivElement>(null);
  const leftRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const done = linked.length === step.pairs.length;

  function chooseRight(id: string) {
    if (!picked || linked.includes(id) || linked.includes(picked)) return;
    const ok = id === picked;
    if (ok) {
      if (!missed.current.has(id)) correct.current += 1;
      setLinked((list) => [...list, id]);
      sfx("ok", muted);
    } else {
      missed.current.add(picked);
      setShake(id);
      sfx("bad", muted);
      window.setTimeout(() => setShake(""), 400);
    }
    const pair = step.pairs.find((item) => item.id === (ok ? id : picked)) ?? step.pairs[0];
    setNote({ ok, why: pair.why, source: pair.source });
    setPicked("");
  }

  const lines = linked.map((id) => {
    const box = board.current?.getBoundingClientRect();
    const left = leftRef.current[id]?.getBoundingClientRect();
    const right = rightRef.current[id]?.getBoundingClientRect();
    if (!box || !left || !right) return null;
    return { id, x1: left.right - box.left, y1: left.top + left.height / 2 - box.top, x2: right.left - box.left, y2: right.top + right.height / 2 - box.top };
  });

  return (
    <Shell region={region} level={level} index={index} onExit={onExit} how={step.how}>
      {done && !note ? (
        <StarsEnd stars={shot().stars} lines={shot().lines} onNext={finish} leave={index === region.levels.length - 1 ? "回到地图" : "下一关 →"} />
      ) : (
        <div className="match-board" ref={board}>
          <svg className="match-lines" aria-hidden="true">
            {lines.map((line) => line && <line key={line.id} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />)}
          </svg>
          <div className="match-col">
            {step.pairs.map((pair) => (
              <button
                key={pair.id}
                ref={(node) => { leftRef.current[pair.id] = node; }}
                className={`candy ${picked === pair.id ? "on" : ""} ${linked.includes(pair.id) ? "good" : ""}`}
                disabled={linked.includes(pair.id)}
                onClick={() => setPicked(pair.id)}
              >
                {pair.left}
              </button>
            ))}
          </div>
          <div className="match-col">
            {rights.map((pair) => (
              <button
                key={pair.id}
                ref={(node) => { rightRef.current[pair.id] = node; }}
                className={`candy ${linked.includes(pair.id) ? "good" : ""} ${shake === pair.id ? "shake" : ""}`}
                disabled={linked.includes(pair.id)}
                onClick={() => chooseRight(pair.id)}
              >
                {pair.right}
              </button>
            ))}
          </div>
        </div>
      )}
      {note && (
        <Feedback
          ok={note.ok}
          why={note.why}
          source={note.source}
          last={done}
          onNext={() => setNote(null)}
        />
      )}
    </Shell>
  );
}

function MemoryGame({
  region,
  level,
  index,
  muted,
  onExit,
  onDone,
  step,
}: {
  region: Region;
  level: Level;
  index: number;
  muted: boolean;
  onExit: () => void;
  onDone: (result: LevelResult) => void;
  step: MemoryStep;
}) {
  const [cards] = useState(() =>
    shuffle(step.pairs.flatMap((pair) => [
      { key: `${pair.id}-a`, pair: pair.id, text: pair.a },
      { key: `${pair.id}-b`, pair: pair.id, text: pair.b },
    ])),
  );
  const [up, setUp] = useState<string[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [lock, setLock] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; why: string; source: string } | null>(null);
  const missed = useRef(new Set<string>());
  const { correct, finish, shot } = useFinish(level, muted, onDone);
  const done = found.length === step.pairs.length;

  function flip(key: string, pair: string) {
    if (lock || found.includes(pair) || up.includes(key) || up.length === 2) return;
    const next = [...up, key];
    setUp(next);
    if (next.length < 2) return;
    const [first, second] = next.map((id) => cards.find((card) => card.key === id)!);
    const ok = first.pair === second.pair;
    const info = step.pairs.find((item) => item.id === first.pair) ?? step.pairs[0];
    setLock(true);
    if (ok) {
      if (!missed.current.has(first.pair)) correct.current += 1;
      sfx("ok", muted);
      window.setTimeout(() => {
        setFound((list) => [...list, first.pair]);
        setUp([]);
        setLock(false);
        setNote({ ok: true, why: info.why, source: info.source });
      }, 280);
    } else {
      missed.current.add(first.pair);
      missed.current.add(second.pair);
      sfx("bad", muted);
      window.setTimeout(() => {
        setUp([]);
        setLock(false);
        setNote({ ok: false, why: info.why, source: info.source });
      }, 700);
    }
  }

  return (
    <Shell region={region} level={level} index={index} onExit={onExit} how={step.how}>
      {done && !note ? (
        <StarsEnd stars={shot().stars} lines={shot().lines} onNext={finish} leave={index === region.levels.length - 1 ? "回到地图" : "下一关 →"} />
      ) : (
        <div className="memory-grid">
          {cards.map((card) => {
            const open = up.includes(card.key) || found.includes(card.pair);
            return (
              <button
                key={card.key}
                className={`mem ${open ? "open" : ""} ${found.includes(card.pair) ? "good" : ""}`}
                onClick={() => flip(card.key, card.pair)}
              >
                {open ? card.text : "?"}
              </button>
            );
          })}
        </div>
      )}
      {note && <Feedback ok={note.ok} why={note.why} source={note.source} last={done} onNext={() => setNote(null)} />}
    </Shell>
  );
}

function SortGame({
  region,
  level,
  index,
  muted,
  onExit,
  onDone,
  step,
}: {
  region: Region;
  level: Level;
  index: number;
  muted: boolean;
  onExit: () => void;
  onDone: (result: LevelResult) => void;
  step: SortStep;
}) {
  const [cards] = useState(() => shuffle(step.cards));
  const [cursor, setCursor] = useState(0);
  const [shake, setShake] = useState("");
  const [note, setNote] = useState<{ ok: boolean; why: string; source: string } | null>(null);
  const missed = useRef(new Set<string>());
  const { correct, finish, shot } = useFinish(level, muted, onDone);
  const card = cards[cursor];
  const done = cursor >= cards.length;

  function drop(basket: "left" | "right") {
    if (!card || note) return;
    const ok = card.basket === basket;
    if (ok && !missed.current.has(card.id)) correct.current += 1;
    if (!ok) missed.current.add(card.id);
    sfx(ok ? "ok" : "bad", muted);
    setShake(ok ? "" : basket);
    setNote({ ok, why: card.why, source: card.source });
  }

  function advance() {
    const next = cursor + 1;
    setNote(null);
    setShake("");
    if (next >= cards.length) shot();
    setCursor(next);
  }

  return (
    <Shell region={region} level={level} index={index} onExit={onExit} how={step.how}>
      <b className="swipe-count">{done ? `${correct.current}/${cards.length}` : `${cursor + 1}/${cards.length}`}</b>
      {done ? (
        <StarsEnd stars={shot().stars} lines={shot().lines} onNext={finish} leave={index === region.levels.length - 1 ? "回到地图" : "下一关 →"} />
      ) : note ? (
        <Feedback ok={note.ok} why={note.why} source={note.source} last={false} onNext={advance} />
      ) : card ? (
        <>
          <article className="sort-card"><p>{card.text}</p></article>
          <div className="swipe-actions">
            <button className={`candy ${shake === "left" ? "shake bad" : ""}`} onClick={() => drop("left")}>{step.left}</button>
            <button className={`candy ${shake === "right" ? "shake bad" : ""}`} onClick={() => drop("right")}>{step.right}</button>
          </div>
        </>
      ) : null}
    </Shell>
  );
}

function ChatGame({
  region,
  level,
  index,
  muted,
  onExit,
  onDone,
  step,
}: {
  region: Region;
  level: Level;
  index: number;
  muted: boolean;
  onExit: () => void;
  onDone: (result: LevelResult) => void;
  step: { kind: "chat"; how: string; says: string; replies: { id: string; text: string; ok: boolean; why: string; source: string }[] };
}) {
  const [replies] = useState(() => shuffle(step.replies));
  const [picked, setPicked] = useState("");
  const [shake, setShake] = useState("");
  const [note, setNote] = useState<{ ok: boolean; why: string; source: string } | null>(null);
  const missed = useRef(false);
  const game = useGame();
  const { correct, finish } = useFinish(level, muted, onDone);
  const solved = Boolean(picked && step.replies.find((item) => item.id === picked)?.ok);

  function choose(id: string) {
    if (solved) return;
    const reply = step.replies.find((item) => item.id === id)!;
    if (!reply.ok) missed.current = true;
    else if (!missed.current) correct.current = 1;
    else correct.current = 0;
    sfx(reply.ok ? "ok" : "bad", muted);
    setPicked(id);
    setShake(reply.ok ? "" : id);
    setNote({ ok: reply.ok, why: reply.why, source: reply.source });
  }

  return (
    <Shell region={region} level={level} index={index} onExit={onExit} how={step.how}>
      <div className="chat-row">
        {game.save.character && <Sprite character={game.save.character} className="bounce" label="" />}
        <p className="chat-says">{step.says}</p>
      </div>
      <div className="chat-replies">
        {replies.map((reply) => (
          <button
            key={reply.id}
            className={`candy ${picked === reply.id && reply.ok ? "good" : ""} ${shake === reply.id ? "shake bad" : ""}`}
            onClick={() => choose(reply.id)}
          >
            {reply.text}
          </button>
        ))}
      </div>
      {note && (
        <Feedback
          ok={note.ok}
          why={note.why}
          source={note.source}
          last={solved}
          leave={index === region.levels.length - 1 ? "回到地图" : "下一关 →"}
          onNext={solved ? finish : () => setNote(null)}
        />
      )}
    </Shell>
  );
}
