import { useEffect } from "react";
import { PlayView } from "./PlayView";
import { Creator, RegionPath, WorldMap, Admin, SpriteSheet, levelFrom, regionFrom, useRoute } from "./screens";
import { useGame, StoreProvider } from "./store";
import { levelKey } from "./storage";
import "./styles.css";

function Shell() {
  const { path, go } = useRoute();
  const game = useGame();
  const region = regionFrom(path);
  const level = levelFrom(path, region);
  const index = region && level ? region.levels.findIndex((item) => item.id === level.id) : -1;
  const unlocked =
    !!region &&
    !!level &&
    (index === 0 || !!game.save.levels[levelKey(region.id, region.levels[index - 1].id)]);
  useEffect(() => {
    if (region?.locked) go("/");
    else if (region && level && !unlocked) go(`/region/${region.id}`);
  }, [path, region, level, unlocked, go]);
  if (path === "/admin") return <Admin />;
  if (path === "/sprites") return <SpriteSheet />;
  if (!game.save.character || path === "/edit") {
    return (
      <Creator
        initial={game.save.character}
        onCancel={game.save.character ? () => go("/") : undefined}
        onDone={(character) => {
          game.setCharacter(character);
          go("/");
        }}
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
          go(`/region/${region.id}`);
        }}
      />
    );
  }
  if (region && !region.locked) {
    return (
      <RegionPath
        region={region}
        onMap={() => go("/")}
        onPlay={(id) => go(`/region/${region.id}/level/${id}`)}
      />
    );
  }
  return <WorldMap onEdit={() => go("/edit")} />;
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
