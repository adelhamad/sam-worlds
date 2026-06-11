import { useState } from "react";
import { useGame } from "../state/store";
import { CATALOG } from "../engine/economy/catalog";
import { sfx } from "../engine/feedback/audio";
import { STR } from "../strings/en";

export function Workshop({ onClose }: { onClose: () => void }) {
  const starDust = useGame((s) => s.starDust);
  const buyItem = useGame((s) => s.buyItem);
  const [note, setNote] = useState<string | null>(null);

  function buy(id: string) {
    if (buyItem(id)) {
      sfx.earn();
      setNote(null);
    } else {
      sfx.wrong();
      setNote(STR.notEnough);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel shop" onClick={(e) => e.stopPropagation()}>
        <header className="shop-header">
          <h2>🛠️ {STR.workshop}</h2>
          <span className="dust-counter">✨ {starDust}</span>
          <button className="btn btn-icon" aria-label="close" onClick={onClose}>
            ✕
          </button>
        </header>
        {note && <p className="shop-note">{note}</p>}
        <h3 className="shop-section">🎟️ {STR.couponSection}</h3>
        <div className="shop-grid">
          {CATALOG.map((item) => {
            const affordable = starDust >= item.cost;
            return (
              <div key={item.id} className="shop-item shop-coupon">
                <span className="shop-icon">{item.icon}</span>
                <span className="shop-name">{item.name}</span>
                <span className="shop-blurb">{item.blurb}</span>
                <button
                  className={`btn ${affordable ? "btn-primary" : "btn-disabled"}`}
                  onClick={() => buy(item.id)}
                >
                  ✨ {item.cost}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
