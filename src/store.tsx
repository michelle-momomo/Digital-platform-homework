import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Character } from "./avatar";
import { findRegion } from "./content";
import { postResult } from "./results";
import {
  emptySave,
  levelKey,
  readSave,
  writeSave,
  type LevelResult,
  type LogEntry,
  type Save,
} from "./storage";

type Store = {
  save: Save;
  setCharacter: (character: Character) => void;
  setMute: (mute: boolean) => void;
  setHere: (region: string) => void;
  finishLevel: (region: string, level: string, result: LevelResult) => void;
  stars: number;
  cleared: (region: string) => number;
};

const Ctx = createContext<Store | null>(null);

function entry(
  character: Character,
  region: string,
  level: string,
  result: LevelResult,
  kind: LogEntry["kind"],
): LogEntry {
  return {
    timestamp: result.at,
    name: character.name,
    studentId: character.studentId,
    gender: character.gender,
    hair: character.hair,
    hairColor: character.hairColor,
    skin: character.skin,
    outfit: character.outfit,
    region,
    level,
    stars: result.stars,
    score: result.score,
    correct: result.correct,
    total: result.total,
    timeMs: result.ms,
    kind,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<Save>(readSave);
  const api = useMemo<Store>(() => {
    const commit = (next: Save) => {
      writeSave(next);
      setSave(next);
    };
    return {
      save,
      setCharacter: (character) => commit({ ...save, character }),
      setMute: (mute) => commit({ ...save, mute }),
      setHere: (here) => commit({ ...save, here }),
      finishLevel: (regionId, levelId, result) => {
        const key = levelKey(regionId, levelId);
        const prev = save.levels[key];
        const kept: LevelResult = {
          ...result,
          stars: Math.max(prev?.stars ?? 0, result.stars) as 1 | 2 | 3,
          score: Math.max(prev?.score ?? 0, result.score),
        };
        const levels = { ...save.levels, [key]: kept };
        const region = findRegion(regionId);
        const done =
          region &&
          !region.locked &&
          region.levels.every((level) => levels[levelKey(regionId, level.id)]);
        const logs = [...save.logs];
        if (save.character) {
          const row = entry(save.character, regionId, levelId, result, "level");
          logs.push(row);
          void postResult(row);
          if (done && !region.levels.every((level) => save.levels[levelKey(regionId, level.id)])) {
            const sum = region.levels.reduce(
              (acc, level) => {
                const item = levels[levelKey(regionId, level.id)];
                acc.score += item?.score ?? 0;
                acc.stars += item?.stars ?? 0;
                acc.correct += item?.correct ?? 0;
                acc.total += item?.total ?? 0;
                return acc;
              },
              { score: 0, stars: 0, correct: 0, total: 0 },
            );
            const regionRow = entry(
              save.character,
              regionId,
              "region",
              {
                stars: Math.min(3, Math.max(1, Math.round(sum.stars / region.levels.length))) as 1 | 2 | 3,
                score: sum.score,
                correct: sum.correct,
                total: sum.total,
                ms: result.ms,
                at: result.at,
              },
              "region",
            );
            logs.push(regionRow);
            void postResult(regionRow);
          }
        }
        commit({ ...save, levels, logs: logs.slice(-200) });
      },
      stars: Object.values(save.levels).reduce((n, level) => n + level.stars, 0),
      cleared: (regionId) => {
        const region = findRegion(regionId);
        if (!region) return 0;
        return region.levels.filter((level) => save.levels[levelKey(regionId, level.id)]).length;
      },
    };
  }, [save]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useGame() {
  const store = useContext(Ctx);
  if (!store) throw new Error("Missing store");
  return store;
}

export function freshSave() {
  return emptySave();
}
