import type { ReactElement } from "react";

/** Inline SVG icons for the tool and file desks. Each desk gets its own glyph. */
const glyphs: Record<string, ReactElement> = {
  // GitHub: a branching commit graph
  github: (
    <>
      <circle cx="6" cy="5" r="2.2" />
      <circle cx="6" cy="19" r="2.2" />
      <circle cx="18" cy="8" r="2.2" />
      <path d="M6 7.2v9.6M18 10.2c0 4-6 3.5-11 7" />
    </>
  ),
  // Vercel: a solid triangle
  vercel: <path d="M12 4 21 19H3Z" fill="currentColor" />,
  // Claude Code: a terminal prompt
  claude: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="3" />
      <path d="m7 10 3 2.5L7 15M12.5 15.5H17" />
    </>
  ),
  // Supabase: a lightning bolt
  supabase: <path d="M13.5 3 5 13.5h6L10.5 21 19 10.5h-6Z" />,
  // index.html: angle brackets
  html: <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14" />,
  // styles.css: a paint brush
  css: (
    <>
      <path d="M19.5 3.5 10 13l1 1 9.5-9.5a1.4 1.4 0 0 0-1-1Z" />
      <path d="M9.5 13.5c-2 0-3.5 1.5-3.5 3.3 0 1.4-1 2.2-2.5 2.7 4 1.5 8 0 8-3.5Z" />
    </>
  ),
  // script.js: a pointer clicking
  js: (
    <>
      <path d="m8 4 10 7.5-4.6 1 2.6 5.3-2.2 1-2.6-5.3L8 17Z" />
      <path d="M4 7.5 2.5 6.5M5.5 4 4.8 2.3M3.5 11H1.7" />
    </>
  ),
};

export function ToolIcon({ id, size = 22 }: { id: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyphs[id] ?? <circle cx="12" cy="12" r="7" />}
    </svg>
  );
}
