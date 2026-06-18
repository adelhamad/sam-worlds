// Cosmo — Sam's persistent companion. Pure logic only: evolution thresholds,
// hunger decay, feeding math. No React and no baked-in Date.now() (callers pass
// `now`) so every result is reproducible from its inputs.

export interface PetStage {
  emoji: string;
  /** Species-stage label — NOT the child's chosen name. */
  label: string;
  /** Cumulative XP needed to REACH this stage. */
  xp: number;
  /** Top tier gets the rainbow glow treatment. */
  legendary?: boolean;
}

// Egg → dragon evolution line. Emoji-only so there are no assets to ship and
// nothing to add to the PWA glob. Easy for Adel to retheme later.
export const PET_STAGES: PetStage[] = [
  { emoji: "🥚", label: "Mystery Egg", xp: 0 },
  { emoji: "🐣", label: "Hatchling", xp: 18 },
  { emoji: "🦎", label: "Drakeling", xp: 60 },
  { emoji: "🐲", label: "Dragonling", xp: 140 },
  { emoji: "🐉", label: "Sky Dragon", xp: 280 },
  { emoji: "🐉", label: "Cosmic Guardian", xp: 520, legendary: true },
];

/** Teaser XP per correct answer — drives the in-stage bar preview only. */
export const FEED_PER_CORRECT = 2;

/** XP a finished stage feeds the pet. Effort → growth, fully deterministic. */
export function mealXp(correct: number, perfect: boolean, firstTime: boolean): number {
  return correct * FEED_PER_CORRECT + (perfect ? 6 : 0) + (firstTime ? 4 : 0);
}

export function stageIndexForXp(xp: number): number {
  let idx = 0;
  for (let i = 0; i < PET_STAGES.length; i++) {
    if (xp >= PET_STAGES[i].xp) idx = i;
  }
  return idx;
}

export interface PetProgress {
  stage: PetStage;
  stageIndex: number;
  next: PetStage | null;
  /** 0..1 toward the next stage. */
  pct: number;
  /** Approx whole meals until the next evolution. */
  mealsToNext: number;
}

export function petProgress(xp: number): PetProgress {
  const stageIndex = stageIndexForXp(xp);
  const stage = PET_STAGES[stageIndex];
  const next = PET_STAGES[stageIndex + 1] ?? null;
  if (!next) return { stage, stageIndex, next: null, pct: 1, mealsToNext: 0 };
  const span = next.xp - stage.xp;
  const into = xp - stage.xp;
  const pct = Math.max(0, Math.min(1, into / span));
  const mealsToNext = Math.max(1, Math.ceil((next.xp - xp) / 12));
  return { stage, stageIndex, next, pct, mealsToNext };
}

const HOUR = 3_600_000;

/** Fullness 30..100. Decays to its 30 floor over ~18h, never lower — a hungry
 * pet is just "excited to eat", never sick or sad (CLAUDE.md: never punish). */
export function fullness(fedAt: number, now: number): number {
  if (!fedAt) return 100;
  const drop = ((now - fedAt) / HOUR) * 3.9;
  return Math.max(30, Math.min(100, 100 - drop));
}

export type PetMood = "happy" | "peckish" | "hungry";

export function moodOf(fullnessPct: number): PetMood {
  if (fullnessPct >= 60) return "happy";
  if (fullnessPct >= 38) return "peckish";
  return "hungry";
}
