export type Gender = "girl" | "boy";
export type GirlHair = "bob" | "pigtails" | "bun" | "long" | "puffs";
export type BoyHair = "spiky" | "side" | "curly" | "buzz";
export type HairId = GirlHair | BoyHair;

export type Character = {
  name: string;
  studentId: string;
  gender: Gender;
  hair: HairId;
  hairColor: string;
  skin: string;
  outfit: string;
};

export const GIRL_HAIR: { id: GirlHair; label: string }[] = [
  { id: "bob", label: "Bob" },
  { id: "pigtails", label: "Pigtails" },
  { id: "bun", label: "Bun" },
  { id: "long", label: "Long" },
  { id: "puffs", label: "Puffs" },
];

export const BOY_HAIR: { id: BoyHair; label: string }[] = [
  { id: "spiky", label: "Spiky" },
  { id: "side", label: "Side part" },
  { id: "curly", label: "Curly" },
  { id: "buzz", label: "Buzz" },
];

export const HAIR_COLORS = [
  { id: "ink", hex: "#2C2A33", label: "Ink" },
  { id: "cocoa", hex: "#6B4423", label: "Cocoa" },
  { id: "honey", hex: "#E0B15A", label: "Honey" },
  { id: "blush", hex: "#F4A4C4", label: "Blush" },
  { id: "lilac", hex: "#C5B3F5", label: "Lilac" },
  { id: "mint", hex: "#8FD6C4", label: "Mint" },
  { id: "sky", hex: "#8EC8F5", label: "Sky" },
  { id: "coral", hex: "#F08A74", label: "Coral" },
];

export const SKINS = [
  { id: "porcelain", hex: "#FFE4CC", label: "Porcelain" },
  { id: "peach", hex: "#F6C8A4", label: "Peach" },
  { id: "sand", hex: "#E0A878", label: "Sand" },
  { id: "amber", hex: "#C68642", label: "Amber" },
  { id: "bronze", hex: "#8D5524", label: "Bronze" },
  { id: "deep", hex: "#5C3317", label: "Deep" },
];

export const OUTFITS = [
  { id: "mint", hex: "#B7E4C7", label: "Mint" },
  { id: "peach", hex: "#FFCDB2", label: "Peach" },
  { id: "lavender", hex: "#D9C7F0", label: "Lavender" },
  { id: "sky", hex: "#C5E4F7", label: "Baby blue" },
  { id: "lemon", hex: "#FFF3B0", label: "Lemon" },
  { id: "pink", hex: "#F8C8DC", label: "Pink" },
  { id: "apricot", hex: "#FFD6A5", label: "Apricot" },
  { id: "pistachio", hex: "#D5E8C4", label: "Pistachio" },
];

export const COLS = 16;
export const ROWS = 22;

const hexes = new Set([
  ...HAIR_COLORS.map((c) => c.hex),
  ...SKINS.map((c) => c.hex),
  ...OUTFITS.map((c) => c.hex),
]);

export function hairsFor(gender: Gender) {
  return gender === "girl" ? GIRL_HAIR : BOY_HAIR;
}

export function defaultCharacter(gender: Gender = "girl"): Character {
  return {
    name: "",
    studentId: "",
    gender,
    hair: gender === "girl" ? "bob" : "spiky",
    hairColor: HAIR_COLORS[4].hex,
    skin: SKINS[1].hex,
    outfit: OUTFITS[5].hex,
  };
}

export function sanitizeCharacter(value: unknown): Character | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<Character>;
  if (v.gender !== "girl" && v.gender !== "boy") return null;
  const allowed = hairsFor(v.gender).some((h) => h.id === v.hair);
  if (!allowed) return null;
  if (typeof v.hairColor !== "string" || !hexes.has(v.hairColor)) return null;
  if (typeof v.skin !== "string" || !hexes.has(v.skin)) return null;
  if (typeof v.outfit !== "string" || !hexes.has(v.outfit)) return null;
  if (typeof v.name !== "string" || !v.name.trim() || v.name.trim().length > 20)
    return null;
  const studentId = typeof v.studentId === "string" ? v.studentId.trim().slice(0, 24) : "";
  return {
    name: v.name.trim(),
    studentId,
    gender: v.gender,
    hair: v.hair as HairId,
    hairColor: v.hairColor,
    skin: v.skin,
    outfit: v.outfit,
  };
}

function empty() {
  return Array.from({ length: ROWS }, () => Array<string | null>(COLS).fill(null));
}
function dot(
  g: (string | null)[][],
  x: number,
  y: number,
  c: string | null,
) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS || !c) return;
  g[y][x] = c;
}
function rect(
  g: (string | null)[][],
  x: number,
  y: number,
  w: number,
  h: number,
  c: string,
) {
  for (let yy = 0; yy < h; yy++)
    for (let xx = 0; xx < w; xx++) dot(g, x + xx, y + yy, c);
}

function hair(g: (string | null)[][], style: HairId, c: string) {
  const cap = () => {
    rect(g, 4, 2, 8, 2, c);
    rect(g, 5, 4, 6, 1, c);
  };
  if (style === "bob") {
    cap();
    rect(g, 4, 5, 1, 4, c);
    rect(g, 11, 5, 1, 4, c);
  } else if (style === "pigtails") {
    cap();
    rect(g, 1, 5, 3, 3, c);
    rect(g, 12, 5, 3, 3, c);
    dot(g, 2, 8, "#F8C8DC");
    dot(g, 13, 8, "#F8C8DC");
  } else if (style === "bun") {
    rect(g, 6, 0, 4, 2, c);
    cap();
  } else if (style === "long") {
    cap();
    rect(g, 3, 5, 2, 11, c);
    rect(g, 11, 5, 2, 11, c);
  } else if (style === "puffs") {
    rect(g, 1, 2, 4, 4, c);
    rect(g, 11, 2, 4, 4, c);
    rect(g, 5, 3, 6, 2, c);
  } else if (style === "spiky") {
    rect(g, 5, 1, 1, 2, c);
    rect(g, 7, 0, 2, 2, c);
    rect(g, 10, 1, 1, 2, c);
    cap();
  } else if (style === "side") {
    cap();
    rect(g, 3, 3, 2, 4, c);
    rect(g, 11, 4, 1, 2, c);
  } else if (style === "curly") {
    rect(g, 4, 1, 2, 2, c);
    rect(g, 7, 0, 2, 2, c);
    rect(g, 10, 1, 2, 2, c);
    cap();
  } else {
    rect(g, 5, 3, 6, 1, c);
  }
}

export function spriteGrid(a: Pick<Character, "gender" | "hair" | "hairColor" | "skin" | "outfit">) {
  const g = empty();
  const skin = a.skin;
  const outfit = a.outfit;
  const ink = "#3D3550";
  rect(g, 5, 20, 6, 1, "#E7D8CC");
  if (a.gender === "girl") {
    rect(g, 5, 11, 6, 3, outfit);
    rect(g, 4, 14, 8, 3, outfit);
    rect(g, 6, 17, 1, 2, skin);
    rect(g, 9, 17, 1, 2, skin);
    rect(g, 6, 19, 1, 1, ink);
    rect(g, 9, 19, 1, 1, ink);
  } else {
    rect(g, 6, 11, 4, 4, outfit);
    rect(g, 6, 15, 1, 4, "#7E8CA8");
    rect(g, 9, 15, 1, 4, "#7E8CA8");
    rect(g, 6, 19, 1, 1, ink);
    rect(g, 9, 19, 1, 1, ink);
  }
  rect(g, 4, 12, 1, 3, skin);
  rect(g, 11, 12, 1, 3, skin);
  rect(g, 7, 9, 2, 2, skin);
  rect(g, 4, 3, 8, 7, skin);
  dot(g, 6, 6, ink);
  dot(g, 9, 6, ink);
  dot(g, 5, 7, "#F4A7C2");
  dot(g, 10, 7, "#F4A7C2");
  rect(g, 7, 8, 2, 1, "#C47A8A");
  hair(g, a.hair, a.hairColor);
  return g;
}
