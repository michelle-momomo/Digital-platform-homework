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
  return (
    <main className="creator">
      <p className="kicker">Digital Platforms · Guest Sessions</p>
      <h1>Make your pixel pal</h1>
      <div className="creator-grid">
        <div className="stage">
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
          <div className="row">
            <button type="button" className={draft.gender === "girl" ? "on" : ""} onClick={() => setGender("girl")}>
              Girl
            </button>
            <button type="button" className={draft.gender === "boy" ? "on" : ""} onClick={() => setGender("boy")}>
              Boy
            </button>
          </div>
          <p className="label">Hair</p>
          <div className="row wrap">
            {(draft.gender === "girl" ? GIRL_HAIR : BOY_HAIR).map((hair) => (
              <button
                type="button"
                key={hair.id}
                className={draft.hair === hair.id ? "on" : ""}
                onClick={() => setDraft({ ...draft, hair: hair.id })}
              >
                {hair.label}
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
          <div className="row">
            <button className="go" type="submit" disabled={!ready}>
              Enter the map
            </button>
            {onCancel && (
              <button className="ghost" type="button" onClick={onCancel}>
                Back
              </button>
            )}
          </div>
        </form>
      </div>
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
        {regions.map((region) => (
          <button
            key={region.id}
            className={`pin ${region.locked ? "locked" : ""}`}
            style={{ left: `${region.x}%`, top: `${region.y}%`, background: region.color }}
            disabled={region.locked}
            onClick={() => open(region)}
          >
            <Landmark kind={region.landmark} />
            <span>
              {region.title}
              <small>
                {region.when}
                {region.who !== region.title ? ` · ${region.who}` : ""}
              </small>
            </span>
          </button>
        ))}
        <div className={`walker ${walking ? "hop" : "bounce"}`} style={{ left: `${here.x}%`, top: `${here.y}%` }}>
          <Sprite character={character} />
          <em>{character.name}</em>
        </div>
      </div>
    </div>
  );
}

function MapArt() {
  return (
    <svg className="map-art" viewBox="0 0 1000 680" aria-hidden="true">
      <rect width="1000" height="680" rx="36" fill="#FFF4EA" />
      <path d="M210 250 C 320 180, 400 150, 500 170" fill="none" stroke="#E7C6D8" strokeWidth="6" strokeDasharray="2 12" strokeLinecap="round" />
      <path d="M520 180 C 640 160, 700 200, 770 250" fill="none" stroke="#E7C6D8" strokeWidth="6" strokeDasharray="2 12" strokeLinecap="round" />
      <path d="M230 280 C 250 400, 280 460, 320 500" fill="none" stroke="#E4DDE6" strokeWidth="6" strokeDasharray="2 14" strokeLinecap="round" />
      <path d="M760 280 C 760 400, 730 470, 700 510" fill="none" stroke="#E4DDE6" strokeWidth="6" strokeDasharray="2 14" strokeLinecap="round" />
      {regions.map((region) => (
        <g key={region.id} transform={`translate(${region.x * 10} ${region.y * 6.8})`}>
          <ellipse cx="0" cy="34" rx="86" ry="18" fill="#E7D3C4" opacity="0.8" />
          <ellipse cx="0" cy="0" rx="96" ry="58" fill={region.locked ? "#E7E3EA" : region.color} />
          <ellipse cx="-24" cy="-18" rx="36" ry="14" fill="#fff" opacity="0.35" />
        </g>
      ))}
      <circle cx="120" cy="80" r="6" fill="#F8C8DC" />
      <circle cx="880" cy="90" r="8" fill="#FFF3B0" />
      <circle cx="840" cy="140" r="4" fill="#C5E4F7" />
      <circle cx="70" cy="48" r="5" fill="#F4A4C4" />
    </svg>
  );
}

function Landmark({ kind }: { kind: Region["landmark"] }) {
  if (kind === "rocket")
    return (
      <svg viewBox="0 0 16 16" className="mark" aria-hidden="true">
        <rect x="7" y="2" width="2" height="2" fill="#F08A74" />
        <rect x="6" y="4" width="4" height="6" fill="#fff" />
        <rect x="7" y="6" width="2" height="2" fill="#8EC8F5" />
        <rect x="5" y="9" width="2" height="2" fill="#F4A4C4" />
        <rect x="9" y="9" width="2" height="2" fill="#F4A4C4" />
        <rect x="7" y="10" width="2" height="2" fill="#FFF3B0" />
      </svg>
    );
  if (kind === "robot")
    return (
      <svg viewBox="0 0 16 16" className="mark" aria-hidden="true">
        <rect x="7" y="1" width="2" height="2" fill="#7A6B86" />
        <rect x="4" y="3" width="8" height="6" fill="#fff" />
        <rect x="6" y="5" width="1" height="1" fill="#3D3550" />
        <rect x="9" y="5" width="1" height="1" fill="#3D3550" />
        <rect x="5" y="10" width="6" height="4" fill="#C5B3F5" />
      </svg>
    );
  if (kind === "tower")
    return (
      <svg viewBox="0 0 16 16" className="mark" aria-hidden="true">
        <rect x="6" y="4" width="4" height="8" fill="#fff" />
        <rect x="7" y="6" width="2" height="2" fill="#8EC8F5" />
        <rect x="10" y="2" width="4" height="3" fill="#fff" />
        <rect x="11" y="3" width="2" height="1" fill="#F4A4C4" />
      </svg>
    );
  return (
    <svg viewBox="0 0 16 16" className="mark" aria-hidden="true">
      <rect x="3" y="6" width="6" height="3" fill="#fff" />
      <rect x="7" y="5" width="6" height="3" fill="#F7F4F8" />
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
      <ol className="nodes">
        {region.levels.map((level, index) => {
          const result = game.save.levels[levelKey(region.id, level.id)];
          const unlocked = index === 0 || game.save.levels[levelKey(region.id, region.levels[index - 1].id)];
          return (
            <li key={level.id}>
              <button
                className="node"
                style={{ background: NODE_COLORS[index % NODE_COLORS.length] }}
                disabled={!unlocked}
                onClick={() => onPlay(level.id)}
              >
                <span>{index + 1}</span>
                <b>{level.title}</b>
                <Stars n={result?.stars ?? 0} />
              </button>
              {index === cleared && game.save.character && (
                <Sprite character={game.save.character} className="hop rider" />
              )}
            </li>
          );
        })}
        <li className={`flag ${done ? "done" : ""}`}>{done ? "Cleared" : "Finish"}</li>
      </ol>
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
