import { Link, useNavigate, useParams } from "react-router-dom";
import { useGame } from "../../state/store";
import { worldById } from "../../content/worlds";
import { sfx } from "../../engine/feedback/audio";
import type { StageDef } from "../../content/types";
import { LockedScreen } from "../../ui/LockedScreen";

function nodeStars(completed: boolean | undefined, bestStars: number | undefined, unlocked: boolean): string {
  if (completed) return "⭐".repeat(bestStars ?? 1);
  return unlocked ? "" : "🔒";
}

export function WorldMap() {
  const { worldId = "" } = useParams();
  const navigate = useNavigate();
  const world = worldById(worldId);
  const progress = useGame((s) => s.progress);
  const starDust = useGame((s) => s.starDust);
  const worldEnabled = useGame((s) => Boolean(world && s.enabledWorlds[world.id]));

  if (world && !worldEnabled) return <LockedScreen />;
  if (!world) {
    return (
      <div className="screen">
        <p>Unknown world.</p>
        <Link to="/hub" className="btn btn-primary">
          ← Base
        </Link>
      </div>
    );
  }

  // A stage is unlocked if it's first or the previous one is completed.
  const firstIncomplete = world.stages.findIndex((s) => !progress[s.id]?.completed);
  const lastUnlocked = firstIncomplete === -1 ? world.stages.length - 1 : firstIncomplete;

  // Snake layout: rows of 5, alternating direction.
  const rows: StageDef[][] = [];
  for (let i = 0; i < world.stages.length; i += 5) {
    const row = world.stages.slice(i, i + 5);
    rows.push(rows.length % 2 === 1 ? [...row].reverse() : row);
  }

  return (
    <div className="screen world-map">
      <header className="hub-header">
        <Link to="/hub" className="btn btn-secondary" onClick={() => sfx.tap()}>
          ← Base
        </Link>
        <h1>
          {world.icon} {world.name}
        </h1>
        <span className="dust-counter">✨ {starDust}</span>
      </header>

      <div className="map-path">
        {rows.map((row, ri) => (
          <div key={ri} className="map-row">
            {row.map((stage) => {
              const idx = world.stages.indexOf(stage);
              const p = progress[stage.id];
              const unlocked = idx <= lastUnlocked;
              const isNext = idx === lastUnlocked;
              return (
                <button
                  key={stage.id}
                  className={`map-node ${p?.completed ? "done" : ""} ${isNext ? "next" : ""} ${unlocked ? "" : "locked"}`}
                  disabled={!unlocked}
                  onClick={() => {
                    sfx.tap();
                    navigate(`/play/${stage.id}`);
                  }}
                >
                  <span className="node-num">{idx + 1}</span>
                  <span className="node-name">{stage.name}</span>
                  <span className="node-stars">{nodeStars(p?.completed, p?.bestStars, unlocked)}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
