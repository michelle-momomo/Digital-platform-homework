import { COLS, spriteGrid, type Character } from "./avatar";

export function Sprite({
  character,
  className = "",
  label,
}: {
  character: Pick<Character, "gender" | "hair" | "hairColor" | "skin" | "outfit">;
  className?: string;
  label?: string;
}) {
  const grid = spriteGrid(character);
  return (
    <svg
      viewBox={`0 0 ${COLS} ${grid.length}`}
      className={`sprite ${className}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label ?? "Pixel avatar"}
    >
      {grid.flatMap((row, y) =>
        row.flatMap((color, x) =>
          color ? (
            <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />
          ) : [],
        ),
      )}
    </svg>
  );
}
