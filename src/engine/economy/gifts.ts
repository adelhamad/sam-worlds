// Daily Gift + Treasure Vault — the "open it every day" hook.
// A chest each calendar day pays escalating Star Dust and (while any remain) a
// brand-new collectible Treasure. Treasures are cosmetic, permanent, and
// visible in the hub — ownership, not slot-machine (plan §1.3, §1.7). The roll
// is deterministic from the day + streak so it's effort→reward, not gambling.
import { mulberry32 } from "../rng";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface Treasure {
  id: string;
  icon: string;
  name: string;
  rarity: Rarity;
}

/** The collection Sam fills up — a treasure a day keeps him coming back. */
export const TREASURES: Treasure[] = [
  // common — friendly space + nature finds
  { id: "moon-rock", icon: "🪨", name: "Moon Rock", rarity: "common" },
  { id: "stardust-vial", icon: "🧪", name: "Stardust Vial", rarity: "common" },
  { id: "comet-ice", icon: "🧊", name: "Comet Ice", rarity: "common" },
  { id: "glow-shell", icon: "🐚", name: "Glow Shell", rarity: "common" },
  { id: "copper-gear", icon: "⚙️", name: "Copper Gear", rarity: "common" },
  { id: "spark-bulb", icon: "💡", name: "Spark Bulb", rarity: "common" },
  { id: "music-leaf", icon: "🍃", name: "Music Leaf", rarity: "common" },
  { id: "star-seed", icon: "🌱", name: "Star Seed", rarity: "common" },
  { id: "blue-marble", icon: "🔵", name: "Blue Marble", rarity: "common" },
  { id: "tiny-bell", icon: "🔔", name: "Tiny Bell", rarity: "common" },
  { id: "paper-rocket", icon: "🚀", name: "Paper Rocket", rarity: "common" },
  { id: "lucky-clover", icon: "🍀", name: "Lucky Clover", rarity: "common" },
  // rare — gems + creatures
  { id: "amber-bug", icon: "🐞", name: "Amber Beetle", rarity: "rare" },
  { id: "crystal-cluster", icon: "🔮", name: "Crystal Orb", rarity: "rare" },
  { id: "fire-opal", icon: "🟠", name: "Fire Opal", rarity: "rare" },
  { id: "frost-flower", icon: "❄️", name: "Frost Flower", rarity: "rare" },
  { id: "robo-pet", icon: "🤖", name: "Pocket Bot", rarity: "rare" },
  { id: "owl-friend", icon: "🦉", name: "Wise Owl", rarity: "rare" },
  { id: "lantern-fish", icon: "🐡", name: "Lantern Fish", rarity: "rare" },
  { id: "thunder-shard", icon: "⚡", name: "Thunder Shard", rarity: "rare" },
  { id: "honey-amulet", icon: "🍯", name: "Honey Amulet", rarity: "rare" },
  { id: "moth-wing", icon: "🦋", name: "Aurora Wing", rarity: "rare" },
  // epic — wonders
  { id: "tiny-galaxy", icon: "🌌", name: "Pocket Galaxy", rarity: "epic" },
  { id: "saturn-ring", icon: "🪐", name: "Ringed World", rarity: "epic" },
  { id: "phoenix-egg", icon: "🥚", name: "Phoenix Egg", rarity: "epic" },
  { id: "rainbow-prism", icon: "🌈", name: "Rainbow Prism", rarity: "epic" },
  { id: "ancient-scroll", icon: "📜", name: "Star Map Scroll", rarity: "epic" },
  { id: "volcano-heart", icon: "🌋", name: "Volcano Heart", rarity: "epic" },
  { id: "crystal-dragon", icon: "🐉", name: "Crystal Dragon", rarity: "epic" },
  { id: "north-star", icon: "🌟", name: "North Star", rarity: "epic" },
  // legendary — the chase pieces
  { id: "golden-key", icon: "🗝️", name: "Golden Key", rarity: "legendary" },
  { id: "infinity-gem", icon: "💎", name: "Infinity Gem", rarity: "legendary" },
  { id: "sun-crown", icon: "👑", name: "Crown of Suns", rarity: "legendary" },
  { id: "cosmic-trophy", icon: "🏆", name: "Cosmic Trophy", rarity: "legendary" },
  { id: "time-hourglass", icon: "⏳", name: "Eternal Hourglass", rarity: "legendary" },
  { id: "unicorn-friend", icon: "🦄", name: "Star Unicorn", rarity: "legendary" },
];

const RARITY_WEIGHT: Record<Rarity, number> = { common: 60, rare: 28, epic: 10, legendary: 2 };
export const RARITY_ORDER: Rarity[] = ["common", "rare", "epic", "legendary"];

export function treasureById(id: string): Treasure | undefined {
  return TREASURES.find((t) => t.id === id);
}

/** Local calendar day key, e.g. "2026-06-18". Stable per device timezone. */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Whole days between two YYYY-MM-DD keys (b - a). */
export function dayGap(a: string, b: string): number {
  const ms = Date.parse(`${b}T00:00:00`) - Date.parse(`${a}T00:00:00`);
  return Math.round(ms / 86_400_000);
}

function seedFromKey(key: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < key.length; i++) {
    h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/** Pick a not-yet-owned treasure, weighted by rarity; null when all collected. */
function rollTreasure(ownedIds: string[], rng: () => number, minRarity: Rarity = "common"): string | null {
  const owned = new Set(ownedIds);
  const minIdx = RARITY_ORDER.indexOf(minRarity);
  let pool = TREASURES.filter((t) => !owned.has(t.id) && RARITY_ORDER.indexOf(t.rarity) >= minIdx);
  if (pool.length === 0) pool = TREASURES.filter((t) => !owned.has(t.id));
  if (pool.length === 0) return null;
  const total = pool.reduce((s, t) => s + RARITY_WEIGHT[t.rarity], 0);
  let r = rng() * total;
  for (const t of pool) {
    r -= RARITY_WEIGHT[t.rarity];
    if (r <= 0) return t.id;
  }
  return pool[pool.length - 1].id;
}

export interface DailyGift {
  dust: number;
  treasureId: string | null;
  newStreak: number;
  milestone: boolean; // every 7th consecutive day — a bigger haul
}

const BASE_DUST = 30;
const PER_DAY_DUST = 12;
const MAX_STREAK_BONUS = 10; // dust stops growing after ~10-day streaks

/** Compute today's gift. Pure: same inputs → same gift (deterministic reward). */
export function computeDailyGift(args: {
  lastGiftDay: string | null;
  streak: number;
  ownedIds: string[];
  today?: string;
}): DailyGift {
  const today = args.today ?? todayKey();
  const gap = args.lastGiftDay ? dayGap(args.lastGiftDay, today) : Infinity;
  // Consecutive day → grow the streak; a skipped day just resets the BONUS to
  // day one (never a penalty, nothing is taken away — plan anti-goals).
  const newStreak = gap === 1 ? args.streak + 1 : 1;
  const milestone = newStreak % 7 === 0;
  const grow = Math.min(newStreak - 1, MAX_STREAK_BONUS);
  let dust = BASE_DUST + grow * PER_DAY_DUST;
  if (milestone) dust *= 2;
  const rng = mulberry32(seedFromKey(today, newStreak));
  const treasureId = rollTreasure(args.ownedIds, rng, milestone ? "epic" : "common");
  if (!treasureId) dust += 40; // vault full → extra dust instead of a dupe
  return { dust, treasureId, newStreak, milestone };
}

/** Whether today's chest is still waiting to be opened. */
export function giftReady(lastGiftDay: string | null, today = todayKey()): boolean {
  return lastGiftDay !== today;
}

/** A one-off surprise treasure (e.g. a stage milestone). Null if vault full. */
export function drawTreasure(ownedIds: string[], seed: number, minRarity: Rarity = "common"): string | null {
  return rollTreasure(ownedIds, mulberry32(seed), minRarity);
}

/** Count of treasures owned of each rarity, for the vault header. */
export function vaultProgress(ownedIds: string[]): { owned: number; total: number } {
  return { owned: new Set(ownedIds).size, total: TREASURES.length };
}
