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
function safeHair(
  g: (string | null)[][],
  x: number,
  y: number,
  c: string,
) {
  if (x >= 10 && x <= 21 && y >= 14) return;
  dot(g, x, y, c);
}
function hairBlob(
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
      if (dx * dx + dy * dy <= 1) safeHair(g, x, y, c);
    }
  }
}
function paintHair(g: (string | null)[][], style: HairId, c: string, hi: string, skin: string) {
  const cap = () => hairBlob(g, 16, 10, 9, 5.4, c);
  if (style === "bob") {
    cap();
    hairBlob(g, 8, 16, 2.2, 5.5, c);
    hairBlob(g, 23, 16, 2.2, 5.5, c);
  } else if (style === "pigtails") {
    cap();
    hairBlob(g, 5, 18, 3.3, 4.4, c);
    hairBlob(g, 27, 18, 3.3, 4.4, c);
    safeHair(g, 5, 17, "#fff");
    safeHair(g, 26, 17, "#fff");
  } else if (style === "bun") {
    hairBlob(g, 16, 4, 3.6, 3.2, c);
    cap();
    safeHair(g, 15, 3, hi);
  } else if (style === "long") {
    cap();
    for (let y = 14; y < 34; y++) {
      for (let x = 6; x <= 8; x++) safeHair(g, x, y, c);
      for (let x = 23; x <= 25; x++) safeHair(g, x, y, c);
    }
  } else if (style === "puffs") {
    hairBlob(g, 6, 11, 4.2, 4.2, c);
    hairBlob(g, 26, 11, 4.2, 4.2, c);
    cap();
    safeHair(g, 5, 9, hi);
    safeHair(g, 25, 9, hi);
  } else if (style === "spiky") {
    for (const x of [9, 13, 17, 21]) rect(g, x, 3, 2, 7, c);
    cap();
  } else if (style === "side") {
    hairBlob(g, 10, 9, 6.5, 4.5, c);
    hairBlob(g, 20, 11, 4, 3, c);
    for (let y = 12; y < 17; y++) safeHair(g, 7, y, c);
  } else if (style === "curly") {
    hairBlob(g, 9, 7, 2.6, 2.6, c);
    hairBlob(g, 14, 5, 2.8, 2.8, c);
    hairBlob(g, 19, 5, 2.8, 2.8, c);
    hairBlob(g, 23, 8, 2.4, 2.4, c);
    cap();
  } else {
    hairBlob(g, 16, 9, 8, 2.4, c);
    blob(g, 7, 15, 1.6, 1.8, skin);
    blob(g, 24, 15, 1.6, 1.8, skin);
  }
  for (let x = 13; x <= 16; x++) safeHair(g, x, 8, hi);
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
  blob(g, 16, 16, 8.6, 8.4, skin);
  paintHair(g, a.hair, a.hairColor, shade(a.hairColor, 55), skin);
  blob(g, 16, 18.2, 6.4, 5.2, skin);
  rect(g, 11, 15, 3, 3, ink);
  rect(g, 18, 15, 3, 3, ink);
  dot(g, 11, 15, "#fff");
  dot(g, 18, 15, "#fff");
  rect(g, 9, 19, 2, 1, "#F3A8C4");
  rect(g, 21, 19, 2, 1, "#F3A8C4");
  rect(g, 15, 21, 3, 1, "#C98496");
  return outline(g);
}
