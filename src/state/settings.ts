// Settings round-trip: one place owns the SettingsRow defaults and writes.
import { db, type SettingsRow } from "../engine/save/db";
import { withGameDefaults, withWorldDefaults } from "./gates";
import type { GameStore } from "./store";

export function persistSettings(get: () => GameStore): void {
  const s = get();
  void db.settings.put({
    id: 1,
    soundOn: s.soundOn,
    musicOn: s.musicOn,
    lastStageId: s.lastStageId ?? undefined,
    enabledWorlds: s.enabledWorlds,
    enabledGames: s.enabledGames,
    videoEnabled: s.videoEnabled,
    videoMode: s.videoMode,
    videoUrls: s.videoUrls,
    videoOpacity: s.videoOpacity,
    rushBest: s.rushBest,
    surfBest: s.surfBest,
    critterBest: s.critterBest,
    blasterBest: s.blasterBest,
    pulseBest: s.pulseBest,
    rangerBest: s.rangerBest,
    racerBest: s.racerBest,
    critterDex: s.critterDex,
    gifts: s.gifts,
    lastGiftDay: s.lastGiftDay,
    giftStreak: s.giftStreak,
    giftBestStreak: s.giftBestStreak,
  });
}

/** Scalar settings + video (split out to keep each function under the
 * complexity cap — long `??` default chains add up fast). */
function scalarSettings(s: SettingsRow | undefined) {
  return {
    soundOn: s?.soundOn ?? true,
    musicOn: s?.musicOn ?? true,
    lastStageId: s?.lastStageId ?? null,
    videoEnabled: s?.videoEnabled ?? false,
    videoMode: s?.videoMode ?? ("corner" as const),
    videoOpacity: s?.videoOpacity ?? 80,
    videoUrls: s?.videoUrls ?? [],
  };
}

/** Minigame records + Daily Gift state defaults. */
function recordSettings(s: SettingsRow | undefined) {
  return {
    rushBest: s?.rushBest ?? 0,
    surfBest: s?.surfBest ?? 0,
    critterBest: s?.critterBest ?? 0,
    blasterBest: s?.blasterBest ?? 0,
    pulseBest: s?.pulseBest ?? 0,
    rangerBest: s?.rangerBest ?? 0,
    racerBest: s?.racerBest ?? 0,
    critterDex: s?.critterDex ?? [],
    gifts: s?.gifts ?? [],
    lastGiftDay: s?.lastGiftDay ?? null,
    giftStreak: s?.giftStreak ?? 0,
    giftBestStreak: s?.giftBestStreak ?? 0,
  };
}

/** Stored settings row → state slice, with all defaults in one place. */
export function settingsState(settings: SettingsRow | undefined) {
  return {
    ...scalarSettings(settings),
    ...recordSettings(settings),
    enabledWorlds: withWorldDefaults(settings?.enabledWorlds),
    enabledGames: withGameDefaults(settings?.enabledGames),
  };
}
