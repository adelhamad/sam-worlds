import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../state/store";
import { nextStageIn, stageById, worldOfStage } from "../content/worlds";
import { sfx, unlockAudio } from "../engine/feedback/audio";
import { STR } from "../strings/en";
import { Workshop } from "./Workshop";
import { CouponWallet } from "./CouponWallet";
import { DailyGiftBanner } from "./DailyGift";
import { PetCompanion } from "./PetCompanion";
import { TreasureVault } from "./TreasureVault";
import { WorldGrid } from "./HubWorlds";
import { VideoToggle } from "./VideoToggle";
import { vaultProgress } from "../engine/economy/gifts";

export function Hub() {
  const navigate = useNavigate();
  const starDust = useGame((s) => s.starDust);
  const progress = useGame((s) => s.progress);
  const badges = useGame((s) => s.badges);
  const soundOn = useGame((s) => s.soundOn);
  const musicOn = useGame((s) => s.musicOn);
  const toggleSound = useGame((s) => s.toggleSound);
  const toggleMusic = useGame((s) => s.toggleMusic);
  const gifts = useGame((s) => s.gifts);
  const [shopOpen, setShopOpen] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const vault = vaultProgress(gifts);

  const enabledWorlds = useGame((s) => s.enabledWorlds);
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
        <div className="galaxy-bg">
          <div className="galaxy-stars" />
          <div className="galaxy-stars galaxy-stars-2" />
        </div>
        <h1 className="hero-title">{STR.gameTitle}</h1>
        <div className="hero-top">
          <span className="dust-counter">✨ {starDust}</span>
          <div className="hub-header-right">
            <VideoToggle />
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

      <PetCompanion />

      <DailyGiftBanner />

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

      <WorldGrid />

      <div className="hub-bottom">
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
        <button
          className="tile tile-glow"
          onClick={() => {
            unlockAudio();
            sfx.tap();
            setVaultOpen(true);
          }}
        >
          <span className="tile-icon">🗝️</span>
          <span className="tile-name">Treasure Vault</span>
          <span className="tile-sub">{vault.owned}/{vault.total} collected ✨</span>
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
      {vaultOpen && <TreasureVault onClose={() => setVaultOpen(false)} />}
    </div>
  );
}
