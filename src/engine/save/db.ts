import Dexie, { type EntityTable } from "dexie";
import type { Question } from "../generators/types";

export interface ProfileRow {
  id: number;
  name: string;
  createdAt: number;
  lastSeenAt: number;
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
  lastStageId?: string;
  /** Parent-controlled gates; missing keys fall back to defaults. */
  enabledWorlds?: Record<string, boolean>;
  enabledGames?: Record<string, boolean>;
  /** Parent-curated YouTube companion. */
  videoEnabled?: boolean;
  videoMode?: "corner" | "background";
  videoUrls?: string[];
  /** Player visibility 20–100 (%). */
  videoOpacity?: number;
  /** Minigame records. */
  rushBest?: number;
  surfBest?: number;
  critterBest?: number;
  blasterBest?: number;
  pulseBest?: number;
  rangerBest?: number;
  racerBest?: number;
  /** Critterdex: animal names Sam has correctly identified at least once. */
  critterDex?: string[];
  /** Daily Gift + Treasure Vault. */
  gifts?: string[];
  lastGiftDay?: string | null;
  giftStreak?: number;
  giftBestStreak?: number;
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

import { scheduleBackup } from "./backup";

export function logEvent(type: string, data: unknown): void {
  void db.eventLog.add({ t: Date.now(), type, data: JSON.stringify(data ?? null) });
  // every meaningful event refreshes the localStorage safety snapshot
  scheduleBackup();
}
