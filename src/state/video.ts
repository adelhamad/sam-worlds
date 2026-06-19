// Video-companion actions — split out of store.ts to stay under the line cap.
// Persistence rides the settings row (mirrored by the backup snapshot).
import { logEvent } from "../engine/save/db";
import { persistSettings } from "./settings";
import type { GameStore } from "./store";

type Set = (partial: Partial<GameStore>) => void;
type Get = () => GameStore;

export function videoActions(set: Set, get: Get) {
  return {
    setVideoEnabled: (on: boolean) => {
      set({ videoEnabled: on });
      persistSettings(get);
      logEvent("parent.videoEnabled", { on });
    },

    setVideoMode: (mode: "corner" | "background") => {
      set({ videoMode: mode });
      persistSettings(get);
    },

    setVideoOpacity: (pct: number) => {
      set({ videoOpacity: Math.max(20, Math.min(100, Math.round(pct))) });
      persistSettings(get);
    },

    addVideoUrl: (url: string) => {
      const u = url.trim();
      if (!u || get().videoUrls.includes(u)) return;
      set({ videoUrls: [...get().videoUrls, u] });
      persistSettings(get);
    },

    removeVideoUrl: (url: string) => {
      set({ videoUrls: get().videoUrls.filter((u) => u !== url) });
      persistSettings(get);
    },
  };
}
