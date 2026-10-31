import { logEvent } from '../engine/save/db';
import { persistSettings } from './settings';
import type { GameStore } from './store';

type Set = (partial: Partial<GameStore>) => void;
type Get = () => GameStore;
export function ragdollActions(set: Set, get: Get) {
  return {
    completeRagdollShow: (index: number) => {
      if (!Number.isInteger(index) || index < 0 || index >= 6) return;
      const current = get().ragdollShowsCompleted;
      if (current.includes(index)) return;
      set({ ragdollShowsCompleted: [...current, index].sort((a, b) => a - b) });
      persistSettings(get);
      logEvent('ragdoll.showCompleted', { index });
    },
    resetRagdollShows: () => {
      set({ ragdollShowsCompleted: [] });
      persistSettings(get);
      logEvent('parent.resetRagdollShows', {});
    },
  };
}
