// Minigame record actions (best scores + Critterdex), split out of the main
// store to keep store.ts under the file-size cap. Same set/get they'd have
// inline; persistence rides the settings row (covered by the backup mirror).
import { logEvent } from "../engine/save/db";
import { persistSettings } from "./settings";
import type { GameStore } from "./store";

type Set = (partial: Partial<GameStore>) => void;
type Get = () => GameStore;

export function recordActions(set: Set, get: Get) {
  return {
    reportRushScore: (score: number) => {
      logEvent("rush.run", { score });
      if (score <= get().rushBest) return;
      set({ rushBest: score });
      persistSettings(get);
    },

    resetRushBest: () => {
      set({ rushBest: 0 });
      persistSettings(get);
      logEvent("parent.rushReset", {});
    },

    reportSurfScore: (score: number) => {
      logEvent("surf.run", { score });
      if (score <= get().surfBest) return;
      set({ surfBest: score });
      persistSettings(get);
    },

    resetSurfBest: () => {
      set({ surfBest: 0 });
      persistSettings(get);
      logEvent("parent.surfReset", {});
    },

    reportCritterScore: (score: number) => {
      logEvent("critter.run", { score });
      if (score <= get().critterBest) return;
      set({ critterBest: score });
      persistSettings(get);
    },

    addCritterDex: (names: string[]) => {
      const have = new Set(get().critterDex);
      const fresh = names.filter((n) => !have.has(n));
      if (fresh.length === 0) return;
      set({ critterDex: [...get().critterDex, ...fresh] });
      persistSettings(get);
      logEvent("critter.discover", { names: fresh });
    },

    resetCritter: () => {
      set({ critterBest: 0, critterDex: [] });
      persistSettings(get);
      logEvent("parent.critterReset", {});
    },

    reportBlasterScore: (score: number) => {
      logEvent("blaster.run", { score });
      if (score <= get().blasterBest) return;
      set({ blasterBest: score });
      persistSettings(get);
    },

    resetBlasterBest: () => {
      set({ blasterBest: 0 });
      persistSettings(get);
      logEvent("parent.blasterReset", {});
    },

    reportPulseScore: (score: number) => {
      logEvent("pulse.run", { score });
      if (score <= get().pulseBest) return;
      set({ pulseBest: score });
      persistSettings(get);
    },

    resetPulseBest: () => {
      set({ pulseBest: 0 });
      persistSettings(get);
      logEvent("parent.pulseReset", {});
    },
  };
}
