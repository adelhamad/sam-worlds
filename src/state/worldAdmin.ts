// Parent world-admin actions + hub favorites — split out of store.ts to keep it
// under the line cap. Persistence rides Dexie / the settings row (backup-mirrored).
import { db, logEvent, type ProgressRow } from "../engine/save/db";
import { worldById } from "../content/worlds";
import { persistSettings } from "./settings";
import type { GameStore } from "./store";

type Set = (partial: Partial<GameStore>) => void;
type Get = () => GameStore;

export function worldAdminActions(set: Set, get: Get) {
  return {
    setStarDust: (amount: number) => {
      const starDust = Math.max(0, Math.round(amount));
      set({ starDust });
      void db.economy.put({ id: 1, starDust, melodyShards: 0 });
      logEvent("parent.setDust", { starDust });
    },

    setWorldProgress: (worldId: string, completedCount: number) => {
      const world = worldById(worldId);
      if (!world) return;
      const n = Math.max(0, Math.min(world.stages.length, Math.round(completedCount)));
      const progress = { ...get().progress };
      const puts: ProgressRow[] = [];
      const deletes: string[] = [];
      world.stages.forEach((stage, i) => {
        if (i < n) {
          const row: ProgressRow = progress[stage.id]?.completed
            ? progress[stage.id]
            : { stageId: stage.id, bestStars: 1, attempts: 1, completed: true };
          progress[stage.id] = row;
          puts.push(row);
        } else if (progress[stage.id]) {
          delete progress[stage.id];
          deletes.push(stage.id);
        }
      });
      void db.progress.bulkPut(puts);
      void db.progress.bulkDelete(deletes);
      const s = get().session;
      if (s && deletes.includes(s.stageId)) {
        set({ session: null });
        void db.session.delete(1);
      }
      set({ progress });
      logEvent("parent.setWorldProgress", { worldId, completedCount: n });
    },

    setWorldEnabled: (worldId: string, on: boolean) => {
      set({ enabledWorlds: { ...get().enabledWorlds, [worldId]: on } });
      persistSettings(get);
      logEvent("parent.worldGate", { worldId, on });
    },

    setWorldHidden: (worldId: string, hidden: boolean) => {
      set({ hiddenWorlds: { ...get().hiddenWorlds, [worldId]: hidden } });
      persistSettings(get);
      logEvent("parent.worldHidden", { worldId, hidden });
    },

    showAllWorlds: () => {
      set({ hiddenWorlds: {} });
      persistSettings(get);
      logEvent("parent.showAllWorlds", {});
    },

    /** Star/unstar a world to pin it to the hub's Favorites row. */
    toggleFavorite: (worldId: string) => {
      const fav = get().favoriteWorlds;
      const has = fav.includes(worldId);
      set({ favoriteWorlds: has ? fav.filter((w) => w !== worldId) : [worldId, ...fav] });
      persistSettings(get);
      logEvent("hub.favorite", { worldId, on: !has });
    },

    /** Drag-and-drop reorder of the Favorites row. */
    setFavoriteOrder: (ids: string[]) => {
      set({ favoriteWorlds: ids });
      persistSettings(get);
      logEvent("hub.favReorder", {});
    },
  };
}
