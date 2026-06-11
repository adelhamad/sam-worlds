import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../state/store";
import { completedInWorld, focusWorld, nextStageIn, stageById, WORLDS, worldOfStage } from "../content/worlds";
import { activeBeat } from "../engine/missions/missions";
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

  const focus = focusWorld(progress);
  const beat = activeBeat(focus.id, completedInWorld(focus, progress));
  const nextStage = nextStageIn(focus, progress);

  // Continue where he left off: the in-progress session, or the next stage
  // in the last world he played.
  const lastStageId = useGame((s) => s.lastStageId);
  const session = useGame((s) => s.session);
  const lastWorld = lastStageId ? worldOfStage(lastStageId) : undefined;
  let continueStage = null;
  if (session && !session.result) continueStage = stageById(session.stageId);
  else if (lastWorld) continueStage = nextStageIn(lastWorld, progress);
  const continueWorld = continueStage ? worldOfStage(continueStage.id) : undefined;

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
          </div>
        </div>
        <div className="hero-mission">
          <p className="mission-tease">“{beat.tease}”</p>
          <button
            className="btn btn-primary btn-go"
            onClick={() => {
              unlockAudio();
              sfx.tap();
              navigate(`/play/${nextStage.id}`);
            }}
          >
            ▶ {STR.goBtn}
            <small>{nextStage.name}</small>
          </button>
        </div>
      </section>

      {continueStage && continueWorld && (
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
            return (
              <button
                key={w.id}
                className={`planet planet-open ${w.id === focus.id ? "planet-focus" : ""}`}
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
                <span className={`planet-chip ${wDone === 0 ? "dim-chip" : ""}`}>
                  {wDone}/{w.stages.length}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="hub-bottom">
        <button
          className="tile tile-glow"
          onClick={() => {
            unlockAudio();
            sfx.tap();
            navigate("/catch");
          }}
        >
          <span className="tile-icon">🌠</span>
          <span className="tile-name">Comet Catch</span>
          <span className="tile-sub">Tilt to fly!</span>
        </button>
        <button
          className="tile tile-glow"
          onClick={() => {
            unlockAudio();
            sfx.tap();
            navigate("/code");
          }}
        >
          <span className="tile-icon">🔮</span>
          <span className="tile-name">Code Quest</span>
          <span className="tile-sub">Crack the secret code!</span>
        </button>
        <button
          className="tile tile-glow"
          onClick={() => {
            unlockAudio();
            sfx.tap();
            navigate("/maze");
          }}
        >
          <span className="tile-icon">🌀</span>
          <span className="tile-name">Marble Maze</span>
          <span className="tile-sub">Tilt and roll!</span>
        </button>
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
