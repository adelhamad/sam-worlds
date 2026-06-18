// Cosmo companion state — split out of store.ts (which sits at the line cap).
// Pet fields ride the SettingsRow like minigame records do, so there's NO Dexie
// schema bump and the localStorage backup already mirrors it.
import { logEvent } from "../engine/save/db";
import { persistSettings } from "./settings";
import { mealXp, stageIndexForXp } from "../engine/pet/pet";
import type { GameStore } from "./store";

type Set = (partial: Partial<GameStore>) => void;
type Get = () => GameStore;

export interface PetSlice {
  /** null until the egg is named — naming hatches it. */
  petName: string | null;
  petXp: number;
  /** Last stage index the player has been shown — used to detect a fresh evolution. */
  petStageIdx: number;
  petFedAt: number;
  petBornAt: number;
  /** Transient (not persisted): a stage index awaiting its hub celebration. */
  petEvolvedTo: number | null;

  namePet: (name: string) => void;
  /** Feed the pet for a finished stage. The one place XP is granted in play. */
  feedStage: (correct: number, perfect: boolean, firstTime: boolean) => void;
  acknowledgeEvolve: () => void;
  // Parent controls
  setPetXp: (xp: number) => void;
  resetPet: () => void;
}

export const petInitial = {
  petName: null as string | null,
  petXp: 0, petStageIdx: 0, petFedAt: 0, petBornAt: 0,
  petEvolvedTo: null as number | null,
};

export function petActions(set: Set, get: Get) {
  return {
    namePet: (name: string) => {
      const clean = name.trim().slice(0, 14);
      if (!clean) return;
      const now = Date.now();
      const s = get();
      const reached = stageIndexForXp(s.petXp);
      set({
        petName: clean,
        petBornAt: s.petBornAt || now,
        petFedAt: now,
        petStageIdx: reached,
        petEvolvedTo: reached > 0 ? reached : null,
      });
      persistSettings(get);
      logEvent("pet.name", { name: clean });
    },

    feedStage: (correct: number, perfect: boolean, firstTime: boolean) => {
      const s = get();
      const xp = s.petXp + mealXp(correct, perfect, firstTime);
      const reached = stageIndexForXp(xp);
      const named = s.petName !== null;
      set({
        petXp: xp,
        petFedAt: Date.now(),
        petStageIdx: named ? Math.max(s.petStageIdx, reached) : s.petStageIdx,
        petEvolvedTo: named && reached > s.petStageIdx ? reached : s.petEvolvedTo,
      });
      persistSettings(get);
      logEvent("pet.feed", { xp, reached });
    },

    acknowledgeEvolve: () => set({ petEvolvedTo: null }),

    setPetXp: (xp: number) => {
      const v = Math.max(0, Math.round(xp));
      set({ petXp: v, petStageIdx: stageIndexForXp(v), petEvolvedTo: null });
      persistSettings(get);
      logEvent("parent.setPetXp", { xp: v });
    },

    resetPet: () => {
      set({ ...petInitial });
      persistSettings(get);
      logEvent("parent.resetPet", {});
    },
  };
}
