export function rate(
  correct: number,
  total: number,
  ms: number,
  limitMs: number,
  combo = 0,
): { stars: 1 | 2 | 3; score: number } {
  const perfect = total > 0 && correct === total;
  const ratio = total > 0 ? correct / total : 0;
  const fast = ms <= limitMs;
  const stars: 1 | 2 | 3 =
    perfect && fast ? 3 : perfect || ratio >= 0.6 ? 2 : 1;
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
