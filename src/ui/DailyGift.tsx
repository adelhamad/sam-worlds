import { useState } from "react";
import { useGame } from "../state/store";
import { giftReady, treasureById, type DailyGift as Gift } from "../engine/economy/gifts";
import { sfx, unlockAudio } from "../engine/feedback/audio";

/** The "open me every day" chest. Shows a pulsing banner when today's gift is
 * unopened, then a reveal modal paying Star Dust + a new Treasure. */
export function DailyGiftBanner() {
  const lastGiftDay = useGame((s) => s.lastGiftDay);
  const giftStreak = useGame((s) => s.giftStreak);
  const claim = useGame((s) => s.claimDailyGift);
  const [reveal, setReveal] = useState<Gift | null>(null);

  const ready = giftReady(lastGiftDay);

  function open() {
    unlockAudio();
    const gift = claim();
    if (!gift) return;
    if (gift.milestone) sfx.badge();
    else sfx.earn();
    setReveal(gift);
  }

  return (
    <>
      {ready && (
        <button className="btn daily-gift-banner" onClick={open}>
          <span className="dg-chest">🎁</span>
          <span className="dg-text">
            <b>Daily Gift is ready!</b>
            <small>{giftStreak > 0 ? `🔥 ${giftStreak}-day streak — tap to open` : "Tap to open your chest"}</small>
          </span>
          <span className="dg-spark">✨</span>
        </button>
      )}
      {reveal && <GiftReveal gift={reveal} onClose={() => setReveal(null)} />}
    </>
  );
}

function GiftReveal({ gift, onClose }: { gift: Gift; onClose: () => void }) {
  const treasure = gift.treasureId ? treasureById(gift.treasureId) : null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel celebration-card daily-gift-card" onClick={(e) => e.stopPropagation()}>
        <h2>{gift.milestone ? "🎉 Streak Bonus!" : "🎁 Daily Gift!"}</h2>
        <div className="dg-open-chest">🎁</div>
        <div className="payout">+{gift.dust} ✨</div>
        {treasure ? (
          <div className={`dg-treasure rarity-${treasure.rarity}`}>
            <span className="dg-treasure-icon">{treasure.icon}</span>
            <span className="dg-treasure-name">New treasure: {treasure.name}!</span>
            <span className="dg-treasure-rarity">{treasure.rarity}</span>
          </div>
        ) : (
          <p className="catch-howto dim">Your vault is complete — extra Star Dust instead! 🌟</p>
        )}
        <p className="catch-howto">🔥 {gift.newStreak}-day streak — come back tomorrow!</p>
        <button className="btn btn-primary btn-big" onClick={onClose}>
          Collect!
        </button>
      </div>
    </div>
  );
}
