import { useState } from "react";
import { useGame } from "../state/store";
import { itemById } from "../engine/economy/catalog";
import { sfx } from "../engine/feedback/audio";
import { persona } from "../persona.config";
import { STR } from "../strings/en";
import type { CouponRow } from "../engine/save/db";

/** Active real-world reward coupons — tap one to show Daddy, then mark it used. */
export function CouponWallet() {
  const coupons = useGame((s) => s.coupons);
  const redeemCoupon = useGame((s) => s.redeemCoupon);
  const [open, setOpen] = useState<CouponRow | null>(null);

  const active = coupons.filter((c) => !c.redeemedAt);
  if (active.length === 0) return null;

  const openItem = open ? itemById(open.itemId) : null;

  return (
    <>
      <section className="panel coupon-wallet">
        <h2>🎟️ {STR.daddyRewards}</h2>
        <div className="coupon-row">
          {active.map((c) => {
            const item = itemById(c.itemId);
            if (!item) return null;
            return (
              <button
                key={c.id}
                className="btn coupon-chip"
                onClick={() => {
                  sfx.earn();
                  setOpen(c);
                }}
              >
                {item.icon} {item.name}
              </button>
            );
          })}
        </div>
      </section>

      {open && openItem && (
        <div className="overlay" onClick={() => setOpen(null)}>
          <div className="panel celebration-card coupon-card" onClick={(e) => e.stopPropagation()}>
            <div className="coupon-big-icon">{openItem.icon}</div>
            <h2>{STR.tellDaddy(openItem.reward ?? openItem.name)}</h2>
            <p className="dim">
              Earned by {persona.name} on {new Date(open.purchasedAt).toLocaleDateString()}
            </p>
            <div className="celebration-actions">
              <button className="btn btn-secondary" onClick={() => setOpen(null)}>
                {STR.later}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  sfx.badge();
                  if (open.id !== undefined) redeemCoupon(open.id);
                  setOpen(null);
                }}
              >
                {STR.daddyOk}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
