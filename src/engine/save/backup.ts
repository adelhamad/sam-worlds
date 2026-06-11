// Second line of defense for Sam's progress. IndexedDB already survives
// deploys and restarts (it's origin-scoped), but browsers CAN evict it under
// storage pressure. So:
//  1. We ask for persistent storage (navigator.storage.persist).
//  2. Every meaningful event also snapshots the whole save into localStorage;
//     if IndexedDB ever comes up empty while a snapshot exists, we restore it.
import { db } from "./db";

const KEY = "sams-worlds-backup-v1";

interface BackupBlob {
  savedAt: number;
  profile: unknown[];
  economy: unknown[];
  progress: unknown[];
  inventory: unknown[];
  badges: unknown[];
  settings: unknown[];
  skillRatings: unknown[];
  coupons: unknown[];
}

let timer: ReturnType<typeof setTimeout> | null = null;

/** Debounced snapshot of all save tables into localStorage. */
export function scheduleBackup(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    void writeBackup();
  }, 2000);
}

async function writeBackup(): Promise<void> {
  try {
    const blob: BackupBlob = {
      savedAt: Date.now(),
      profile: await db.profile.toArray(),
      economy: await db.economy.toArray(),
      progress: await db.progress.toArray(),
      inventory: await db.inventory.toArray(),
      badges: await db.badges.toArray(),
      settings: await db.settings.toArray(),
      skillRatings: await db.skillRatings.toArray(),
      coupons: await db.coupons.toArray(),
    };
    localStorage.setItem(KEY, JSON.stringify(blob));
  } catch {
    // storage full or unavailable — IndexedDB remains the primary store
  }
}

/** If IndexedDB lost the save but a snapshot exists, put it back. */
export async function restoreBackupIfNeeded(): Promise<boolean> {
  try {
    const existing = await db.profile.get(1);
    if (existing) return false;
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const blob = JSON.parse(raw) as BackupBlob;
    if (!blob.profile?.length) return false;
    await Promise.all([
      db.profile.bulkPut(blob.profile as never[]),
      db.economy.bulkPut(blob.economy as never[]),
      db.progress.bulkPut(blob.progress as never[]),
      db.inventory.bulkPut(blob.inventory as never[]),
      db.badges.bulkPut(blob.badges as never[]),
      db.settings.bulkPut(blob.settings as never[]),
      db.skillRatings.bulkPut(blob.skillRatings as never[]),
      db.coupons.bulkPut(blob.coupons as never[]),
    ]);
    return true;
  } catch {
    return false;
  }
}

export function clearBackup(): void {
  localStorage.removeItem(KEY);
}

/** Ask the browser to never auto-evict our storage. */
export function requestPersistentStorage(): void {
  void navigator.storage?.persist?.();
}
