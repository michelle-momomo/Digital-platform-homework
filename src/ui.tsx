import type { Source } from "./data";

export function Icon({
  name,
  size = 20,
}: {
  name:
    | "arrow"
    | "layers"
    | "connect"
    | "launch"
    | "check"
    | "book"
    | "close"
    | "staff"
    | "cards";
  size?: number;
}) {
  const paths = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />
      </>
    ),
    connect: (
      <>
        <rect x="3" y="4" width="6" height="6" rx="2" />
        <rect x="15" y="14" width="6" height="6" rx="2" />
        <path d="M9 7h6a3 3 0 0 1 3 3v4M6 10v7h9" />
      </>
    ),
    launch: (
      <>
        <path d="m14 4 6-1-1 6-8 8-4-4 7-9ZM7 13l-3 1-1 5 5-1M11 17l-1 4 4-1 2-5" />
        <path d="m15 7 2 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    book: (
      <>
        <path d="M12 6v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v14c-4-1-6 0-9 2-3-2-5-3-9-2V4Z" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    staff: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="16.5" cy="9" r="2.2" />
        <path d="M3.5 19c.7-2.7 2.7-4 5.5-4s4.8 1.3 5.5 4" />
        <path d="M14 15.1c1.5-.3 2.9.2 3.9 1.4.6.8.9 1.6 1.1 2.5" />
      </>
    ),
    cards: (
      <>
        <rect x="4" y="6" width="11" height="14" rx="2" />
        <path d="M9 4h9a2 2 0 0 1 2 2v11" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function Citation({ source }: { source: Source }) {
  if (source.extra) {
    return <span className="citation">Extra tip · not from the lecture</span>;
  }
  const label = source.doc ?? "Lecture";
  if (source.pages.length === 0) return <span className="citation">{label}</span>;
  const pages = source.pages.length === 1 ? "p." : "pp.";
  return (
    <span className="citation">
      {label} {pages} {source.pages.join(", ")}
    </span>
  );
}
