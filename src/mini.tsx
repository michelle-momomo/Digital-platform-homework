import { useRef, useState } from "react";
import { Sprite } from "./AvatarView";
import type { ChatStep, Level, MatchStep, MemoryStep, Region, SortStep, SwipeCard } from "./content";
import { gradedCount } from "./content";
import { LevelShell, leaveLabel, type Verdict } from "./LevelShell";
import { rate, starLines } from "./logic";
import { shuffle } from "./PlayView";
import { sfx } from "./sfx";
import { useGame } from "./store";
import type { LevelResult } from "./storage";

type Props = {
  region: Region;
  level: Level;
  index: number;
  muted: boolean;
  onExit: () => void;
  onDone: (result: LevelResult) => void;
};

type Note = { ok: boolean; why: string; source: string };

export function MiniLevel(props: Props) {
  const [ready, setReady] = useState(false);
  const step = props.level.steps[0];
  const learn = props.level.learn;
  if (!step) return null;
  if (!ready && learn) return <LearnCard {...props} learn={learn} onStart={() => setReady(true)} />;
  if (step.kind === "swipe") return <SwipeGame {...props} cards={step.cards} />;
  if (step.kind === "match") return <MatchGame {...props} step={step} />;
  if (step.kind === "memory") return <MemoryGame {...props} step={step} />;
  if (step.kind === "sort") return <SortGame {...props} step={step} />;
  if (step.kind === "chat") return <ChatGame {...props} step={step} />;
  return null;
}

function LearnCard({
  region,
  level,
  index,
  onExit,
  learn,
  onStart,
}: Props & { learn: NonNullable<Level["learn"]>; onStart: () => void }) {
  const started = useRef(Date.now());
  return (
    <LevelShell
      region={region}
      level={level}
      index={index}
      started={started.current}
      stars={0}
      combo={0}
      prompt="Learn, then play"
      onExit={onExit}
      verdict={{ kind: "idle", hint: "Read the points, then start the game.", action: { label: "Start game", onClick: onStart } }}
    >
      <article className="learn">
        <span className="learn-icon" aria-hidden="true">
          {learn.icon}
        </span>
        <ul>
          {learn.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <span className="tag">{learn.source}</span>
      </article>
    </LevelShell>
  );
}

/** Scoring shared by the card games: first-try correct count, streak, frozen result. */
function useScore(level: Level, muted: boolean, onDone: (result: LevelResult) => void) {
  const started = useRef(Date.now());
  const correct = useRef(0);
  const combo = useRef(0);
  const snap = useRef<null | { stars: 1 | 2 | 3; score: number; ms: number; total: number; lines: ReturnType<typeof starLines> }>(null);
  const total = gradedCount(level);
  function streak(ok: boolean) {
    combo.current = ok ? combo.current + 1 : 0;
  }
  function shot() {
    if (!snap.current) {
      const ms = Date.now() - started.current;
      const rated = rate(correct.current, total, ms, level.limitMs, correct.current);
      snap.current = { ...rated, ms, total, lines: starLines(correct.current, total, ms, level.limitMs) };
    }
    return snap.current;
  }
  function live() {
    if (snap.current) return snap.current.stars;
    if (correct.current === 0) return 0;
    return rate(correct.current, total, Date.now() - started.current, level.limitMs, correct.current).stars;
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
  return { started, correct, combo, streak, finish, shot, live };
}

type Score = ReturnType<typeof useScore>;

function noteVerdict(note: Note, label: string, onNext: () => void): Verdict {
  return note.ok
    ? { kind: "good", title: "Correct!", text: note.why, tag: note.source, action: { label, onClick: onNext } }
    : { kind: "bad", text: note.why, tag: note.source, action: { label, onClick: onNext } };
}

function endVerdict(score: Score, region: Region, index: number, text?: string, tag?: string): Verdict {
  const frozen = score.shot();
  return {
    kind: "good",
    title: `Correct! +${frozen.stars}★`,
    text: text ?? `${score.correct.current} of ${frozen.total} right on the first try.`,
    tag,
    lines: frozen.lines,
    action: { label: leaveLabel(region, index), onClick: score.finish },
  };
}

function SwipeGame({ region, level, index, muted, onExit, onDone, cards }: Props & { cards: SwipeCard[] }) {
  const [order] = useState(() => shuffle(cards));
  const [cursor, setCursor] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [fly, setFly] = useState<"" | "left" | "right">("");
  const [note, setNote] = useState<Note | null>(null);
  const origin = useRef(0);
  const dxRef = useRef(0);
  const score = useScore(level, muted, onDone);
  const card = order[cursor];
  const done = cursor >= order.length;

  function judge(item: SwipeCard, sayTrue: boolean) {
    if (note || fly) return;
    const ok = sayTrue === item.truth;
    if (ok) score.correct.current += 1;
    score.streak(ok);
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
    if (next >= order.length) score.shot();
    setCursor(next);
  }

  const verdict: Verdict = done
    ? endVerdict(score, region, index)
    : note
      ? noteVerdict(note, "Next card", advance)
      : { kind: "idle", hint: "Swipe the card, or tap True or False." };

  return (
    <LevelShell
      region={region}
      level={level}
      index={index}
      started={score.started.current}
      stars={score.live()}
      combo={score.combo.current}
      prompt="Swipe right if true, left if false"
      onExit={onExit}
      verdict={verdict}
    >
      <p className="step-count">
        {done ? `${score.correct.current} of ${order.length} right` : `Card ${cursor + 1} of ${order.length}`}
      </p>
      {!done && card && (
        <div className="swipe">
          <article
            className={`swipe-card ${dragging ? "drag" : ""} ${fly ? `fly-${fly}` : ""} ${note ? (note.ok ? "good" : "bad") : ""}`}
            style={{ transform: fly ? undefined : `translateX(${dx}px) rotate(${dx / 18}deg)` }}
            onPointerDown={(event) => {
              if (note) return;
              origin.current = event.clientX;
              dxRef.current = 0;
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
          <div className="pair-buttons">
            <button type="button" className="btn btn-secondary" disabled={!!note} onClick={() => judge(card, false)}>
              ✕ False
            </button>
            <button type="button" className="btn btn-secondary" disabled={!!note} onClick={() => judge(card, true)}>
              ✓ True
            </button>
          </div>
        </div>
      )}
    </LevelShell>
  );
}

function MatchGame({ region, level, index, muted, onExit, onDone, step }: Props & { step: MatchStep }) {
  const [rights] = useState(() => shuffle(step.pairs));
  const [picked, setPicked] = useState("");
  const [linked, setLinked] = useState<string[]>([]);
  const [wrong, setWrong] = useState("");
  const [note, setNote] = useState<Note | null>(null);
  const missed = useRef(new Set<string>());
  const score = useScore(level, muted, onDone);
  const done = linked.length === step.pairs.length;

  function chooseRight(id: string) {
    if (note || !picked || linked.includes(id) || linked.includes(picked)) return;
    const ok = id === picked;
    if (ok) {
      if (!missed.current.has(id)) score.correct.current += 1;
      setLinked((list) => [...list, id]);
      setWrong("");
    } else {
      missed.current.add(picked);
      setWrong(id);
    }
    score.streak(ok);
    sfx(ok ? "ok" : "bad", muted);
    const pair = step.pairs.find((item) => item.id === (ok ? id : picked)) ?? step.pairs[0];
    setNote({ ok, why: pair.why, source: pair.source });
    setPicked("");
  }
  function advance() {
    setNote(null);
    setWrong("");
    if (done) score.shot();
  }

  const verdict: Verdict =
    done && !note
      ? endVerdict(score, region, index)
      : note
        ? noteVerdict(note, done ? "See result" : "Next pair", advance)
        : { kind: "idle", hint: picked ? "Now tap its match on the right." : "Tap an item on the left, then its match." };

  return (
    <LevelShell
      region={region}
      level={level}
      index={index}
      started={score.started.current}
      stars={score.live()}
      combo={score.combo.current}
      prompt={step.how}
      onExit={onExit}
      verdict={verdict}
    >
      <div className="match">
        <div className="match-col">
          {step.pairs.map((pair) => (
            <button
              type="button"
              key={pair.id}
              className={`opt ${linked.includes(pair.id) ? "good" : picked === pair.id ? "picked" : ""}`}
              aria-pressed={picked === pair.id}
              disabled={linked.includes(pair.id) || !!note}
              onClick={() => setPicked(pair.id)}
            >
              {pair.left}
            </button>
          ))}
        </div>
        <div className="match-col">
          {rights.map((pair) => (
            <button
              type="button"
              key={pair.id}
              className={`opt ${linked.includes(pair.id) ? "good" : wrong === pair.id ? "bad" : ""}`}
              disabled={linked.includes(pair.id) || !!note}
              onClick={() => chooseRight(pair.id)}
            >
              {pair.right}
            </button>
          ))}
        </div>
      </div>
    </LevelShell>
  );
}

function MemoryGame({ region, level, index, muted, onExit, onDone, step }: Props & { step: MemoryStep }) {
  const [cards] = useState(() =>
    shuffle(
      step.pairs.flatMap((pair) => [
        { key: `${pair.id}-a`, pair: pair.id, text: pair.a },
        { key: `${pair.id}-b`, pair: pair.id, text: pair.b },
      ]),
    ),
  );
  const [up, setUp] = useState<string[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [bad, setBad] = useState<string[]>([]);
  const [lock, setLock] = useState(false);
  const [note, setNote] = useState<Note | null>(null);
  const missed = useRef(new Set<string>());
  const score = useScore(level, muted, onDone);
  const done = found.length === step.pairs.length;

  function flip(key: string, pair: string) {
    if (note || lock || found.includes(pair) || up.includes(key) || up.length === 2) return;
    const next = [...up, key];
    setUp(next);
    if (next.length < 2) return;
    const [first, second] = next.map((id) => cards.find((card) => card.key === id)!);
    const ok = first.pair === second.pair;
    const info = step.pairs.find((item) => item.id === first.pair) ?? step.pairs[0];
    setLock(true);
    score.streak(ok);
    if (ok) {
      if (!missed.current.has(first.pair)) score.correct.current += 1;
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
      setBad(next);
      window.setTimeout(() => {
        setLock(false);
        setNote({ ok: false, why: info.why, source: info.source });
      }, 500);
    }
  }
  function advance() {
    setNote(null);
    setUp([]);
    setBad([]);
    if (done) score.shot();
  }

  const verdict: Verdict =
    done && !note
      ? endVerdict(score, region, index)
      : note
        ? noteVerdict(note, done ? "See result" : "Next pair", advance)
        : { kind: "idle", hint: "Flip two cards to find a pair." };

  return (
    <LevelShell
      region={region}
      level={level}
      index={index}
      started={score.started.current}
      stars={score.live()}
      combo={score.combo.current}
      prompt={step.how}
      onExit={onExit}
      verdict={verdict}
    >
      <div className="memory">
        {cards.map((card) => {
          const open = up.includes(card.key) || found.includes(card.pair);
          const state = found.includes(card.pair) ? "good" : bad.includes(card.key) ? "bad" : open ? "open" : "";
          return (
            <button
              type="button"
              key={card.key}
              className={`opt mem ${state}`}
              aria-label={open ? card.text : "Hidden card"}
              onClick={() => flip(card.key, card.pair)}
            >
              {open ? card.text : "?"}
            </button>
          );
        })}
      </div>
    </LevelShell>
  );
}

function SortGame({ region, level, index, muted, onExit, onDone, step }: Props & { step: SortStep }) {
  const [cards] = useState(() => shuffle(step.cards));
  const [cursor, setCursor] = useState(0);
  const [note, setNote] = useState<Note | null>(null);
  const missed = useRef(new Set<string>());
  const score = useScore(level, muted, onDone);
  const card = cards[cursor];
  const done = cursor >= cards.length;

  function drop(basket: "left" | "right") {
    if (!card || note) return;
    const ok = card.basket === basket;
    if (ok && !missed.current.has(card.id)) score.correct.current += 1;
    if (!ok) missed.current.add(card.id);
    score.streak(ok);
    sfx(ok ? "ok" : "bad", muted);
    setNote({ ok, why: card.why, source: card.source });
  }
  function advance() {
    const next = cursor + 1;
    setNote(null);
    if (next >= cards.length) score.shot();
    setCursor(next);
  }

  const verdict: Verdict = done
    ? endVerdict(score, region, index)
    : note
      ? noteVerdict(note, "Next card", advance)
      : { kind: "idle", hint: "Tap the basket this card belongs in." };

  return (
    <LevelShell
      region={region}
      level={level}
      index={index}
      started={score.started.current}
      stars={score.live()}
      combo={score.combo.current}
      prompt={step.how}
      onExit={onExit}
      verdict={verdict}
    >
      <p className="step-count">
        {done ? `${score.correct.current} of ${cards.length} right` : `Card ${cursor + 1} of ${cards.length}`}
      </p>
      {!done && card && (
        <div className="swipe">
          <article className={`swipe-card ${note ? (note.ok ? "good" : "bad") : ""}`}>
            <p>{card.text}</p>
          </article>
          <div className="pair-buttons">
            <button type="button" className="btn btn-secondary" disabled={!!note} onClick={() => drop("left")}>
              {step.left}
            </button>
            <button type="button" className="btn btn-secondary" disabled={!!note} onClick={() => drop("right")}>
              {step.right}
            </button>
          </div>
        </div>
      )}
    </LevelShell>
  );
}

function ChatGame({ region, level, index, muted, onExit, onDone, step }: Props & { step: ChatStep }) {
  const [replies] = useState(() => shuffle(step.replies));
  const [picked, setPicked] = useState("");
  const missed = useRef(false);
  const game = useGame();
  const score = useScore(level, muted, onDone);
  const reply = step.replies.find((item) => item.id === picked);
  const solved = !!reply?.ok;

  function choose(id: string) {
    if (solved) return;
    const next = step.replies.find((item) => item.id === id)!;
    if (!next.ok) missed.current = true;
    else score.correct.current = missed.current ? 0 : 1;
    score.streak(next.ok);
    sfx(next.ok ? "ok" : "bad", muted);
    setPicked(id);
    if (next.ok) score.shot();
  }

  const verdict: Verdict = solved
    ? endVerdict(score, region, index, reply!.why, reply!.source)
    : reply
      ? { kind: "bad", text: reply.why, tag: reply.source, action: { label: "Try again", onClick: () => setPicked("") } }
      : { kind: "idle", hint: "Tap the reply you would send." };

  return (
    <LevelShell
      region={region}
      level={level}
      index={index}
      started={score.started.current}
      stars={score.live()}
      combo={score.combo.current}
      prompt={step.how}
      onExit={onExit}
      verdict={verdict}
    >
      <div className="chat-says">
        {game.save.character && <Sprite character={game.save.character} className="chat-pal" label="" />}
        <p>{step.says}</p>
      </div>
      <div className={`opts ${solved ? "locked" : ""}`}>
        {replies.map((item, i) => {
          const state = solved ? (item.id === picked ? "good" : "dim") : item.id === picked ? "bad" : "";
          return (
            <button type="button" key={item.id} className={`opt ${state}`} disabled={solved} onClick={() => choose(item.id)}>
              <span className="key" aria-hidden="true">
                {String.fromCharCode(65 + i)}
              </span>
              {item.text}
            </button>
          );
        })}
      </div>
    </LevelShell>
  );
}
