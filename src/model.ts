import { maxScore, sessions } from "./data";
import type { Challenge, Session } from "./data";
export type Attempt = {
  challengeId: string;
  order: string[];
  checks: number;
  pipelineFirst: boolean | null;
  pipelineFeedback: boolean | null;
  matched: string[];
  firstPairs: Record<string, string>;
  selectedTask: string | null;
  lastPair: { task: string; choice: string } | null;
  round: number;
  optionOrders: string[][];
  answers: string[];
  question: number;
  plays: Record<string, "hold" | "fold">;
  done: boolean;
};
export type Result = {
  latest: number;
  best: number;
  completed: true;
  review: string[];
};
export type SessionProgress = {
  contentVersion: number;
  results: Record<string, Result>;
  active: Attempt | null;
};
export type Progress = { schema: 1; sessions: Record<string, SessionProgress> };
export const STORAGE_KEY = "after-class.progress";
export const emptyProgress = (): Progress => ({ schema: 1, sessions: {} });
export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function createAttempt(c: Challenge): Attempt {
  let order = c.type === "pipeline" ? shuffle(c.steps.map((s) => s.id)) : [];
  if (c.type === "pipeline" && order.every((s, i) => s === c.steps[i].id))
    order = [...order.slice(1), order[0]];
  return {
    challengeId: c.id,
    order,
    checks: 0,
    pipelineFirst: null,
    pipelineFeedback: null,
    matched: [],
    firstPairs: {},
    selectedTask: null,
    lastPair: null,
    round: 0,
    optionOrders:
      c.type === "matching"
        ? c.rounds.map((r) => shuffle(r.pairs.map((p) => p.id)))
        : c.type === "decisions"
          ? c.scenarios.map((q) => shuffle(q.options.map((o) => o.id)))
          : c.type === "staffing"
            ? [
                shuffledIds([
                  ...c.cards.map((card) => card.id),
                  ...c.decoys.map((card) => card.id),
                ]),
              ]
            : c.type === "holdem"
              ? c.hands.map((hand) => shuffledIds(hand.cards.map((card) => card.id)))
              : [],
    answers: [],
    question: 0,
    plays: {},
    done: false,
  };
}
function shuffledIds(ids: string[]) {
  let order = shuffle(ids);
  if (ids.length > 1 && order.every((id, i) => id === ids[i]))
    order = [...order.slice(1), order[0]];
  return order;
}
export type Action =
  | { type: "move"; from: number; to: number }
  | { type: "check" }
  | { type: "task"; id: string }
  | { type: "pair"; id: string }
  | { type: "nextRound" }
  | { type: "answer"; id: string }
  | { type: "nextQuestion" }
  | { type: "play"; id: string }
  | { type: "seal" }
  | { type: "setCard"; id: string; choice: "hold" | "fold" }
  | { type: "showHand" }
  | { type: "nextHand" };
export function transition(c: Challenge, a: Attempt, action: Action): Attempt {
  if (a.done) return a;
  if (c.type === "pipeline") {
    if (
      action.type === "move" &&
      Number.isInteger(action.from) &&
      Number.isInteger(action.to) &&
      action.from >= 0 &&
      action.to >= 0 &&
      action.from < a.order.length &&
      action.to < a.order.length
    ) {
      const order = [...a.order];
      const [item] = order.splice(action.from, 1);
      order.splice(action.to, 0, item);
      return { ...a, order, pipelineFeedback: null };
    }
    if (action.type === "check") {
      const correct = a.order.every((id, i) => id === c.steps[i].id);
      return {
        ...a,
        checks: a.checks + 1,
        pipelineFirst: a.pipelineFirst ?? correct,
        pipelineFeedback: correct,
        done: correct,
      };
    }
  }
  if (c.type === "matching") {
    const pairs = c.rounds[a.round].pairs;
    if (
      action.type === "task" &&
      pairs.some((p) => p.id === action.id) &&
      !a.matched.includes(action.id)
    )
      return { ...a, selectedTask: action.id, lastPair: null };
    if (
      action.type === "pair" &&
      a.selectedTask &&
      pairs.some((p) => p.id === action.id) &&
      !a.matched.includes(action.id)
    ) {
      const task = a.selectedTask;
      return {
        ...a,
        firstPairs: {
          ...a.firstPairs,
          [task]: a.firstPairs[task] ?? action.id,
        },
        matched: task === action.id ? [...a.matched, task] : a.matched,
        selectedTask: task === action.id ? null : task,
        lastPair: { task, choice: action.id },
      };
    }
    if (
      action.type === "nextRound" &&
      pairs.every((p) => a.matched.includes(p.id))
    )
      return a.round === c.rounds.length - 1
        ? { ...a, done: true }
        : { ...a, round: a.round + 1, selectedTask: null, lastPair: null };
  }
  if (c.type === "decisions") {
    if (
      action.type === "answer" &&
      !a.answers[a.question] &&
      c.scenarios[a.question].options.some((o) => o.id === action.id)
    )
      return { ...a, answers: [...a.answers, action.id] };
    if (action.type === "nextQuestion" && a.answers[a.question])
      return a.question === c.scenarios.length - 1
        ? { ...a, done: true }
        : { ...a, question: a.question + 1 };
  }
  if (c.type === "staffing") {
    const seat = c.seats[a.question];
    const cardIds = [
      ...c.cards.map((card) => card.id),
      ...c.decoys.map((card) => card.id),
    ];
    if (
      action.type === "play" &&
      seat &&
      a.matched.length < c.seats.length &&
      cardIds.includes(action.id) &&
      !a.matched.includes(action.id)
    ) {
      const correct = action.id === seat.id;
      return {
        ...a,
        firstPairs: { ...a.firstPairs, [seat.id]: a.firstPairs[seat.id] ?? action.id },
        matched: correct ? [...a.matched, seat.id] : a.matched,
        lastPair: { task: seat.id, choice: action.id },
        question: correct
          ? Math.min(a.question + 1, c.seats.length - 1)
          : a.question,
      };
    }
    if (action.type === "seal" && a.matched.length === c.seats.length)
      return { ...a, done: true };
  }
  if (c.type === "holdem") {
    const hand = c.hands[a.question];
    const ids = hand.cards.map((card) => card.id);
    if (
      action.type === "setCard" &&
      ids.includes(action.id) &&
      (action.choice === "hold" || action.choice === "fold")
    )
      return {
        ...a,
        plays: { ...(a.plays ?? {}), [action.id]: action.choice },
      };
    if (
      action.type === "showHand" &&
      ids.every((id) => a.plays?.[id] === "hold" || a.plays?.[id] === "fold")
    ) {
      const firstPairs = { ...a.firstPairs };
      for (const id of ids) firstPairs[id] = firstPairs[id] ?? a.plays[id];
      return { ...a, firstPairs, lastPair: { task: hand.id, choice: "show" } };
    }
    const shown =
      !!a.lastPair &&
      hand.cards.every(
        (card) => a.plays?.[card.id] === (card.hold ? "hold" : "fold"),
      );
    if (action.type === "nextHand" && shown)
      return a.question === c.hands.length - 1
        ? { ...a, done: true }
        : {
            ...a,
            question: a.question + 1,
            plays: {},
            lastPair: null,
          };
  }
  return a;
}
export function outcome(
  c: Challenge,
  a: Attempt,
): { score: number; review: string[] } {
  if (c.type === "pipeline")
    return {
      score: a.pipelineFirst ? 1 : 0,
      review: a.pipelineFirst
        ? []
        : ["The design → build → commit & push → deploy workflow"],
    };
  if (c.type === "matching") {
    const pairs = c.rounds.flatMap((r) => r.pairs);
    return {
      score: pairs.filter((p) => a.firstPairs[p.id] === p.id).length,
      review: pairs
        .filter((p) => a.firstPairs[p.id] !== p.id)
        .map((p) => `${p.task} → ${p.answer}`),
    };
  }
  if (c.type === "staffing") {
    const missed = c.seats.filter((seat) => a.firstPairs[seat.id] !== seat.id);
    return {
      score: c.seats.length - missed.length,
      review: missed.map((seat) => {
        const card = c.cards.find((item) => item.id === seat.id)!;
        return `${seat.job} → ${card.name}`;
      }),
    };
  }
  if (c.type === "holdem") {
    const cards = c.hands.flatMap((hand) => hand.cards);
    const missed = cards.filter(
      (card) => a.firstPairs[card.id] !== (card.hold ? "hold" : "fold"),
    );
    return {
      score: cards.length - missed.length,
      review: missed.map(
        (card) => `${card.hold ? "Hold" : "Fold"}: ${card.text}`,
      ),
    };
  }
  return {
    score: c.scenarios.filter((q, i) => a.answers[i] === q.answer).length,
    review: c.scenarios
      .filter((q, i) => a.answers[i] !== q.answer)
      .map((q) => q.review),
  };
}
export function saveAttempt(
  progress: Progress,
  s: Session,
  c: Challenge,
  a: Attempt,
): Progress {
  const previous = progress.sessions[s.id] ?? {
    contentVersion: s.contentVersion,
    results: {},
    active: null,
  };
  const results = { ...previous.results };
  if (a.done) {
    const { score, review } = outcome(c, a);
    results[c.id] = {
      latest: score,
      best: Math.max(score, results[c.id]?.best ?? 0),
      completed: true,
      review,
    };
  }
  return {
    schema: 1,
    sessions: {
      ...progress.sessions,
      [s.id]: { ...previous, active: a, results },
    },
  };
}
// Treat persisted data as untrusted input; incompatible sessions are discarded individually.
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const integer = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const permutation = (v: unknown, ids: string[]) =>
  strings(v) &&
  v.length === ids.length &&
  new Set(v).size === ids.length &&
  v.every((id) => ids.includes(id));
export function validAttempt(v: unknown, c: Challenge): v is Attempt {
  if (
    !object(v) ||
    v.challengeId !== c.id ||
    typeof v.done !== "boolean" ||
    !strings(v.order) ||
    !strings(v.matched) ||
    new Set(v.matched).size !== v.matched.length ||
    !object(v.firstPairs) ||
    !(v.selectedTask === null || typeof v.selectedTask === "string") ||
    !integer(v.checks, 0, 1000000) ||
    ![null, true, false].includes(v.pipelineFirst as boolean | null) ||
    ![null, true, false].includes(v.pipelineFeedback as boolean | null) ||
    !integer(v.round, 0, 100) ||
    !integer(v.question, 0, 100) ||
    !strings(v.answers) ||
    !Array.isArray(v.optionOrders) ||
    !(
      v.plays === undefined ||
      (object(v.plays) &&
        Object.values(v.plays).every((x) => x === "hold" || x === "fold"))
    ) ||
    !(
      v.lastPair === null ||
      (object(v.lastPair) &&
        typeof v.lastPair.task === "string" &&
        typeof v.lastPair.choice === "string")
    )
  )
    return false;
  const a = v as unknown as Attempt;
  if (c.type === "pipeline")
    return (
      permutation(
        a.order,
        c.steps.map((s) => s.id),
      ) &&
      (a.checks === 0
        ? a.pipelineFirst === null && !a.done
        : a.pipelineFirst !== null) &&
      (!a.done || a.order.every((id, i) => id === c.steps[i].id))
    );
  if (c.type === "matching") {
    const all = c.rounds.flatMap((r) => r.pairs.map((p) => p.id));
    if (
      a.round >= c.rounds.length ||
      a.optionOrders.length !== c.rounds.length ||
      !c.rounds.every((r, i) =>
        permutation(
          a.optionOrders[i],
          r.pairs.map((p) => p.id),
        ),
      ) ||
      !a.matched.every((id) => all.includes(id)) ||
      !Object.entries(a.firstPairs).every(([id, choice]) =>
        c.rounds.some(
          (r) =>
            r.pairs.some((p) => p.id === id) &&
            r.pairs.some((p) => p.id === choice),
        ),
      )
    )
      return false;
    const current = c.rounds[a.round].pairs.map((p) => p.id);
    return (
      (a.selectedTask === null || current.includes(a.selectedTask)) &&
      (a.lastPair === null ||
        (current.includes(a.lastPair.task) &&
          current.includes(a.lastPair.choice))) &&
      c.rounds
        .slice(0, a.round)
        .every((r) => r.pairs.every((p) => a.matched.includes(p.id))) &&
      (!a.done || all.every((id) => a.matched.includes(id)))
    );
  }
  if (c.type === "staffing") {
    const seatIds = c.seats.map((seat) => seat.id);
    const cardIds = [
      ...c.cards.map((card) => card.id),
      ...c.decoys.map((card) => card.id),
    ];
    const filled = a.matched.length;
    const allowed = seatIds.slice(
      0,
      Math.min(seatIds.length, filled + (filled < seatIds.length ? 1 : 0)),
    );
    return (
      a.optionOrders.length === 1 &&
      permutation(a.optionOrders[0], cardIds) &&
      filled <= seatIds.length &&
      a.matched.every((id, i) => id === seatIds[i]) &&
      a.question === Math.min(filled, seatIds.length - 1) &&
      Object.entries(a.firstPairs).every(
        ([id, choice]) => seatIds.includes(id) && cardIds.includes(choice),
      ) &&
      Object.keys(a.firstPairs).every((id) => allowed.includes(id)) &&
      a.matched.every((id) => typeof a.firstPairs[id] === "string") &&
      (a.lastPair === null ||
        (seatIds.includes(a.lastPair.task) &&
          cardIds.includes(a.lastPair.choice))) &&
      (!a.done || filled === seatIds.length)
    );
  }
  if (c.type === "holdem") {
    const plays = a.plays;
    const hand = c.hands[a.question];
    if (!plays) return false;
    if (
      !hand ||
      a.optionOrders.length !== c.hands.length ||
      !c.hands.every((item, i) =>
        permutation(
          a.optionOrders[i],
          item.cards.map((card) => card.id),
        ),
      )
    )
      return false;
    const ids = hand.cards.map((card) => card.id);
    const earlier = c.hands
      .slice(0, a.question)
      .flatMap((item) => item.cards.map((card) => card.id));
    const known = [...earlier, ...ids];
    return (
      Object.keys(plays).every((id) => ids.includes(id)) &&
      Object.entries(a.firstPairs).every(
        ([id, choice]) =>
          known.includes(id) && (choice === "hold" || choice === "fold"),
      ) &&
      earlier.every(
        (id) => a.firstPairs[id] === "hold" || a.firstPairs[id] === "fold",
      ) &&
      (a.lastPair === null ||
        (a.lastPair.task === hand.id &&
          a.lastPair.choice === "show" &&
          ids.every((id) => plays[id] === "hold" || plays[id] === "fold"))) &&
      (!a.done ||
        c.hands.every((item) =>
          item.cards.every((card) => a.firstPairs[card.id]),
        ))
    );
  }
  return (
    a.question < c.scenarios.length &&
    a.answers.length >= a.question &&
    a.answers.length <= a.question + 1 &&
    a.answers.every((id, i) =>
      c.scenarios[i]?.options.some((o) => o.id === id),
    ) &&
    a.optionOrders.length === c.scenarios.length &&
    c.scenarios.every((q, i) =>
      permutation(
        a.optionOrders[i],
        q.options.map((o) => o.id),
      ),
    ) &&
    (!a.done || a.answers.length === c.scenarios.length)
  );
}
export function parseProgress(raw: string | null): {
  progress: Progress;
  recovered: boolean;
} {
  if (!raw) return { progress: emptyProgress(), recovered: false };
  try {
    const data: unknown = JSON.parse(raw);
    if (!object(data) || data.schema !== 1 || !object(data.sessions))
      throw Error("Old schema");
    const progress = emptyProgress();
    let recovered = false;
    for (const s of sessions) {
      const saved = data.sessions[s.id];
      if (saved === undefined) continue;
      if (
        !object(saved) ||
        saved.contentVersion !== s.contentVersion ||
        !object(saved.results)
      ) {
        recovered = true;
        continue;
      }
      const results: Record<string, Result> = {};
      for (const c of s.challenges) {
        const r = saved.results[c.id];
        if (r === undefined) continue;
        if (
          !object(r) ||
          !integer(r.latest, 0, maxScore(c)) ||
          !integer(r.best, r.latest, maxScore(c)) ||
          r.completed !== true ||
          !strings(r.review) ||
          r.review.length > maxScore(c) ||
          r.review.some((x) => x.length > 500)
        ) {
          recovered = true;
          continue;
        }
        results[c.id] = {
          latest: r.latest,
          best: r.best,
          completed: true,
          review: r.review,
        };
      }
      const c = object(saved.active)
        ? s.challenges.find(
            (c) =>
              c.id === (saved.active as Record<string, unknown>).challengeId,
          )
        : undefined;
      const active = c && validAttempt(saved.active, c) ? saved.active : null;
      if (saved.active !== null && !active) recovered = true;
      progress.sessions[s.id] = {
        contentVersion: s.contentVersion,
        results,
        active,
      };
    }
    return { progress, recovered };
  } catch {
    return { progress: emptyProgress(), recovered: true };
  }
}
