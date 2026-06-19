// Daddy Rewards coupon actions — split out of store.ts to keep it under the
// line cap. Coupons persist to Dexie (mirrored by the backup snapshot).
import { db, logEvent, type CouponRow } from "../engine/save/db";
import { itemById } from "../engine/economy/catalog";
import type { GameStore } from "./store";

type Set = (partial: Partial<GameStore>) => void;
type Get = () => GameStore;

export function couponActions(set: Set, get: Get) {
  return {
    buyItem: (itemId: string): boolean => {
      const state = get();
      const item = itemById(itemId);
      if (!item || state.starDust < item.cost) return false;
      const starDust = state.starDust - item.cost;
      const row: CouponRow = { itemId, purchasedAt: Date.now(), redeemedAt: null };
      set({ starDust });
      void db.economy.put({ id: 1, starDust, melodyShards: 0 });
      void db.coupons.add(row).then((id) => {
        set({ coupons: [...get().coupons, { ...row, id }] });
      });
      logEvent("shop.coupon", { itemId, cost: item.cost });
      return true;
    },

    redeemCoupon: (couponId: number) => {
      const redeemedAt = Date.now();
      set({ coupons: get().coupons.map((c) => (c.id === couponId ? { ...c, redeemedAt } : c)) });
      void db.coupons.update(couponId, { redeemedAt });
      logEvent("coupon.redeem", { couponId });
    },

    // Parent Section: tidy the rewards history. Only REDEEMED coupons go —
    // anything still in Sam's wallet stays untouched.
    clearRedeemedCoupons: () => {
      const redeemed = get().coupons.filter((c) => c.redeemedAt);
      if (redeemed.length === 0) return;
      set({ coupons: get().coupons.filter((c) => !c.redeemedAt) });
      void db.coupons.bulkDelete(redeemed.map((c) => c.id!));
      logEvent("coupon.clearHistory", { removed: redeemed.length });
    },
  };
}
