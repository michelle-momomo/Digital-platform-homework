import { useCallback, useEffect, useRef, useState } from "react";
import {
  BOY_HAIR,
  GIRL_HAIR,
  HAIR_COLORS,
  OUTFITS,
  SKINS,
  defaultCharacter,
  hairsFor,
  type Character,
  type Gender,
} from "./avatar";
import { Sprite } from "./AvatarView";
import { drawResultCard, downloadCard } from "./card";
import { findRegion, playable, regions, type Region } from "./content";
import { adminPasscode, endpoint, fetchRemote } from "./results";
import { sfx } from "./sfx";
import { useGame } from "./store";
import { levelKey, type LogEntry } from "./storage";

export function Creator({
  initial,
  onDone,
  onCancel,
}: {
  initial: Character | null;
  onDone: (character: Character) => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<Character>(
    initial ?? defaultCharacter("girl"),
  );
  const hairs = hairsFor(draft.gender);
  function setGender(gender: Gender) {
    const hair = hairsFor(gender).some((item) => item.id === draft.hair)
      ? draft.hair
      : hairsFor(gender)[0].id;
    setDraft({ ...draft, gender, hair });
  }
  const nameRef = useRef<HTMLInputElement>(null);
  const [nameShake, setNameShake] = useState(false);
  const ready = draft.name.trim().length > 0 && draft.name.trim().length <= 20;
  function focusName() {
    nameRef.current?.focus();
    nameRef.current?.scrollIntoView({ block: "center" });
  }
  function pokeDisabled() {
    if (ready) return;
    focusName();
    setNameShake(true);
    window.setTimeout(() => setNameShake(false), 300);
  }
  function randomize() {
    const gender: Gender = Math.random() < 0.5 ? "girl" : "boy";
    const options = hairsFor(gender);
    const pick = <T extends { hex: string }>(list: T[]) => list[Math.floor(Math.random() * list.length)].hex;
    setDraft({
      ...draft,
      gender,
      hair: options[Math.floor(Math.random() * options.length)].id,
      hairColor: pick(HAIR_COLORS),
      skin: pick(SKINS),
      outfit: pick(OUTFITS),
    });
  }
  return (
    <main className="creator">
      <section className="creator-card">
        <p className="kicker">Digital Platforms · Guest Sessions</p>
        <h1>Make your pixel pal</h1>
        <div className="pedestal">
          <span className="spark">✦</span>
          <Sprite character={draft} className="bounce big" label="Your avatar preview" />
          <button type="button" className="text-btn name-me" onClick={focusName}>
            {draft.name.trim() || "Name me"}
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!ready) return;
            onDone({ ...draft, name: draft.name.trim(), studentId: draft.studentId.trim() });
          }}
        >
          <div className="row center">
            <button type="button" className={draft.gender === "girl" ? "on" : ""} onClick={() => setGender("girl")}>
              Girl
            </button>
            <button type="button" className={draft.gender === "boy" ? "on" : ""} onClick={() => setGender("boy")}>
              Boy
            </button>
          </div>
          <p className="label">Hair</p>
          <div className="hair-row">
            {(draft.gender === "girl" ? GIRL_HAIR : BOY_HAIR).map((hair) => (
              <button
                type="button"
                key={hair.id}
                className={draft.hair === hair.id ? "hair-pick on" : "hair-pick"}
                onClick={() => setDraft({ ...draft, hair: hair.id })}
                aria-label={hair.label}
              >
                <Sprite
                  character={{ ...draft, hair: hair.id }}
                  className="mini"
                  label=""
                />
                <small>{hair.label}</small>
              </button>
            ))}
          </div>
          <Swatches
            label="Hair colour"
            colors={HAIR_COLORS}
            value={draft.hairColor}
            onPick={(hairColor) => setDraft({ ...draft, hairColor })}
          />
          <Swatches
            label="Skin"
            colors={SKINS}
            value={draft.skin}
            onPick={(skin) => setDraft({ ...draft, skin })}
          />
          <Swatches
            label="Outfit"
            colors={OUTFITS}
            value={draft.outfit}
            onPick={(outfit) => setDraft({ ...draft, outfit })}
          />
          <label>
            Name
            <input
              ref={nameRef}
              required
              maxLength={20}
              className={nameShake ? "shake-input" : ""}
              value={draft.name}
              placeholder="Your name"
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </label>
          <label>
            Student ID
            <input
              maxLength={24}
              value={draft.studentId}
              placeholder="Optional"
              onChange={(event) => setDraft({ ...draft, studentId: event.target.value })}
            />
          </label>
          <div className="creator-actions">
            <span className="primary-wrap" onClick={pokeDisabled}>
              <button className="go big primary" type="submit" disabled={!ready}>
                Start adventure
              </button>
            </span>
            {!ready && <p className="name-hint">Give your pal a name first</p>}
            <button className="ghost" type="button" onClick={randomize}>
              Randomize
            </button>
            {onCancel && (
              <button className="text-btn" type="button" onClick={onCancel}>
                Back
              </button>
            )}
          </div>
        </form>
      </section>
      <span className="sr-only">{hairs.length} hairstyles</span>
    </main>
  );
}

function Swatches({
  label,
  colors,
  value,
  onPick,
}: {
  label: string;
  colors: { id: string; hex: string; label: string }[];
  value: string;
  onPick: (hex: string) => void;
}) {
  return (
    <>
      <p className="label">{label}</p>
      <div className="swatches">
        {colors.map((color) => (
          <button
            type="button"
            key={color.id}
            aria-label={`${label} ${color.label}`}
            aria-pressed={value === color.hex}
            className={value === color.hex ? "swatch on" : "swatch"}
            style={{ background: color.hex }}
            onClick={() => onPick(color.hex)}
          />
        ))}
      </div>
    </>
  );
}

export function WorldMap({ onEdit, onHome }: { onEdit: () => void; onHome: () => void }) {
  const game = useGame();
  const { character } = game.save;
  const [spot, setSpot] = useState(game.save.here);
  const [walking, setWalking] = useState(false);
  const [guide, setGuide] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem("dp-map-guide")) setGuide(true);
    } catch {
      /* storage unavailable */
    }
  }, []);
  function dismissGuide() {
    setGuide(false);
    try {
      localStorage.setItem("dp-map-guide", "1");
    } catch {
      /* storage unavailable */
    }
  }
  if (!character) return null;
  const here = regions.find((region) => region.id === spot) ?? playable[0];
  const startHere = playable.find((item) => {
    const done = item.levels.filter((level) => game.save.levels[levelKey(item.id, level.id)]).length;
    return done < item.levels.length;
  });
  function open(region: Region) {
    if (region.locked || walking) return;
    sfx("pop", game.save.mute);
    setWalking(true);
    setSpot(region.id);
    game.setHere(region.id);
    window.setTimeout(() => {
      setWalking(false);
      window.history.pushState({}, "", `/region/${region.id}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, 650);
  }
  return (
    <div className="world">
      <header className="topbar">
        <div className="brand">
          <button className="home-btn" onClick={onHome} aria-label="Cover">
            ✿
          </button>
          <div>
            <p className="kicker">Digital Platforms · Guest Sessions</p>
            <h1>World map</h1>
          </div>
        </div>
        <div className="who">
          <Sprite character={character} className="bounce" />
          <div>
            <b>{character.name}</b>
            <span>{game.stars} stars</span>
            <button className="text-btn" onClick={onEdit}>
              Edit character
            </button>
          </div>
        </div>
        <button className="ghost" onClick={() => game.setMute(!game.save.mute)}>
          {game.save.mute ? "Sound off" : "Sound on"}
        </button>
      </header>
      <div className="map-wrap" onClick={guide ? dismissGuide : undefined}>
        <MapArt />
        {regions.map((region) => {
          const stars = region.levels.reduce(
            (n, level) => n + (game.save.levels[levelKey(region.id, level.id)]?.stars ?? 0),
            0,
          );
          return (
            <div key={region.id} className={`isle ${region.locked ? "locked" : ""}`} style={{ left: `${region.x}%`, top: `${region.y}%` }}>
              <button
                className="isle-btn"
                disabled={region.locked}
                aria-label={
                  region.locked
                    ? `${region.title}, coming soon`
                    : `${region.title}, ${region.when}, ${stars} of ${region.levels.length * 3} stars`
                }
                onClick={() => open(region)}
              >
                <span className="banner">
                  <b>{region.title}</b>
                  <small>
                    {region.when}
                    {region.locked ? "" : ` · ${stars}/${region.levels.length * 3}★`}
                  </small>
                </span>
                <span className="isle-art">
                  {guide && startHere?.id === region.id && <span className="map-guide">Start here! Tap to enter</span>}
                  <IslandArt region={region} stars={stars} />
                  {here.id === region.id && !region.locked && (
                    <Walker
                      character={character}
                      walking={walking}
                      index={standOn(region, game.save.levels)}
                      count={region.levels.length}
                    />
                  )}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function standOn(region: Region, levels: Record<string, { stars: number }>) {
  const next = region.levels.findIndex((level) => !levels[levelKey(region.id, level.id)]);
  return next === -1 ? region.levels.length - 1 : next;
}

function dotAt(index: number, count: number) {
  const t = count <= 1 ? 0.5 : index / (count - 1);
  return {
    x: 52 + t * 236,
    y: 176 - Math.sin(t * Math.PI) * 34,
  };
}

function Walker({
  character,
  walking,
  index,
  count,
}: {
  character: Character;
  walking: boolean;
  index: number;
  count: number;
}) {
  const dot = dotAt(index, count);
  return (
    <div
      className={`walker ${walking ? "hop" : "bounce"}`}
      style={{ left: `${(dot.x / 340) * 100}%`, top: `${(dot.y / 240) * 100}%` }}
    >
      <em>{character.name}</em>
      <Sprite character={character} label="" />
    </div>
  );
}

function MapArt() {
  return (
    <svg className="map-art" viewBox="0 0 1000 1100" aria-hidden="true">
      <defs>
        <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.4" fill="var(--art-dot)" />
        </pattern>
      </defs>
      <rect width="1000" height="760" rx="40" fill="var(--art-sea)" />
      <rect width="1000" height="760" rx="40" fill="url(#dots)" />
      <g className="drift">
        <ellipse cx="120" cy="70" rx="36" ry="14" fill="var(--surface)" />
        <ellipse cx="146" cy="74" rx="22" ry="12" fill="var(--surface)" />
        <ellipse cx="820" cy="120" rx="40" ry="16" fill="var(--surface)" />
        <ellipse cx="860" cy="128" rx="24" ry="12" fill="var(--surface)" />
      </g>
      <path d="M240 620 C 320 420, 380 340, 500 250" fill="none" stroke="var(--art-trail)" strokeWidth="7" strokeDasharray="3 14" strokeLinecap="round" />
      <path d="M540 250 C 640 300, 700 420, 760 620" fill="none" stroke="var(--art-trail)" strokeWidth="7" strokeDasharray="3 14" strokeLinecap="round" />
      <path d="M250 700 C 260 820, 280 900, 300 960" fill="none" stroke="var(--art-trail-muted)" strokeWidth="7" strokeDasharray="3 16" strokeLinecap="round" />
      <path d="M760 700 C 750 820, 740 900, 720 960" fill="none" stroke="var(--art-trail-muted)" strokeWidth="7" strokeDasharray="3 16" strokeLinecap="round" />
      <circle cx="90" cy="150" r="5" fill="var(--art-blush)" />
      <circle cx="930" cy="80" r="6" fill="var(--art-butter)" />
      <circle cx="860" cy="200" r="4" fill="var(--isle-sky)" />
    </svg>
  );
}

function IslandArt({ region, stars }: { region: Region; stars: number }) {
  const grass = region.locked ? "var(--art-locked)" : region.color;
  const cliff = region.locked ? "var(--art-locked-deep)" : "var(--art-cliff)";
  const dots = region.levels.map((_, i) => dotAt(i, region.levels.length));
  const done = region.levels.map((_, i) => stars >= (i + 1) * 3);
  return (
    <svg viewBox="0 0 340 240" className="island-art" aria-hidden="true">
      <ellipse cx="70" cy="36" rx="22" ry="10" fill="var(--surface)" opacity="0.9" />
      <ellipse cx="88" cy="40" rx="14" ry="8" fill="var(--surface)" />
      <ellipse cx="270" cy="28" rx="26" ry="11" fill="var(--surface)" opacity="0.85" />
      <path d="M28 118 C 8 168, 40 214, 170 222 C 300 230, 338 176, 318 124 C 340 86, 286 48, 176 42 C 70 36, 40 70, 28 118 Z" fill={cliff} />
      <path d="M40 108 C 26 156, 58 196, 170 202 C 286 208, 322 160, 304 114 C 322 80, 274 52, 176 48 C 82 44, 50 68, 40 108 Z" fill={grass} />
      <ellipse cx="118" cy="78" rx="48" ry="16" fill="var(--surface)" opacity="0.28" />
      {!region.locked && (
        <>
          <ellipse cx="78" cy="150" rx="22" ry="10" fill="var(--art-pond)" />
          <ellipse cx="74" cy="148" rx="6" ry="3" fill="var(--art-lily)" />
          <path d="M108 156 q10 -10 20 0 q10 -10 20 0" fill="none" stroke="var(--art-wood)" strokeWidth="3" />
          <path d="M108 160 q10 8 20 0 q10 8 20 0" fill="none" stroke="var(--art-cliff)" strokeWidth="3" />
          <g>
            <rect x="46" y="118" width="5" height="18" fill="var(--art-wood)" />
            <circle cx="48" cy="112" r="12" fill="var(--art-leaf)" />
            <circle cx="40" cy="116" r="8" fill="var(--art-leaf-light)" />
            <rect x="250" y="128" width="5" height="16" fill="var(--art-wood)" />
            <circle cx="252" cy="122" r="11" fill="var(--art-leaf-bright)" />
            <rect x="292" y="150" width="4" height="14" fill="var(--art-wood)" />
            <circle cx="294" cy="146" r="9" fill="var(--art-leaf)" />
          </g>
          <circle cx="210" cy="168" r="5" fill="var(--pink)" />
          <circle cx="224" cy="162" r="4" fill="var(--art-butter)" />
          <circle cx="236" cy="174" r="3.5" fill="var(--art-coral)" />
          <circle cx="130" cy="176" r="4" fill="var(--surface)" />
          <circle cx="142" cy="170" r="3" fill="var(--art-blush)" />
          <rect x="168" y="186" width="10" height="6" rx="3" fill="var(--art-coral)" />
          <rect x="172" y="180" width="2" height="6" fill="var(--surface)" />
        </>
      )}
      {region.locked && (
        <g opacity="0.85">
          <ellipse cx="170" cy="120" rx="70" ry="28" fill="var(--surface)" />
          <rect x="154" y="112" width="32" height="22" rx="5" fill="var(--surface)" />
          <path d="M160 112 v-8 a14 14 0 0 1 20 0 v8" fill="none" stroke="var(--muted)" strokeWidth="3" />
        </g>
      )}
      {region.landmark === "rocket" && (
        <g transform="translate(146 18) scale(2.4)">
          <rect x="8" y="0" width="6" height="6" fill="var(--art-coral)" />
          <rect x="6" y="6" width="10" height="18" fill="var(--surface)" />
          <rect x="9" y="12" width="4" height="4" fill="var(--art-sky-deep)" />
          <rect x="4" y="20" width="4" height="6" fill="var(--pink)" />
          <rect x="14" y="20" width="4" height="6" fill="var(--pink)" />
          <rect x="9" y="24" width="4" height="6" fill="var(--art-butter)" />
        </g>
      )}
      {region.landmark === "robot" && (
        <g transform="translate(138 22) scale(2.3)">
          <rect x="10" y="0" width="4" height="6" fill="var(--art-metal)" />
          <rect x="2" y="6" width="20" height="16" rx="3" fill="var(--surface)" />
          <rect x="7" y="11" width="3" height="3" fill="var(--art-dark)" />
          <rect x="14" y="11" width="3" height="3" fill="var(--art-dark)" />
          <rect x="4" y="22" width="16" height="12" rx="2" fill="var(--art-lavender)" />
        </g>
      )}
      {region.landmark === "tower" && (
        <g transform="translate(142 8) scale(2.2)">
          <rect x="8" y="14" width="14" height="36" fill="var(--surface)" />
          <rect x="11" y="20" width="4" height="7" fill="var(--art-sky-deep)" />
          <rect x="11" y="32" width="4" height="7" fill="var(--art-sky-deep)" />
          <rect x="24" y="6" width="22" height="16" rx="8" fill="var(--surface)" />
          <rect x="29" y="11" width="12" height="4" fill="var(--pink)" />
        </g>
      )}
      {!region.locked && (
        <polyline
          points={dots.map((dot) => `${dot.x},${dot.y}`).join(" ")}
          fill="none"
          stroke="var(--surface)"
          strokeWidth="6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {!region.locked &&
        dots.map((dot, i) => (
          <g key={i} pointerEvents="none" opacity="0.55">
            <circle cx={dot.x} cy={dot.y} r="11" fill={done[i] ? "var(--yellow)" : "var(--surface)"} stroke="var(--ink)" strokeWidth="1.6" />
            <text x={dot.x} y={dot.y + 3.5} textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ink)">
              {i + 1}
            </text>
          </g>
        ))}
      {!region.locked && (
        <g transform="translate(292 158)">
          <rect x="0" y="0" width="3" height="28" fill="var(--ink)" />
          <rect x="3" y="2" width="18" height="12" fill="var(--surface)" />
          <rect x="3" y="2" width="4.5" height="4" fill="var(--ink)" />
          <rect x="12" y="2" width="4.5" height="4" fill="var(--ink)" />
          <rect x="7.5" y="6" width="4.5" height="4" fill="var(--ink)" />
          <rect x="16.5" y="6" width="4.5" height="4" fill="var(--ink)" />
          <rect x="3" y="10" width="4.5" height="4" fill="var(--ink)" />
          <rect x="12" y="10" width="4.5" height="4" fill="var(--ink)" />
        </g>
      )}
    </svg>
  );
}

const NODE_COLORS = ["var(--isle-mint)", "var(--isle-peach)", "var(--isle-lilac)", "var(--isle-sky)", "var(--art-butter)", "var(--art-blush)"];

export function RegionPath({
  region,
  onMap,
  onPlay,
}: {
  region: Region;
  onMap: () => void;
  onPlay: (levelId: string) => void;
}) {
  const game = useGame();
  const [party, setParty] = useState(false);
  const cleared = game.cleared(region.id);
  const done = cleared === region.levels.length;
  const trailRef = useRef<HTMLDivElement>(null);
  const [segments, setSegments] = useState<string[]>([]);
  useEffect(() => {
    const box = trailRef.current;
    if (!box) return;
    const measure = () => {
      const base = box.getBoundingClientRect();
      const rects = [...box.querySelectorAll<HTMLElement>(".node, .flag")].map((spot) => {
        const rect = spot.getBoundingClientRect();
        return { x: rect.left - base.left, y: rect.top - base.top, w: rect.width, h: rect.height };
      });
      const next: string[] = [];
      for (let i = 1; i < rects.length; i++) {
        const a = edgePoint(rects[i - 1], rects[i]);
        const b = edgePoint(rects[i], rects[i - 1]);
        if (a && b) next.push(`M${a.x},${a.y} L${b.x},${b.y}`);
      }
      setSegments(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [region.id, cleared]);
  useEffect(() => {
    if (sessionStorage.getItem("party") === region.id) {
      setParty(true);
      sessionStorage.removeItem("party");
      sfx("fanfare", game.save.mute);
    }
  }, [region.id, game.save.mute]);
  return (
    <main className="path">
      <button className="text-btn" onClick={onMap}>
        ← World map
      </button>
      <h1>{region.title}</h1>
      <p className="kicker">
        {region.when} · {region.who} · {region.flavor(cleared)}
      </p>
      {party && done && (
        <div className="party" role="status">
          Region clear
          <Confetti />
          <ResultCard region={region} />
        </div>
      )}
      <div className="trail" ref={trailRef}>
        <svg className="trail-art" aria-hidden="true">
          {segments.map((d) => (
            <path key={d} d={d} fill="none" stroke="var(--art-trail-soft)" strokeWidth="8" strokeDasharray="3 12" strokeLinecap="round" />
          ))}
        </svg>
        {region.levels.map((level, index) => {
          const result = game.save.levels[levelKey(region.id, level.id)];
          const unlocked = index === 0 || game.save.levels[levelKey(region.id, region.levels[index - 1].id)];
          return (
            <button
              key={level.id}
              className={`node ${index % 2 === 0 ? "side-l" : "side-r"} ${unlocked ? "" : "locked"} ${result ? "cleared" : ""} ${index === cleared ? "current" : ""}`}
              style={{ background: NODE_COLORS[index % NODE_COLORS.length] }}
              disabled={!unlocked}
              title={unlocked ? undefined : `Finish level ${index} first`}
              onClick={() => onPlay(level.id)}
            >
              {!unlocked && <span className="lock">🔒</span>}
              {result && <span className="tick">✓</span>}
              <span>{index + 1}</span>
              <b>{level.title}</b>
              <Stars n={result?.stars ?? 0} />
              {index === Math.min(cleared, region.levels.length - 1) && game.save.character && (
                <Sprite character={game.save.character} className="hop rider" />
              )}
            </button>
          );
        })}
        <div className={`flag ${done ? "done" : ""}`}>⚑ {done ? "Cleared" : "Finish"}</div>
      </div>
      <div className="stickers">
        {region.levels.map((level) =>
          game.save.levels[levelKey(region.id, level.id)] ? (
            <span key={level.id}>{level.sticker}</span>
          ) : null,
        )}
      </div>
    </main>
  );
}

type Box = { x: number; y: number; w: number; h: number };

/** Where the line from `from`'s centre towards `to`'s centre leaves `from`, plus a small gap. */
function edgePoint(from: Box, to: Box, gap = 10) {
  const cx = from.x + from.w / 2;
  const cy = from.y + from.h / 2;
  const dx = to.x + to.w / 2 - cx;
  const dy = to.y + to.h / 2 - cy;
  if (dx === 0 && dy === 0) return null;
  const sx = dx === 0 ? Infinity : (from.w / 2 + gap) / Math.abs(dx);
  const sy = dy === 0 ? Infinity : (from.h / 2 + gap) / Math.abs(dy);
  const s = Math.min(sx, sy, 1);
  return { x: Math.round(cx + dx * s), y: Math.round(cy + dy * s) };
}

function Stars({ n }: { n: number }) {
  return (
    <span className="stars" aria-label={`${n} stars`}>
      {[1, 2, 3].map((star) => (
        <i key={star} className={star <= n ? "on" : ""} />
      ))}
    </span>
  );
}

function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => (
        <span key={i} style={{ left: `${(i * 17) % 100}%`, animationDelay: `${i * 0.05}s` }} />
      ))}
    </div>
  );
}

export function ResultCard({ region }: { region: Region }) {
  const game = useGame();
  const canvas = useRef<HTMLCanvasElement>(null);
  const character = game.save.character;
  useEffect(() => {
    if (!canvas.current || !character) return;
    const stars = region.levels.reduce(
      (n, level) => n + (game.save.levels[levelKey(region.id, level.id)]?.stars ?? 0),
      0,
    );
    const score = region.levels.reduce(
      (n, level) => n + (game.save.levels[levelKey(region.id, level.id)]?.score ?? 0),
      0,
    );
    drawResultCard(canvas.current, {
      character,
      region: `${region.title} · ${region.when}`,
      stars,
      maxStars: region.levels.length * 3,
      score,
      cleared: game.cleared(region.id),
      total: region.levels.length,
    });
  }, [character, game, region]);
  if (!character) return null;
  return (
    <div className="card-wrap">
      <canvas ref={canvas} />
      <button
        className="go"
        onClick={() => canvas.current && downloadCard(canvas.current, character.name)}
      >
        Save card
      </button>
    </div>
  );
}

export function Admin() {
  const pass = adminPasscode();
  const [code, setCode] = useState("");
  const [open, setOpen] = useState(!pass);
  const [rows, setRows] = useState<LogEntry[]>([]);
  const [region, setRegion] = useState("all");
  const [note, setNote] = useState("");
  const game = useGame();
  useEffect(() => {
    if (!open) return;
    const logs = game.save.logs;
    if (!endpoint()) {
      setNote("The results backend is not configured.");
      setRows(logs);
      return;
    }
    void fetchRemote().then((remote) => {
      setRows(remote ?? logs);
      if (!remote) setNote("Could not reach the sheet. Showing this browser only.");
    });
  }, [open, game.save.logs]);
  if (pass && !open) {
    return (
      <main className="admin">
        <h1>Admin</h1>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (code === pass) setOpen(true);
            else setNote("Wrong passcode.");
          }}
        >
          <input
            type="password"
            value={code}
            aria-label="Passcode"
            onChange={(event) => setCode(event.target.value)}
          />
          <button className="go" type="submit">
            Unlock
          </button>
        </form>
        {note && <p>{note}</p>}
      </main>
    );
  }
  const levels = rows.filter((row) => row.kind !== "region");
  const filtered = levels.filter((row) => region === "all" || row.region === region);
  const sorted = [...filtered].sort((a, b) => Number(b.score) - Number(a.score));
  const players = new Map<
    string,
    { key: string; name: string; runs: number; correct: number; total: number; score: number }
  >();
  for (const row of levels) {
    const key = `${row.name}|${row.studentId}`;
    const prev = players.get(key) ?? {
      key,
      name: row.name,
      runs: 0,
      correct: 0,
      total: 0,
      score: 0,
    };
    prev.runs += 1;
    prev.correct += Number(row.correct) || 0;
    prev.total += Number(row.total) || 0;
    prev.score += Number(row.score) || 0;
    players.set(key, prev);
  }
  return (
    <main className="admin">
      <h1>Admin</h1>
      {note && <p className="reveal">{note}</p>}
      <label>
        Region
        <select value={region} onChange={(event) => setRegion(event.target.value)}>
          <option value="all">All</option>
          {playable.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      <h2>Leaderboard</h2>
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Runs</th>
            <th>Right</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {[...players.values()]
            .sort((a, b) => b.score - a.score)
            .map((player) => (
              <tr key={player.key}>
                <td>{player.name}</td>
                <td>{player.runs}</td>
                <td>
                  {player.correct}/{player.total}
                </td>
                <td>{player.score}</td>
              </tr>
            ))}
        </tbody>
      </table>
      <h2>Runs</h2>
      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>Name</th>
            <th>ID</th>
            <th>Region</th>
            <th>Level</th>
            <th>Stars</th>
            <th>Score</th>
            <th>Right</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, index) => (
            <tr key={`${row.timestamp}-${index}`}>
              <td>{row.timestamp}</td>
              <td>{row.name}</td>
              <td>{row.studentId}</td>
              <td>{row.region}</td>
              <td>{row.level}</td>
              <td>{row.stars}</td>
              <td>{row.score}</td>
              <td>
                {row.correct}/{row.total}
              </td>
              <td>{Math.round(Number(row.timeMs) / 1000)}s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

export function SpriteSheet() {
  const girl = GIRL_HAIR.map((hair) => ({ gender: "girl" as const, hair: hair.id, label: hair.label }));
  const boy = BOY_HAIR.map((hair) => ({ gender: "boy" as const, hair: hair.id, label: hair.label }));
  return (
    <main className="sheet-page">
      <h1>Hairstyles</h1>
      <div className="sheet-grid">
        {[...girl, ...boy].map((item) => (
          <figure key={item.hair}>
            <Sprite
              character={{
                gender: item.gender,
                hair: item.hair,
                hairColor: HAIR_COLORS[4].hex,
                skin: SKINS[1].hex,
                outfit: item.gender === "girl" ? OUTFITS[5].hex : OUTFITS[3].hex,
              }}
              className="big"
              label={`${item.gender} ${item.label}`}
            />
            <figcaption>
              {item.gender} · {item.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}

export function useRoute() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => {
    // Every route change starts at the top of the page.
    window.scrollTo(0, 0);
  }, [path]);
  const go = useCallback((to: string) => {
    window.history.pushState({}, "", to);
    setPath(window.location.pathname);
  }, []);
  return { path, go };
}

export function regionFrom(path: string) {
  const match = path.match(/^\/region\/([^/]+)/);
  return match ? findRegion(match[1]) : undefined;
}

export function levelFrom(path: string, region: Region | undefined) {
  const match = path.match(/^\/region\/[^/]+\/level\/([^/]+)/);
  if (!match || !region) return undefined;
  return region.levels.find((level) => level.id === match[1]);
}
