import { useEffect, useRef } from "react";
import { Cover } from "./Cover";
import { PlayView } from "./PlayView";
import { Creator, RegionPath, WorldMap, Admin, SpriteSheet, levelFrom, regionFrom, useRoute } from "./screens";
import { useGame, StoreProvider } from "./store";
import { levelKey } from "./storage";
import "./tokens.css";
import "./styles.css";
import "./buttons.css";
import "./level.css";

function Shell() {
  const { path, go } = useRoute();
  const game = useGame();
  const region = regionFrom(path);
  const level = levelFrom(path, region);
  const index = region && level ? region.levels.findIndex((item) => item.id === level.id) : -1;
  const pending = useRef<string | null>(null);
  const unlocked =
    !!region &&
    !!level &&
    (index === 0 || !!game.save.levels[levelKey(region.id, region.levels[index - 1].id)]);
  useEffect(() => {
    if (!pending.current || !region || !level) return;
    if (!game.save.levels[levelKey(region.id, level.id)]) return;
    const dest = pending.current;
    pending.current = null;
    go(dest);
  }, [game.save.levels, region, level, go]);
  useEffect(() => {
    if (!game.save.character) return;
    if (region?.locked) go("/map");
    else if (region && level && !unlocked) go(`/region/${region.id}`);
  }, [path, region, level, unlocked, go, game.save.character]);
  if (path === "/admin") return <Admin />;
  if (path === "/sprites") return <SpriteSheet />;
  if (path === "/edit" || path === "/new") {
    return (
      <Creator
        initial={path === "/edit" ? game.save.character : null}
        onCancel={game.save.character ? () => go(path === "/edit" ? "/map" : "/") : () => go("/")}
        onDone={(character) => {
          game.setCharacter(character);
          go("/map");
        }}
      />
    );
  }
  if (path === "/" || !game.save.character) {
    return (
      <Cover
        character={game.save.character}
        onStart={() => go("/new")}
        onContinue={() => go("/map")}
        onNew={() => go("/new")}
      />
    );
  }
  if (region?.locked || (level && !unlocked)) return null;
  if (region && level) {
    return (
      <PlayView
        region={region}
        level={level}
        index={index}
        muted={game.save.mute}
        onExit={() => go(`/region/${region.id}`)}
        onDone={(result) => {
          const last = index === region.levels.length - 1;
          const wasClear = region.levels.every((item) => game.save.levels[levelKey(region.id, item.id)]);
          game.finishLevel(region.id, level.id, result);
          if (last && !wasClear) sessionStorage.setItem("party", region.id);
          pending.current = last ? "/map" : `/region/${region.id}/level/${region.levels[index + 1].id}`;
        }}
      />
    );
  }
  if (region && !region.locked) {
    return (
      <RegionPath
        region={region}
        onMap={() => go("/map")}
        onPlay={(id) => go(`/region/${region.id}/level/${id}`)}
      />
    );
  }
  return <WorldMap onEdit={() => go("/edit")} onHome={() => go("/")} />;
}

export default function App() {
  return (
    <StoreProvider>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div id="main">
        <Shell />
      </div>
    </StoreProvider>
  );
}
