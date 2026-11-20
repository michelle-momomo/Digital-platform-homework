import { describe, expect, it, vi } from "vitest";
import { hairsFor, sanitizeCharacter } from "./avatar";
import { playable, regions } from "./content";
import { orderHits, rate, voiceRank } from "./logic";
import { postResult } from "./results";
import { parseSave } from "./storage";

describe("scoring", () => {
  it("gives three stars only for a fast perfect run", () => {
    expect(rate(4, 4, 1000, 5000).stars).toBe(3);
    expect(rate(4, 4, 9000, 5000).stars).toBe(2);
    expect(rate(1, 4, 1000, 5000).stars).toBe(1);
  });
  it("counts an order by position", () => {
    expect(orderHits(["a", "c", "b"], ["a", "b", "c"])).toBe(1);
  });
  it("names the LinkedIn ladder", () => {
    expect(voiceRank(0)).toBe("Newbie");
    expect(voiceRank(1)).toBe("Active");
    expect(voiceRank(3)).toBe("Industry Expert");
    expect(voiceRank(6)).toBe("Top Voice");
  });
});

describe("avatar", () => {
  it("offers different hair for each body", () => {
    expect(hairsFor("girl").map((hair) => hair.id)).toEqual([
      "bob",
      "pigtails",
      "bun",
      "long",
      "puffs",
    ]);
    expect(hairsFor("boy").map((hair) => hair.id)).toEqual([
      "spiky",
      "side",
      "curly",
      "buzz",
    ]);
  });
  it("rejects a girl hair on a boy", () => {
    expect(
      sanitizeCharacter({
        name: "Mina",
        studentId: "",
        gender: "boy",
        hair: "pigtails",
        hairColor: "#F4A4C4",
        skin: "#F6C8A4",
        outfit: "#F8C8DC",
      }),
    ).toBeNull();
  });
});

describe("content", () => {
  it("has a path of 6 levels in each open region and no uncertain counts", () => {
    for (const region of playable) expect(region.levels).toHaveLength(6);
    expect(regions.filter((region) => region.locked)).toHaveLength(2);
    const blob = JSON.stringify(playable);
    expect(blob).not.toMatch(/210 million|59 million|every 90 minutes|5th market|5 million/i);
  });
});

describe("results", () => {
  it("does not throw when the sheet is missing", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    await expect(
      postResult({
        timestamp: "t",
        name: "Mina",
        studentId: "",
        gender: "girl",
        hair: "bob",
        hairColor: "#F4A4C4",
        skin: "#F6C8A4",
        outfit: "#F8C8DC",
        region: "vibe",
        level: "pipeline",
        stars: 1,
        score: 10,
        correct: 1,
        total: 4,
        timeMs: 1000,
        kind: "level",
      }),
    ).resolves.toBeUndefined();
    vi.unstubAllGlobals();
  });
  it("drops a broken save", () => {
    expect(parseSave("{").character).toBeNull();
  });
});
