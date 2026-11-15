import { useState } from "react";
import { useGame } from "../state/store";
import { CATALOG } from "../engine/economy/catalog";
import { sfx } from "../engine/feedback/audio";
import { STR } from "../strings/en";
import { Glyph, Icon } from "./icons/Icon";

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
          <h2><span><Icon name="tools" size="1.1em" /> {STR.workshop}</span></h2>
          <span className="dust-counter"><Icon name="dust" size="1.1em" /> {starDust}</span>
          <button className="btn btn-icon" aria-label="close" onClick={onClose}>
            <Icon name="close" size={20} mono />
          </button>
        </header>
        {note && <p className="shop-note">{note}</p>}
        <h3 className="shop-section"><Icon name="ticket" size="1.2em" /> {STR.couponSection}</h3>
        <div className="shop-grid">
          {CATALOG.map((item) => {
            const affordable = starDust >= item.cost;
            return (
              <div key={item.id} className="shop-item shop-coupon">
                <span className="shop-icon"><Glyph value={item.icon} size="1em" /></span>
                <span className="shop-name">{item.name}</span>
                <span className="shop-blurb">{item.blurb}</span>
                <button
                  className={`btn ${affordable ? "btn-primary" : "btn-disabled"}`}
                  onClick={() => buy(item.id)}
                >
                  <Icon name="dust" size="1.1em" /> {item.cost}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
