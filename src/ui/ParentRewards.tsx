// Parent Section reward blocks, split out of ParentSection.tsx to keep it under
// the file-size cap: the Daily Gift / Treasure summary and the Daddy Rewards
// purchase history (CLAUDE.md rule 2 — every persisted feature has controls).
import { useState } from "react";
import { useGame } from "../state/store";
import { itemById } from "../engine/economy/catalog";
import { vaultProgress } from "../engine/economy/gifts";

/** Daily Gift streak + Treasure Vault — view & reset. */
export function GiftControls() {
  const gifts = useGame((s) => s.gifts);
  const giftStreak = useGame((s) => s.giftStreak);
  const giftBestStreak = useGame((s) => s.giftBestStreak);
  const lastGiftDay = useGame((s) => s.lastGiftDay);
  const resetGifts = useGame((s) => s.resetGifts);
  const [confirm, setConfirm] = useState(false);
  const vault = vaultProgress(gifts);

  return (
    <section className="panel parent-block">
      <h2>🎁 Daily Gift &amp; Treasures</h2>
      <p className="dim">
        A chest each day pays Star Dust + a new collectible. Current streak: <b>{giftStreak}</b> day(s) ·
        best: <b>{giftBestStreak}</b> · last opened: {lastGiftDay ?? "never"}.
      </p>
      <p className="dim">
        Treasure Vault: <b>{vault.owned}/{vault.total}</b> collected.
      </p>
      {confirm ? (
        <div className="parent-row">
          <button className="btn btn-secondary" onClick={() => setConfirm(false)}>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              resetGifts();
              setConfirm(false);
            }}
          >
            Yes, clear treasures &amp; streak
          </button>
        </div>
      ) : (
        <button className="btn btn-secondary" onClick={() => setConfirm(true)}>
          Reset gifts &amp; streak
        </button>
      )}
    </section>
  );
}

function fmt(t: number): string {
  return new Date(t).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Every Daddy Reward ever bought: what, when bought, when redeemed. */
export function RewardHistory() {
  const coupons = useGame((s) => s.coupons);
  const clearRedeemed = useGame((s) => s.clearRedeemedCoupons);
  const [confirmClear, setConfirmClear] = useState(false);
  const rows = [...coupons].sort(
    (a, b) => (b.redeemedAt ?? b.purchasedAt) - (a.redeemedAt ?? a.purchasedAt),
  );
  const redeemedCount = rows.filter((c) => c.redeemedAt).length;

  return (
    <section className="panel parent-block">
      <h2>🎟️ Daddy Rewards history</h2>
      <p className="dim">
        {rows.length === 0
          ? "No rewards bought yet."
          : `${rows.length} bought · ${redeemedCount} redeemed · ${rows.length - redeemedCount} still in the wallet.`}
      </p>
      {redeemedCount > 0 && (
        <div className="parent-row">
          {confirmClear ? (
            <>
              <button className="btn btn-secondary" onClick={() => setConfirmClear(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  clearRedeemed();
                  setConfirmClear(false);
                }}
              >
                Yes, remove {redeemedCount} redeemed
              </button>
            </>
          ) : (
            <button className="btn btn-secondary" onClick={() => setConfirmClear(true)}>
              🧹 Clean history (keeps wallet)
            </button>
          )}
        </div>
      )}
      {rows.map((c) => {
        const item = itemById(c.itemId);
        return (
          <div key={c.id} className="parent-row parent-history-row">
            <span className="parent-world-name">
              {item?.icon ?? "🎟️"} {item?.name ?? c.itemId}
            </span>
            {c.redeemedAt ? (
              <span className="history-redeemed">✓ Redeemed {fmt(c.redeemedAt)}</span>
            ) : (
              <span className="dim">In wallet — bought {fmt(c.purchasedAt)}</span>
            )}
          </div>
        );
      })}
    </section>
  );
}
