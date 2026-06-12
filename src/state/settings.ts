// Settings round-trip: one place owns the SettingsRow defaults and writes.
import { db, type SettingsRow } from "../engine/save/db";
import { withGameDefaults, withWorldDefaults } from "./gates";
import type { GameStore } from "./store";

export function persistSettings(get: () => GameStore): void {
  const { soundOn, musicOn, lastStageId, enabledWorlds, enabledGames, videoEnabled, videoMode, videoUrls, videoOpacity, rushBest, surfBest } = get();
  void db.settings.put({
    id: 1,
    soundOn,
    musicOn,
    lastStageId: lastStageId ?? undefined,
    enabledWorlds,
    enabledGames,
    videoEnabled,
    videoMode,
    videoUrls,
    videoOpacity,
    rushBest,
    surfBest,
  });
}

/** Stored settings row → state slice, with all defaults in one place. */
export function settingsState(settings: SettingsRow | undefined) {
  return {
    soundOn: settings?.soundOn ?? true,
    musicOn: settings?.musicOn ?? true,
    lastStageId: settings?.lastStageId ?? null,
    enabledWorlds: withWorldDefaults(settings?.enabledWorlds),
    enabledGames: withGameDefaults(settings?.enabledGames),
    videoEnabled: settings?.videoEnabled ?? false,
    videoMode: settings?.videoMode ?? ("corner" as const),
    videoOpacity: settings?.videoOpacity ?? 80,
    rushBest: settings?.rushBest ?? 0,
    surfBest: settings?.surfBest ?? 0,
    videoUrls: settings?.videoUrls ?? [],
  };
}
