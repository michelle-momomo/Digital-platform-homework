import { Sprite } from "./AvatarView";
import { defaultCharacter, type Character } from "./avatar";

const girl = { ...defaultCharacter("girl"), hair: "pigtails" as const, outfit: "#F8C8DC" };
const boy = { ...defaultCharacter("boy"), hair: "spiky" as const, outfit: "#C5E4F7" };

export function Cover({
  character,
  onStart,
  onContinue,
  onNew,
}: {
  character: Character | null;
  onStart: () => void;
  onContinue: () => void;
  onNew: () => void;
}) {
  return (
    <main className="cover">
      <section className="cover-scene" aria-hidden="true">
        <svg className="cover-art" viewBox="0 0 720 300">
          <ellipse className="cloud drift" cx="90" cy="46" rx="36" ry="14" fill="#fff" />
          <ellipse className="cloud drift" cx="118" cy="52" rx="22" ry="12" fill="#fff" />
          <ellipse className="cloud drift late" cx="560" cy="38" rx="42" ry="16" fill="#fff" />
          <ellipse className="cloud drift late" cx="600" cy="46" rx="24" ry="12" fill="#fff" />
          <path d="M150 168 C 250 120, 300 150, 360 128" fill="none" stroke="#E7B7CC" strokeWidth="4" strokeDasharray="2 10" strokeLinecap="round" />
          <path d="M390 128 C 470 100, 520 140, 590 150" fill="none" stroke="#E7B7CC" strokeWidth="4" strokeDasharray="2 10" strokeLinecap="round" />
          <g className="bob-isle">
            <MiniIsland x={70} y={108} fill="#B7E4C7" />
            <g transform="translate(148 78) scale(1.7)">
              <rect x="8" y="0" width="6" height="6" fill="#F08A74" />
              <rect x="6" y="6" width="10" height="16" fill="#fff" />
              <rect x="9" y="11" width="4" height="4" fill="#8EC8F5" />
              <rect x="4" y="18" width="4" height="6" fill="#F4A4C4" />
              <rect x="14" y="18" width="4" height="6" fill="#F4A4C4" />
            </g>
          </g>
          <g className="bob-isle late">
            <MiniIsland x={268} y={72} fill="#D9C7F0" />
            <g transform="translate(350 52) scale(1.5)">
              <rect x="10" y="0" width="3" height="6" fill="#7A6B86" />
              <rect x="4" y="6" width="16" height="12" rx="2" fill="#fff" />
              <rect x="8" y="10" width="2" height="2" fill="#3A3148" />
              <rect x="14" y="10" width="2" height="2" fill="#3A3148" />
              <rect x="6" y="18" width="12" height="8" fill="#C5B3F5" />
            </g>
          </g>
          <g className="bob-isle later">
            <MiniIsland x={470} y={100} fill="#C5E4F7" />
            <g transform="translate(548 62) scale(1.4)">
              <rect x="8" y="12" width="12" height="26" fill="#fff" />
              <rect x="11" y="18" width="4" height="6" fill="#8EC8F5" />
              <rect x="22" y="4" width="18" height="12" rx="6" fill="#fff" />
              <rect x="26" y="8" width="10" height="3" fill="#F4A4C4" />
            </g>
          </g>
        </svg>
        <div className="cover-pals">
          <Sprite character={girl} className="wave" label="" />
          <Sprite character={boy} className="wave late" label="" />
        </div>
      </section>
      <section className="cover-copy">
        <h1>Digital Platforms · Guest Sessions</h1>
        <p className="cover-sub">
          An interactive review of the guest speaker sessions · MSc Marketing Management & Digital, ESSEC Asia-Pacific · Prof. Madina Kalyayeva’s Digital Platforms course · made by Sijie Du
        </p>
        <div className="cover-actions">
          {character ? (
            <>
              <button className="go big start-main" onClick={onContinue}>
                Continue
              </button>
              <button className="text-btn" onClick={onNew}>
                New character
              </button>
            </>
          ) : (
            <button className="go big start-main" onClick={onStart}>
              Start
            </button>
          )}
        </div>
        <ol className="how">
          <li>
            <span className="step-ico" aria-hidden="true">✿</span>
            <b>Make your pixel pal</b>
          </li>
          <li>
            <span className="step-ico" aria-hidden="true">🏝️</span>
            <b>Pick an open island</b>
            <small>a guest session</small>
          </li>
          <li>
            <span className="step-ico" aria-hidden="true">⚑</span>
            <b>Reach the finish flag</b>
            <small>play the levels, earn stars</small>
          </li>
        </ol>
        <div className="session-row">
          <span className="session mint">Vibe Coding · LaunchLab · 9 Oct</span>
          <span className="session lilac">Agentic AI · Nick Goh · 30 Oct</span>
          <span className="session baby">LinkedIn · Cindy Leong · 13 Nov</span>
          <span className="session mist">More islands coming soon</span>
        </div>
      </section>
    </main>
  );
}

function MiniIsland({ x, y, fill }: { x: number; y: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M18 46 C 8 70, 28 92, 90 96 C 156 100, 176 74, 164 50 C 176 32, 150 14, 90 12 C 36 10, 24 26, 18 46 Z" fill="#E7C3A8" />
      <path d="M24 42 C 16 64, 36 82, 90 84 C 148 86, 166 66, 156 46 C 166 30, 142 16, 90 16 C 42 16, 30 28, 24 42 Z" fill={fill} />
      <rect x="36" y="52" width="3" height="10" fill="#C68642" />
      <circle cx="37" cy="48" r="7" fill="#7DCEA0" />
      <circle cx="128" cy="62" r="3" fill="#F4A4C4" />
      <circle cx="138" cy="58" r="2.4" fill="#FFF3B0" />
    </g>
  );
}
