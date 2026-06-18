// Daily Gift + Treasure Vault actions — split out of store.ts to keep it under
// the file-size cap. Persistence rides the settings row (mirrored by backup).
import { db, logEvent } from "../engine/save/db";
import { computeDailyGift, giftReady, todayKey, type DailyGift } from "../engine/economy/gifts";
import { persistSettings } from "./settings";
import type { GameStore } from "./store";

type Set = (partial: Partial<GameStore>) => void;
type Get = () => GameStore;

export function giftActions(set: Set, get: Get) {
  return {
    /** Open today's chest. Returns the reward for the reveal UI, or null if
     * already opened today. Pays Star Dust + a new Treasure deterministically. */
    claimDailyGift: (): DailyGift | null => {
      const s = get();
      const today = todayKey();
      if (!giftReady(s.lastGiftDay, today)) return null;
      const gift = computeDailyGift({ lastGiftDay: s.lastGiftDay, streak: s.giftStreak, ownedIds: s.gifts });
      const gifts = gift.treasureId ? [...s.gifts, gift.treasureId] : s.gifts;
      const starDust = s.starDust + gift.dust;
      const giftBestStreak = Math.max(s.giftBestStreak, gift.newStreak);
      set({ gifts, starDust, lastGiftDay: today, giftStreak: gift.newStreak, giftBestStreak, hasSave: true });
      void db.economy.put({ id: 1, starDust, melodyShards: 0 });
      persistSettings(get);
      logEvent("gift.claim", { dust: gift.dust, treasure: gift.treasureId, streak: gift.newStreak });
      return gift;
    },

    /** Parent control: wipe the vault + streak (CLAUDE.md rule 2). */
    resetGifts: () => {
      set({ gifts: [], lastGiftDay: null, giftStreak: 0, giftBestStreak: 0 });
      persistSettings(get);
      logEvent("parent.giftsReset", {});
    },
  };
}
