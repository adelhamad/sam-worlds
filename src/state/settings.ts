// Settings round-trip: one place owns the SettingsRow defaults and writes.
import { db, type SettingsRow } from "../engine/save/db";
import { NO_COUNTERS } from "../engine/quests/daily";
import { withWorldDefaults } from "./gates";
import type { GameStore } from "./store";

export function persistSettings(get: () => GameStore): void {
  const s = get();
  void db.settings.put({
    id: 1,
    soundOn: s.soundOn,
    musicOn: s.musicOn,
    remindersOn: s.remindersOn,
    lastStageId: s.lastStageId ?? undefined,
    enabledWorlds: s.enabledWorlds,
    hiddenWorlds: s.hiddenWorlds,
    recentWorlds: s.recentWorlds,
    favoriteWorlds: s.favoriteWorlds,
    videoEnabled: s.videoEnabled,
    videoMode: s.videoMode,
    videoUrls: s.videoUrls,
    videoOpacity: s.videoOpacity,
    videoAudioOnly: s.videoAudioOnly,
    videoSize: s.videoSize,
    gifts: s.gifts,
    lastGiftDay: s.lastGiftDay,
    giftStreak: s.giftStreak,
    giftBestStreak: s.giftBestStreak,
    tourStamps: s.tourStamps,
    tourChests: s.tourChests,
    tourDays: s.tourDays,
    tourLastDay: s.tourLastDay,
    questDay: s.questDay,
    questCounters: s.questCounters,
    questClaimed: s.questClaimed,
    questChestDay: s.questChestDay,
    questDaysDone: s.questDaysDone,
    voicePick: s.voicePick,
    voiceSpeed: s.voiceSpeed,
  });
}

/** Scalar settings + video (split out to keep each function under the
 * complexity cap — long `??` default chains add up fast). */
function scalarSettings(s: SettingsRow | undefined) {
  return {
    soundOn: s?.soundOn ?? true,
    musicOn: s?.musicOn ?? true,
    remindersOn: s?.remindersOn ?? false,
    lastStageId: s?.lastStageId ?? null,
    videoEnabled: s?.videoEnabled ?? false,
    videoMode: s?.videoMode ?? ("corner" as const),
    videoOpacity: s?.videoOpacity ?? 80,
    videoUrls: s?.videoUrls ?? [],
    videoAudioOnly: s?.videoAudioOnly ?? false,
    videoSize: s?.videoSize ?? 280,
  };
}

/** Daily Gift + Treasure Vault state defaults. */
function giftSettings(s: SettingsRow | undefined) {
  return {
    gifts: s?.gifts ?? [],
    lastGiftDay: s?.lastGiftDay ?? null,
    giftStreak: s?.giftStreak ?? 0,
    giftBestStreak: s?.giftBestStreak ?? 0,
  };
}

/** World Tour defaults: passport stamps, opened chests, tour days. */
function tourSettings(s: SettingsRow | undefined) {
  return {
    tourStamps: s?.tourStamps ?? {},
    tourChests: s?.tourChests ?? [],
    tourDays: s?.tourDays ?? 0,
    tourLastDay: s?.tourLastDay ?? null,
  };
}

/** Daily quests defaults. */
function questSettings(s: SettingsRow | undefined) {
  return {
    questDay: s?.questDay ?? null,
    questCounters: s?.questCounters ?? NO_COUNTERS,
    questClaimed: s?.questClaimed ?? [],
    questChestDay: s?.questChestDay ?? null,
    questDaysDone: s?.questDaysDone ?? 0,
  };
}

/** Parent Section → Voices: chosen device voice per language and speed. */
function voiceSettings(s: SettingsRow | undefined) {
  return {
    voicePick: s?.voicePick ?? {},
    voiceSpeed: s?.voiceSpeed ?? 1,
  };
}

/** Stored settings row → state slice, with all defaults in one place. */
export function settingsState(settings: SettingsRow | undefined) {
  return {
    ...scalarSettings(settings),
    ...giftSettings(settings),
    ...tourSettings(settings),
    ...questSettings(settings),
    ...voiceSettings(settings),
    enabledWorlds: withWorldDefaults(settings?.enabledWorlds),
    hiddenWorlds: settings?.hiddenWorlds ?? {},
    recentWorlds: settings?.recentWorlds ?? [],
    favoriteWorlds: settings?.favoriteWorlds ?? [],
  };
}
