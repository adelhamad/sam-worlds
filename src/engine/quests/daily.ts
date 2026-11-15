// Daily quests — three small goals a day, picked from the date so they are the
// same all day and need no server. Pure logic: callers pass the day key and the
// day's counters. Quests are an invitation, never a duty: nothing is lost by
// skipping a day, and "quest days" only ever grows.
import { mulberry32, shuffle } from "../rng";

export type QuestKind = "lessons" | "firstTry" | "combo" | "dust" | "perfect";

/** What the child did today (all worlds and courses count). */
export interface QuestCounters {
  /** Lessons / stages finished. */
  lessons: number;
  /** First-try correct answers. */
  firstTry: number;
  /** Best run of first-try correct answers in a row. */
  combo: number;
  /** Star Dust earned from finished lessons. */
  dust: number;
  /** Lessons finished without a single miss. */
  perfect: number;
}

export const NO_COUNTERS: QuestCounters = { lessons: 0, firstTry: 0, combo: 0, dust: 0, perfect: 0 };

export interface DailyQuest {
  /** `<day>:<kind>` — unique per day. */
  id: string;
  kind: QuestKind;
  target: number;
  /** Star Dust paid when the finished quest is collected (fixed per quest). */
  reward: number;
}

/** Star Dust in the chest that opens once all three quests are collected. */
export const QUEST_CHEST_DUST = 15;
export const QUESTS_PER_DAY = 3;

interface QuestRecipe {
  kind: QuestKind;
  /** Targets from gentle to stretching; the date picks one. */
  targets: number[];
  rewardPerTarget: number[];
}

const RECIPES: QuestRecipe[] = [
  { kind: "lessons", targets: [1, 2, 3], rewardPerTarget: [5, 8, 12] },
  { kind: "firstTry", targets: [8, 12, 16], rewardPerTarget: [5, 7, 10] },
  { kind: "combo", targets: [3, 5, 8], rewardPerTarget: [4, 6, 10] },
  { kind: "dust", targets: [20, 40, 60], rewardPerTarget: [4, 7, 10] },
  { kind: "perfect", targets: [1], rewardPerTarget: [10] },
];

function daySeed(day: string): number {
  let hash = 2166136261;
  for (const char of day) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

/** Today's three quests: always "finish a lesson" plus two others, one gentle and one stretching. */
export function questsForDay(day: string): DailyQuest[] {
  const rng = mulberry32(daySeed(day));
  const [first, ...rest] = RECIPES;
  const picked = [first, ...shuffle(rng, rest).slice(0, QUESTS_PER_DAY - 1)];
  return picked.map((recipe, slot) => {
    // Slot 0 stays easy (a sure win), later slots lean harder.
    const level = Math.min(recipe.targets.length - 1, slot === 0 ? 0 : Math.floor(rng() * recipe.targets.length));
    return { id: `${day}:${recipe.kind}`, kind: recipe.kind, target: recipe.targets[level], reward: recipe.rewardPerTarget[level] };
  });
}

/** Progress toward the quest, capped at its target. */
export function questProgress(quest: DailyQuest, counters: QuestCounters): number {
  return Math.min(quest.target, counters[quest.kind]);
}

export function questDone(quest: DailyQuest, counters: QuestCounters): boolean {
  return questProgress(quest, counters) >= quest.target;
}
