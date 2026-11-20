import { spriteGrid, type Character } from "./avatar";

export function drawResultCard(
  canvas: HTMLCanvasElement,
  opts: {
    character: Character;
    region: string;
    stars: number;
    maxStars: number;
    score: number;
    cleared: number;
    total: number;
  },
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = 900;
  canvas.height = 520;
  ctx.fillStyle = "#FFF8F1";
  ctx.fillRect(0, 0, 900, 520);
  round(ctx, 36, 36, 828, 448, 36, "#FFFFFF");
  ctx.fillStyle = "#F8C8DC";
  ctx.beginPath();
  ctx.arc(140, 120, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFF3B0";
  ctx.beginPath();
  ctx.arc(760, 90, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#C5E4F7";
  ctx.beginPath();
  ctx.arc(790, 150, 8, 0, Math.PI * 2);
  ctx.fill();
  const grid = spriteGrid(opts.character);
  const size = 6;
  const ox = 70;
  const oy = 130;
  grid.forEach((row, y) =>
    row.forEach((color, x) => {
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x * size, oy + y * size, size, size);
    }),
  );
  ctx.fillStyle = "#4A3F55";
  ctx.font = "700 28px Nunito, sans-serif";
  ctx.fillText("Digital Platforms", 360, 120);
  ctx.font = "800 42px Nunito, sans-serif";
  ctx.fillText(opts.character.name, 360, 180);
  ctx.font = "700 24px Nunito, sans-serif";
  ctx.fillStyle = "#7A6B86";
  ctx.fillText(opts.region, 360, 220);
  ctx.fillStyle = "#4A3F55";
  ctx.font = "800 36px Nunito, sans-serif";
  ctx.fillText(`${opts.stars} / ${opts.maxStars} stars`, 360, 290);
  ctx.font = "700 24px Nunito, sans-serif";
  ctx.fillText(`Score ${opts.score}`, 360, 340);
  ctx.fillText(`${opts.cleared} / ${opts.total} levels cleared`, 360, 380);
  if (opts.character.studentId) {
    ctx.fillStyle = "#9A8AA3";
    ctx.font = "600 18px Nunito, sans-serif";
    ctx.fillText(opts.character.studentId, 360, 430);
  }
}

function round(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

export function downloadCard(canvas: HTMLCanvasElement, name: string) {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${name.replace(/\s+/g, "-").toLowerCase()}-result.png`;
  link.click();
}
