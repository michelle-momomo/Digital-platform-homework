/** Existing rule: a run that is not perfect still earns the second star at this ratio. */
export const STAR_PARTIAL = 0.6;

export type StarLine = { label: string; earned: boolean; reason: string };

/** The three stars already produced by rate(). This does not add a new rule. */
export function starLines(correct: number, total: number, ms: number, limitMs: number): StarLine[] {
  const perfect = total > 0 && correct === total;
  const partial = total > 0 && correct / total >= STAR_PARTIAL;
  const fast = ms <= limitMs;
  return [
    { label: "Complete", earned: true, reason: "Level complete" },
    {
      label: "Passed",
      earned: perfect || partial,
      reason: perfect || partial ? "All correct, or at least 60% correct" : "Under 60% correct",
    },
    {
      label: "Speed bonus",
      earned: perfect && fast,
      reason: perfect && fast ? "All correct within the time limit" : perfect ? "Time limit passed" : "Not all answers correct",
    },
  ];
}

export function rate(
  correct: number,
  total: number,
  ms: number,
  limitMs: number,
  combo = 0,
): { stars: 1 | 2 | 3; score: number } {
  const earned = starLines(correct, total, ms, limitMs).filter((line) => line.earned).length;
  const stars = (earned === 3 ? 3 : earned === 2 ? 2 : 1) as 1 | 2 | 3;
  const perfect = total > 0 && correct === total;
  const fast = ms <= limitMs;
  const score = correct * 100 + Math.max(0, combo) * 25 + (perfect && fast ? 50 : 0);
  return { stars, score };
}

export function orderHits(submitted: string[], correct: string[]) {
  return submitted.reduce(
    (n, id, i) => n + (id === correct[i] ? 1 : 0),
    0,
  );
}

export function voiceRank(cleared: number) {
  if (cleared >= 6) return "Top Voice";
  if (cleared >= 3) return "Industry Expert";
  if (cleared >= 1) return "Active";
  return "Newbie";
}
