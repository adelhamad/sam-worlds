// Settings round-trip: one place owns the SettingsRow defaults and writes.
import { db, type SettingsRow } from "../engine/save/db";
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
    videoEnabled: s.videoEnabled,
    videoMode: s.videoMode,
    videoUrls: s.videoUrls,
    videoOpacity: s.videoOpacity,
    gifts: s.gifts,
    lastGiftDay: s.lastGiftDay,
    giftStreak: s.giftStreak,
    giftBestStreak: s.giftBestStreak,
    petName: s.petName,
    petXp: s.petXp,
    petStageIdx: s.petStageIdx,
    petFedAt: s.petFedAt,
    petBornAt: s.petBornAt,
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

/** Cosmo companion defaults (split out to keep each helper under the cap). */
function petSettings(s: SettingsRow | undefined) {
  return {
    petName: s?.petName ?? null,
    petXp: s?.petXp ?? 0,
    petStageIdx: s?.petStageIdx ?? 0,
    petFedAt: s?.petFedAt ?? 0,
    petBornAt: s?.petBornAt ?? 0,
    petEvolvedTo: null as number | null,
  };
}

/** Stored settings row → state slice, with all defaults in one place. */
export function settingsState(settings: SettingsRow | undefined) {
  return {
    ...scalarSettings(settings),
    ...giftSettings(settings),
    ...petSettings(settings),
    enabledWorlds: withWorldDefaults(settings?.enabledWorlds),
    hiddenWorlds: settings?.hiddenWorlds ?? {},
  };
}
