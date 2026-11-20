import { sanitizeCharacter, type Character } from "./avatar";

export type LevelResult = {
  stars: 1 | 2 | 3;
  score: number;
  correct: number;
  total: number;
  ms: number;
  at: string;
};

export type LogEntry = {
  timestamp: string;
  name: string;
  studentId: string;
  gender: string;
  hair: string;
  hairColor: string;
  skin: string;
  outfit: string;
  region: string;
  level: string;
  stars: number;
  score: number;
  correct: number;
  total: number;
  timeMs: number;
  kind: "level" | "region";
};

export type Save = {
  character: Character | null;
  mute: boolean;
  here: string;
  levels: Record<string, LevelResult>;
  logs: LogEntry[];
};

export const SAVE_KEY = "dp-quest-v1";

export const emptySave = (): Save => ({
  character: null,
  mute: false,
  here: "vibe",
  levels: {},
  logs: [],
});

export function levelKey(region: string, level: string) {
  return `${region}:${level}`;
}

export function parseSave(raw: string | null): Save {
  if (!raw) return emptySave();
  try {
    const data = JSON.parse(raw) as Partial<Save>;
    const character = sanitizeCharacter(data.character);
    const levels: Save["levels"] = {};
    if (data.levels && typeof data.levels === "object") {
      for (const [key, value] of Object.entries(data.levels)) {
        if (!value || typeof value !== "object") continue;
        const v = value as Partial<LevelResult>;
        if (v.stars !== 1 && v.stars !== 2 && v.stars !== 3) continue;
        if (typeof v.score !== "number" || typeof v.correct !== "number") continue;
        levels[key] = {
          stars: v.stars,
          score: v.score,
          correct: v.correct,
          total: typeof v.total === "number" ? v.total : v.correct,
          ms: typeof v.ms === "number" ? v.ms : 0,
          at: typeof v.at === "string" ? v.at : "",
        };
      }
    }
    const logs = Array.isArray(data.logs)
      ? data.logs.filter((row) => row && typeof row === "object").slice(-200)
      : [];
    return {
      character,
      mute: data.mute === true,
      here: typeof data.here === "string" ? data.here : "vibe",
      levels,
      logs: logs as LogEntry[],
    };
  } catch {
    return emptySave();
  }
}

export function readSave(): Save {
  try {
    return parseSave(localStorage.getItem(SAVE_KEY));
  } catch {
    return emptySave();
  }
}

export function writeSave(save: Save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* private mode or a full disk should not stop play */
  }
}
