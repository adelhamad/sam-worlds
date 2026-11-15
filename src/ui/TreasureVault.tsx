import { useGame } from "../state/store";
import { Glyph, Icon } from "./icons/Icon";
import { RARITY_ORDER, TREASURES, vaultProgress, type Rarity } from "../engine/economy/gifts";

const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

/** The collection Sam fills — owned treasures shine, locked ones tease. */
export function TreasureVault({ onClose }: { onClose: () => void }) {
  const gifts = useGame((s) => s.gifts);
  const owned = new Set(gifts);
  const { owned: count, total } = vaultProgress(gifts);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="panel shop vault" onClick={(e) => e.stopPropagation()}>
        <header className="shop-header">
          <h2><span><Icon name="key" size="1.1em" /> Treasure Vault</span></h2>
          <span className="dust-counter">{count}/{total}</span>
          <button className="btn btn-icon" aria-label="close" onClick={onClose}>
            <Icon name="close" size={20} mono />
          </button>
        </header>
        <p className="shop-note">Open the Daily Gift and clear stages to collect them all!</p>
        {RARITY_ORDER.map((rarity) => {
          const group = TREASURES.filter((t) => t.rarity === rarity);
          return (
            <div key={rarity} className="vault-group">
              <h3 className={`shop-section rarity-text-${rarity}`}>{RARITY_LABEL[rarity]}</h3>
              <div className="vault-grid">
                {group.map((t) => {
                  const have = owned.has(t.id);
                  const cellClass = have ? `rarity-${rarity}` : "vault-locked";
                  return (
                    <div key={t.id} className={`vault-cell ${cellClass}`}>
                      <span className="vault-icon">{have ? <Glyph value={t.icon} size="1em" /> : <Icon name="question" size="1em" />}</span>
                      <span className="vault-name">{have ? t.name : "???"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
