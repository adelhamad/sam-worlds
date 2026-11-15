import Dexie, { type EntityTable } from "dexie";
import type { Question } from "../generators/types";

export interface ProfileRow {
  id: number;
  name: string;
  createdAt: number;
  lastSeenAt: number;
  /** Every question actually shown to the child, across levels and replays. */
  seenQuestionKeys?: string[];
}
export interface EconomyRow {
  id: number;
  starDust: number;
  melodyShards: number;
}
export interface ProgressRow {
  stageId: string;
  bestStars: number;
  attempts: number;
  completed: boolean;
}
export interface SessionRow {
  id: number;
  stageId: string;
  seed: number;
  questions: Question[];
  /** Questions already shown, including ones discarded after a miss. */
  seenQuestionKeys?: string[];
  index: number;
  correctCount: number;
  firstTryMisses: number;
  missStreak: number;
  attemptMissed: boolean;
  wrongStamps: number[];
  /** Anti-guessing for choice questions: correct answers still owed to advance. */
  proveLeft?: number;
}
export interface InventoryRow {
  itemId: string;
  purchasedAt: number;
}
export interface BadgeRow {
  badgeId: string;
  name: string;
  icon: string;
  earnedAt: number;
}
export interface SettingsRow {
  id: number;
  soundOn: boolean;
  musicOn?: boolean;
  /** Parent opt-in: timed encouragement notifications. */
  remindersOn?: boolean;
  lastStageId?: string;
  /** Parent-controlled gates; missing keys fall back to defaults. */
  enabledWorlds?: Record<string, boolean>;
  /** Worlds the parent has hidden from the hub entirely (default: all shown). */
  hiddenWorlds?: Record<string, boolean>;
  /** Hub: recently played + starred worlds. */
  recentWorlds?: string[];
  favoriteWorlds?: string[];
  /** Parent-curated YouTube companion. */
  videoEnabled?: boolean;
  videoMode?: "corner" | "background";
  videoUrls?: string[];
  /** Player visibility 20–100 (%). */
  videoOpacity?: number;
  /** Hide the video but keep its audio playing. */
  videoAudioOnly?: boolean;
  /** Player width in px (resizable). */
  videoSize?: number;
  /** Daily Gift + Treasure Vault. */
  gifts?: string[];
  lastGiftDay?: string | null;
  giftStreak?: number;
  giftBestStreak?: number;
  /** Legacy pet fields: no longer read or written; kept so old rows type-check. Do not reuse these names. */
  petName?: string | null;
  petXp?: number;
  petStageIdx?: number;
  petFedAt?: number;
  petBornAt?: number;
  /** World Tour (rides this row too): passport stamps, chests, tour days. */
  tourStamps?: Record<string, number>;
  tourChests?: string[];
  tourDays?: number;
  tourLastDay?: string | null;
  /** Daily quests (rides this row too): today's counters, collected quests, chest, quest days. */
  questDay?: string | null;
  questCounters?: { lessons: number; firstTry: number; combo: number; dust: number; perfect: number };
  questClaimed?: string[];
  questChestDay?: string | null;
  questDaysDone?: number;
  /** Parent Section → Voices: the chosen device voice per language (voiceURI), and a speed (1 = normal). */
  voicePick?: Record<string, string>;
  voiceSpeed?: number;
  /** Parent Section → Voices: "Speaking practice" (the child records himself next to the model; takes are never stored). */
  speakPractice?: boolean;
}
export interface CouponRow {
  id?: number;
  itemId: string;
  purchasedAt: number;
  redeemedAt: number | null;
}
export interface SkillRow {
  skill: string;
  rating: number;
}
/**
 * A parent's own recording of a phrase or a letter name (Parent Section → Voices).
 * Key scheme: src/engine/feedback/clipKeys.ts. Deliberately NOT in the
 * localStorage mirror (too big) and never cleared by a progress reset.
 */
export interface VoiceClipRow {
  key: string;
  lang: string;
  blob: Blob;
  mime: string;
  /** Duration in ms (measured while recording). */
  ms: number;
  at: number;
}
export interface EventRow {
  id?: number;
  t: number;
  type: string;
  data: string;
}

export const db = new Dexie("sams-worlds") as Dexie & {
  profile: EntityTable<ProfileRow, "id">;
  economy: EntityTable<EconomyRow, "id">;
  progress: EntityTable<ProgressRow, "stageId">;
  session: EntityTable<SessionRow, "id">;
  inventory: EntityTable<InventoryRow, "itemId">;
  badges: EntityTable<BadgeRow, "badgeId">;
  settings: EntityTable<SettingsRow, "id">;
  skillRatings: EntityTable<SkillRow, "skill">;
  eventLog: EntityTable<EventRow, "id">;
  coupons: EntityTable<CouponRow, "id">;
  voiceClips: EntityTable<VoiceClipRow, "key">;
};

db.version(1).stores({
  profile: "id",
  economy: "id",
  progress: "stageId",
  session: "id",
  inventory: "itemId",
  badges: "badgeId",
  settings: "id",
  skillRatings: "skill",
  eventLog: "++id, t",
});

// v2: real-world reward coupons (Daddy Rewards)
db.version(2).stores({
  coupons: "++id, itemId",
});

// v3: the parent's recorded voice clips (Parent Section → Voices)
db.version(3).stores({
  voiceClips: "key, lang",
});

import { scheduleBackup } from "./backup";

export function logEvent(type: string, data: unknown): void {
  void db.eventLog.add({ t: Date.now(), type, data: JSON.stringify(data ?? null) });
  // every meaningful event refreshes the localStorage safety snapshot
  scheduleBackup();
}
