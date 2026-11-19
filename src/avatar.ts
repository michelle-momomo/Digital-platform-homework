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

export const COLS = 32;
export const ROWS = 40;

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

function shade(hex: string, amt: number) {
  const n = Number.parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
  return `#${ch(((n >> 16) & 255) + amt)}${ch(((n >> 8) & 255) + amt)}${ch((n & 255) + amt)}`;
}
function blob(
  g: (string | null)[][],
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  c: string,
) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) dot(g, x, y, c);
    }
  }
}
function paintHair(g: (string | null)[][], style: HairId, c: string, hi: string, skin: string) {
  const cap = () => blob(g, 16, 11, 8.2, 6.2, c);
  if (style === "bob") {
    cap();
    blob(g, 9, 16, 2.4, 5, c);
    blob(g, 23, 16, 2.4, 5, c);
    rect(g, 10, 9, 12, 2, c);
  } else if (style === "pigtails") {
    cap();
    blob(g, 6, 18, 3.2, 4.2, c);
    blob(g, 26, 18, 3.2, 4.2, c);
    dot(g, 6, 18, "#fff");
    dot(g, 26, 18, "#fff");
  } else if (style === "bun") {
    blob(g, 16, 5, 3.4, 3.2, c);
    cap();
    dot(g, 15, 4, hi);
  } else if (style === "long") {
    cap();
    rect(g, 7, 14, 3, 16, c);
    rect(g, 22, 14, 3, 16, c);
    blob(g, 8, 30, 2.2, 2, c);
    blob(g, 23, 30, 2.2, 2, c);
  } else if (style === "puffs") {
    blob(g, 7, 10, 4, 4, c);
    blob(g, 25, 10, 4, 4, c);
    cap();
    dot(g, 6, 9, hi);
    dot(g, 24, 9, hi);
  } else if (style === "spiky") {
    rect(g, 8, 4, 2, 5, c);
    rect(g, 12, 2, 2, 6, c);
    rect(g, 16, 3, 2, 5, c);
    rect(g, 20, 4, 2, 5, c);
    cap();
  } else if (style === "side") {
    blob(g, 11, 9, 6, 5, c);
    blob(g, 20, 11, 4, 3.5, c);
    rect(g, 8, 12, 4, 4, c);
  } else if (style === "curly") {
    blob(g, 9, 7, 2.4, 2.4, c);
    blob(g, 13, 5, 2.6, 2.6, c);
    blob(g, 18, 5, 2.6, 2.6, c);
    blob(g, 22, 8, 2.3, 2.3, c);
    cap();
  } else {
    blob(g, 16, 10, 7.2, 2.2, c);
    blob(g, 8, 14, 1.5, 1.6, skin);
    blob(g, 24, 14, 1.5, 1.6, skin);
  }
  rect(g, 12, 8, 3, 2, hi);
}
function outline(g: (string | null)[][]) {
  const next = empty();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (g[y][x]) {
        next[y][x] = g[y][x];
        continue;
      }
      const near = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ].some(([xx, yy]) => yy >= 0 && xx >= 0 && yy < ROWS && xx < COLS && g[yy][xx]);
      if (near) next[y][x] = "#4A3B55";
    }
  }
  return next;
}

export function spriteGrid(a: Pick<Character, "gender" | "hair" | "hairColor" | "skin" | "outfit">) {
  const g = empty();
  const skin = a.skin;
  const outfit = a.outfit;
  const dark = shade(outfit, -28);
  const ink = "#3A3148";
  if (a.gender === "girl") {
    blob(g, 16, 26, 6.2, 4.2, outfit);
    rect(g, 11, 24, 10, 3, outfit);
    rect(g, 14, 27, 2, 1, dark);
    rect(g, 17, 27, 2, 1, dark);
    rect(g, 12, 31, 3, 2, ink);
    rect(g, 18, 31, 3, 2, ink);
    rect(g, 13, 30, 2, 2, skin);
    rect(g, 18, 30, 2, 2, skin);
  } else {
    rect(g, 12, 23, 8, 5, outfit);
    rect(g, 15, 25, 2, 3, dark);
    rect(g, 12, 28, 3, 3, dark);
    rect(g, 17, 28, 3, 3, dark);
    rect(g, 12, 31, 3, 2, ink);
    rect(g, 17, 31, 3, 2, ink);
  }
  rect(g, 9, 24, 3, 4, skin);
  rect(g, 20, 24, 3, 4, skin);
  rect(g, 15, 21, 2, 3, skin);
  blob(g, 16, 13, 8.4, 8.2, skin);
  rect(g, 11, 14, 2, 2, ink);
  rect(g, 19, 14, 2, 2, ink);
  dot(g, 11, 14, "#fff");
  dot(g, 19, 14, "#fff");
  rect(g, 9, 17, 2, 1, "#F3A8C4");
  rect(g, 21, 17, 2, 1, "#F3A8C4");
  rect(g, 15, 18, 2, 1, "#C98496");
  paintHair(g, a.hair, a.hairColor, shade(a.hairColor, 48), skin);
  rect(g, 11, 14, 2, 2, ink);
  rect(g, 19, 14, 2, 2, ink);
  dot(g, 11, 14, "#fff");
  dot(g, 19, 14, "#fff");
  rect(g, 9, 17, 2, 1, "#F3A8C4");
  rect(g, 21, 17, 2, 1, "#F3A8C4");
  rect(g, 15, 18, 2, 1, "#C98496");
  return outline(g);
}
