import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../state/store";
import { completedInWorld, focusWorldIn, nextStageIn, stageById, WORLDS, worldOfStage } from "../content/worlds";
import { MINIGAMES } from "../content/minigames";
import { sfx, unlockAudio } from "../engine/feedback/audio";
import { STR } from "../strings/en";
import { Workshop } from "./Workshop";
import { BaseScene } from "./BaseScene";
import { CouponWallet } from "./CouponWallet";

// Each world portal gets its own planet hue.
const PLANET_HUES: Record<string, string> = {
  numberforge: "#ff8c42",
  melody: "#7c5cff",
  logic: "#ffd166",
  robot: "#9aa5b1",
  time: "#5cc8ff",
  cipher: "#3ddc97",
  builder: "#f4845f",
  living: "#6ee7b7",
  atlas: "#c084fc",
  flags: "#f87171",
  arabic: "#34d399",
  craft: "#a47551",
  wordwizard: "#fbbf24",
  body: "#fb7185",
  feelings: "#a78bfa",
  affix: "#22d3ee",
  grammar: "#f472b6",
  prepositions: "#4ade80",
  directions: "#38bdf8",
  physics: "#f97316",
  chemistry: "#a3e635",
  algebra: "#e879f9",
};

export function Hub() {
  const navigate = useNavigate();
  const starDust = useGame((s) => s.starDust);
  const progress = useGame((s) => s.progress);
  const badges = useGame((s) => s.badges);
  const soundOn = useGame((s) => s.soundOn);
  const musicOn = useGame((s) => s.musicOn);
  const toggleSound = useGame((s) => s.toggleSound);
  const toggleMusic = useGame((s) => s.toggleMusic);
  const [shopOpen, setShopOpen] = useState(false);

  const enabledWorlds = useGame((s) => s.enabledWorlds);
  const enabledGames = useGame((s) => s.enabledGames);
  // The world the planets row highlights as "current".
  const focus = focusWorldIn(WORLDS.filter((w) => enabledWorlds[w.id]), progress);
  // Continue where he left off: the in-progress session, or the next stage
  // in the last world he played — only if that world is still enabled.
  const lastStageId = useGame((s) => s.lastStageId);
  const session = useGame((s) => s.session);
  const lastWorld = lastStageId ? worldOfStage(lastStageId) : undefined;
  let continueStage = null;
  if (session && !session.result) continueStage = stageById(session.stageId);
  else if (lastWorld) continueStage = nextStageIn(lastWorld, progress);
  const continueWorld = continueStage ? worldOfStage(continueStage.id) : undefined;
  const continueAllowed = continueWorld && enabledWorlds[continueWorld.id];

  return (
    <div className="screen hub">
      <section className="hero">
        <BaseScene badgeCount={badges.length} />
        <div className="hero-top">
          <span className="dust-counter">✨ {starDust}</span>
          <div className="hub-header-right">
            <button className="btn btn-icon" aria-label="music" onClick={() => { unlockAudio(); toggleMusic(); }}>
              <span style={musicOn ? undefined : { opacity: 0.35 }}>🎵</span>
            </button>
            <button className="btn btn-icon" aria-label="sound" onClick={() => { unlockAudio(); toggleSound(); }}>
              {soundOn ? "🔊" : "🔇"}
            </button>
            <button className="btn btn-icon parent-gear" aria-label="parent section" onClick={() => navigate("/parent")}>
              ⚙️
            </button>
          </div>
        </div>
      </section>

      {continueStage && continueWorld && continueAllowed && (
        <button
          className="btn continue-bar"
          onClick={() => {
            unlockAudio();
            sfx.tap();
            navigate(`/play/${continueStage.id}`);
          }}
        >
          ▶ {STR.continueBar}: {continueWorld.icon} {continueStage.name}
          <small>{continueWorld.name}</small>
        </button>
      )}

      <CouponWallet />

      <section>
        <h2 className="section-title">🌌 Worlds</h2>
        <div className="planet-row">
          {WORLDS.map((w) => {
            const wDone = completedInWorld(w, progress);
            const on = Boolean(enabledWorlds[w.id]);
            return (
              <button
                key={w.id}
                className={`planet ${on ? "planet-open" : "planet-locked"} ${focus && w.id === focus.id ? "planet-focus" : ""}`}
                disabled={!on}
                onClick={() => {
                  unlockAudio();
                  sfx.tap();
                  navigate(`/world/${w.id}`);
                }}
              >
                <span className="planet-ball" style={{ "--hue": PLANET_HUES[w.id] } as React.CSSProperties}>
                  <span className="planet-icon">{w.icon}</span>
                </span>
                <span className="planet-name">{w.name}</span>
                <span className={`planet-chip ${!on || wDone === 0 ? "dim-chip" : ""}`}>
                  {on ? `${wDone}/${w.stages.length}` : "🔒"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="hub-bottom">
        {MINIGAMES.map((g) => {
          const on = Boolean(enabledGames[g.id]);
          return (
            <button
              key={g.id}
              className={`tile ${on ? "tile-glow" : "tile-locked"}`}
              disabled={!on}
              onClick={() => {
                unlockAudio();
                sfx.tap();
                navigate(g.route);
              }}
            >
              <span className="tile-icon">{g.icon}</span>
              <span className="tile-name">{g.name}</span>
              <span className="tile-sub">{on ? g.sub : "🔒 Ask Daddy"}</span>
            </button>
          );
        })}
        <button
          className="tile"
          onClick={() => {
            unlockAudio();
            sfx.tap();
            setShopOpen(true);
          }}
        >
          <span className="tile-icon">🛠️</span>
          <span className="tile-name">{STR.workshop}</span>
          <span className="tile-sub">Earn Daddy Rewards! 🎟️</span>
        </button>
        <div className="tile tile-static">
          <span className="tile-icon">🏆</span>
          <span className="tile-name">{STR.trophyShelf}</span>
          {badges.length === 0 ? (
            <span className="tile-sub">{STR.trophyEmpty}</span>
          ) : (
            <span className="tile-trophies">
              {badges.map((b) => (
                <span key={b.badgeId} title={`${b.name} — ${new Date(b.earnedAt).toLocaleDateString()}`}>
                  {b.icon}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>

      {shopOpen && <Workshop onClose={() => setShopOpen(false)} />}
    </div>
  );
}
