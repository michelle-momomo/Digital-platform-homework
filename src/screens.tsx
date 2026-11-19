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
  const ready = draft.name.trim().length > 0 && draft.name.trim().length <= 20;
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
          <p>{draft.name.trim() || "Name me"}</p>
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
              required
              maxLength={20}
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
          <div className="row center">
            <button className="ghost" type="button" onClick={randomize}>
              Randomize
            </button>
            <button className="go big" type="submit" disabled={!ready}>
              Start adventure
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

export function WorldMap({ onEdit }: { onEdit: () => void }) {
  const game = useGame();
  const { character } = game.save;
  const [spot, setSpot] = useState(game.save.here);
  const [walking, setWalking] = useState(false);
  if (!character) return null;
  const here = regions.find((region) => region.id === spot) ?? playable[0];
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
        <div>
          <p className="kicker">Digital Platforms · Guest Sessions</p>
          <h1>World map</h1>
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
      <div className="map-wrap">
        <MapArt />
        {regions.map((region) => {
          const stars = region.levels.reduce(
            (n, level) => n + (game.save.levels[levelKey(region.id, level.id)]?.stars ?? 0),
            0,
          );
          return (
            <div key={region.id} className={`isle ${region.locked ? "locked" : ""}`} style={{ left: `${region.x}%`, top: `${region.y}%` }}>
              <button className="isle-btn" disabled={region.locked} onClick={() => open(region)}>
                <span className="banner">
                  <b>{region.title}</b>
                  <small>
                    {region.when}
                    {region.locked ? "" : ` · ${stars}/${region.levels.length * 3}★`}
                  </small>
                </span>
                <IslandArt region={region} stars={stars} />
              </button>
              {here.id === region.id && !region.locked && (
                <div className={`walker ${walking ? "hop" : "bounce"}`}>
                  <Sprite character={character} />
                  <em>{character.name}</em>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MapArt() {
  return (
    <svg className="map-art" viewBox="0 0 1000 760" aria-hidden="true">
      <defs>
        <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.4" fill="#F6D5E2" />
        </pattern>
      </defs>
      <rect width="1000" height="760" rx="40" fill="#FFF6EE" />
      <rect width="1000" height="760" rx="40" fill="url(#dots)" />
      <g className="drift">
        <ellipse cx="120" cy="70" rx="36" ry="14" fill="#fff" />
        <ellipse cx="146" cy="74" rx="22" ry="12" fill="#fff" />
        <ellipse cx="820" cy="120" rx="40" ry="16" fill="#fff" />
        <ellipse cx="860" cy="128" rx="24" ry="12" fill="#fff" />
      </g>
      <path d="M180 360 C 300 250, 380 200, 500 190" fill="none" stroke="#E7B7CC" strokeWidth="7" strokeDasharray="3 14" strokeLinecap="round" />
      <path d="M520 200 C 680 180, 740 260, 820 360" fill="none" stroke="#E7B7CC" strokeWidth="7" strokeDasharray="3 14" strokeLinecap="round" />
      <path d="M200 420 C 220 520, 250 580, 300 620" fill="none" stroke="#DDD4E2" strokeWidth="7" strokeDasharray="3 16" strokeLinecap="round" />
      <path d="M800 430 C 790 540, 760 600, 720 640" fill="none" stroke="#DDD4E2" strokeWidth="7" strokeDasharray="3 16" strokeLinecap="round" />
      <circle cx="90" cy="150" r="5" fill="#F8C8DC" />
      <circle cx="930" cy="80" r="6" fill="#FFF3B0" />
      <circle cx="860" cy="200" r="4" fill="#C5E4F7" />
    </svg>
  );
}

function IslandArt({ region, stars }: { region: Region; stars: number }) {
  const grass = region.locked ? "#E4E0E8" : region.color;
  const cliff = region.locked ? "#C8C2CE" : "#E7C3A8";
  const done = region.levels.map((_, i) => stars >= (i + 1) * 3);
  return (
    <svg viewBox="0 0 220 150" className="island-art" aria-hidden="true">
      <path d="M30 78 C 20 108, 50 132, 110 136 C 180 140, 210 112, 196 82 C 210 60, 180 36, 120 32 C 60 28, 36 50, 30 78 Z" fill={cliff} />
      <path d="M34 70 C 28 98, 54 120, 110 122 C 172 124, 198 102, 188 74 C 198 54, 170 34, 118 32 C 64 30, 40 46, 34 70 Z" fill={grass} />
      <ellipse cx="88" cy="58" rx="36" ry="14" fill="#fff" opacity="0.35" />
      {!region.locked && (
        <>
          <rect x="46" y="78" width="3" height="10" fill="#C68642" />
          <circle cx="47" cy="74" r="8" fill="#7DCEA0" />
          <circle cx="168" cy="96" r="4" fill="#F4A4C4" />
          <circle cx="178" cy="92" r="3" fill="#FFF3B0" />
          <rect x="58" y="100" width="6" height="4" rx="2" fill="#F08A74" />
          <rect x="60" y="96" width="2" height="4" fill="#fff" />
        </>
      )}
      {region.locked && (
        <>
          <rect x="96" y="70" width="28" height="20" rx="4" fill="#fff" opacity="0.8" />
          <path d="M102 70 v-6 a12 12 0 0 1 16 0 v6" fill="none" stroke="#8A7896" strokeWidth="3" />
        </>
      )}
      {region.landmark === "rocket" && <g transform="translate(112 28) scale(1.7)"><rect x="8" y="0" width="6" height="6" fill="#F08A74" /><rect x="6" y="6" width="10" height="18" fill="#fff" /><rect x="9" y="12" width="4" height="4" fill="#8EC8F5" /><rect x="4" y="20" width="4" height="6" fill="#F4A4C4" /><rect x="14" y="20" width="4" height="6" fill="#F4A4C4" /><rect x="9" y="24" width="4" height="6" fill="#FFF3B0" /></g>}
      {region.landmark === "robot" && <g transform="translate(108 30) scale(1.6)"><rect x="10" y="0" width="4" height="6" fill="#7A6B86" /><rect x="4" y="6" width="16" height="14" rx="2" fill="#fff" /><rect x="8" y="11" width="2" height="2" fill="#3A3148" /><rect x="14" y="11" width="2" height="2" fill="#3A3148" /><rect x="6" y="20" width="12" height="10" fill="#C5B3F5" /></g>}
      {region.landmark === "tower" && <g transform="translate(108 22) scale(1.5)"><rect x="8" y="10" width="12" height="28" fill="#fff" /><rect x="12" y="16" width="4" height="6" fill="#8EC8F5" /><rect x="22" y="4" width="16" height="12" rx="6" fill="#fff" /><rect x="26" y="8" width="8" height="3" fill="#F4A4C4" /></g>}
      {!region.locked &&
        region.levels.map((_, i) => {
          const t = i / Math.max(1, region.levels.length - 1);
          const x = 36 + t * 110;
          const y = 108 - Math.sin(t * Math.PI) * 18;
          return <circle key={i} cx={x} cy={y} r="5" fill={done[i] ? "#F2C14E" : "#fff"} stroke="#4A3B55" strokeWidth="1" />;
        })}
      {!region.locked && <path d="M150 96 l8 10 h-6 v8 h-4 v-8 h-6 z" fill="#fff" stroke="#4A3B55" />}
    </svg>
  );
}

const NODE_COLORS = ["#B7E4C7", "#FFCDB2", "#D9C7F0", "#C5E4F7", "#FFF3B0", "#F8C8DC"];

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
      <div className="trail">
        <svg viewBox="0 0 360 520" className="trail-art" aria-hidden="true">
          <path d="M70 40 C 70 100, 280 80, 280 150 S 70 220, 80 290 S 280 360, 270 450" fill="none" stroke="#F3C6D8" strokeWidth="8" strokeDasharray="3 12" strokeLinecap="round" />
        </svg>
        {region.levels.map((level, index) => {
          const result = game.save.levels[levelKey(region.id, level.id)];
          const unlocked = index === 0 || game.save.levels[levelKey(region.id, region.levels[index - 1].id)];
          const left = index % 2 === 0 ? "12%" : "58%";
          const top = `${6 + index * 14}%`;
          return (
            <button
              key={level.id}
              className="node"
              style={{ left, top, background: NODE_COLORS[index % NODE_COLORS.length] }}
              disabled={!unlocked}
              onClick={() => onPlay(level.id)}
            >
              <span>{index + 1}</span>
              <b>{level.title}</b>
              <Stars n={result?.stars ?? 0} />
              {index === Math.min(cleared, region.levels.length - 1) && game.save.character && (
                <Sprite character={game.save.character} className="hop rider" />
              )}
            </button>
          );
        })}
        <div className={`flag ${done ? "done" : ""}`}>{done ? "Cleared" : "Finish"}</div>
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

export function useRoute() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
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
