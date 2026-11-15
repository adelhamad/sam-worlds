// "Sam's things" — ownership: trophies, the treasure vault, the workshop and
// any Daddy Reward coupons waiting to be shown.
import { sfx, unlockAudio } from "../../engine/feedback/audio";
import { vaultProgress } from "../../engine/economy/gifts";
import { useGame } from "../../state/store";
import { HOME } from "../../strings/home";
import { CouponWallet } from "../CouponWallet";
import { TrophyShelf } from "../TrophyShelf";
import { Icon } from "../icons/Icon";

const T = HOME.home;

export function MyThings({ onOpen }: { onOpen: (panel: "vault" | "shop") => void }) {
  const gifts = useGame((s) => s.gifts);
  const vault = vaultProgress(gifts);
  const tap = (panel: "vault" | "shop") => {
    unlockAudio();
    sfx.tap();
    onOpen(panel);
  };
  return (
    <section className="home-things home-rise" style={{ "--i": 9 } as React.CSSProperties} aria-labelledby="home-things-title">
      <header className="home-sec-head">
        <h2 id="home-things-title" className="home-h2"><Icon name="backpack" size="1.1em" /> {T.things}</h2>
      </header>
      <div className="home-things-row">
        <TrophyShelf />
        <button type="button" className="tile home-thing is-vault" onClick={() => tap("vault")}>
          <span className="tile-icon" aria-hidden="true"><Icon name="key" size="1em" /></span>
          <span className="tile-name">{T.vault}</span>
          <span className="tile-sub">{T.vaultSub(vault.owned, vault.total)}</span>
        </button>
        <button type="button" className="tile home-thing is-shop" onClick={() => tap("shop")}>
          <span className="tile-icon" aria-hidden="true"><Icon name="tools" size="1em" /></span>
          <span className="tile-name">{T.workshop}</span>
          <span className="tile-sub">{T.workshopSub} <Icon name="ticket" size="1.2em" /></span>
        </button>
      </div>
      <div className="home-coupons"><CouponWallet /></div>
    </section>
  );
}
