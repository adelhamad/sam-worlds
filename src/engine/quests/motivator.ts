// What Pogo says at home — one warm, specific line picked from what is true
// right now. Pure: the caller passes the facts. Never guilt, never a countdown.
// Priority (first match wins): quest chest ready → quests to collect → a unit
// chest waiting on a path → welcome back after ≥ 2 days → praise for today →
// close to a unit chest → the next lesson → brand-new hello → time of day.
import { HOME } from "../../strings/home";
import { questProgress, type DailyQuest, type QuestCounters, type QuestKind } from "./daily";

/** The open quest closest to done, for "one more lesson finishes a quest!". */
export interface NearestQuest {
  kind: QuestKind;
  /** How much is still needed (≥ 1). */
  left: number;
  target: number;
}

export interface MotivatorFacts {
  /** Hour of the day, 0–23. */
  hour: number;
  /** Whole days since the last finished lesson (0 = today; null = never played). */
  daysAway: number | null;
  /** Quests finished but not collected yet. */
  questsToCollect: number;
  /** Quests still open today. */
  questsOpen: number;
  /** The daily quest chest can be opened. */
  questChestReady: boolean;
  /** A unit treasure chest waits on some course path (the course title), else null. */
  chestWaitingIn: string | null;
  /** Lessons left before the next unit chest of the course in focus (null when unknown). */
  lessonsToChest: number | null;
  /** Title of the lesson the Continue button would start (null when nothing started). */
  nextLesson: string | null;
  /** Lessons finished today. */
  lessonsToday: number;
  /** A number that changes every visit, to rotate between equally good lines. */
  turn: number;
  /** Optional: the open quest closest to done (see `nearestQuest`). */
  nearest?: NearestQuest | null;
}

export type PogoMood = "wave" | "happy" | "cheer" | "idle" | "wow";

export interface MotivatorLine {
  text: string;
  /** How Pogo looks while saying it. */
  mood: PogoMood;
}

export const POGO_MOODS: readonly PogoMood[] = ["wave", "happy", "cheer", "idle", "wow"];

const WELCOME_AFTER_DAYS = 2;

function rotate<T>(items: readonly T[], turn: number): T {
  const len = items.length;
  return items[((Math.trunc(turn) % len) + len) % len];
}

/** The open (not yet finished) quest with the smallest share still to do. */
export function nearestQuest(quests: DailyQuest[], counters: QuestCounters): NearestQuest | null {
  let best: NearestQuest | null = null;
  let bestShare = Infinity;
  for (const quest of quests) {
    const left = quest.target - questProgress(quest, counters);
    if (left <= 0) continue;
    const share = left / quest.target;
    if (share < bestShare) {
      best = { kind: quest.kind, left, target: quest.target };
      bestShare = share;
    }
  }
  return best;
}

type Rule = (facts: MotivatorFacts) => MotivatorLine | null;

const P = HOME.pogo;

const chestReady: Rule = (f) => (f.questChestReady ? { text: rotate(P.chestReady, f.turn), mood: "cheer" } : null);

const toCollect: Rule = (f) =>
  f.questsToCollect > 0 ? { text: rotate(P.collect, f.turn)(f.questsToCollect), mood: "cheer" } : null;

const unitChest: Rule = (f) =>
  f.chestWaitingIn ? { text: rotate(P.chestWaiting, f.turn)(f.chestWaitingIn), mood: "wow" } : null;

const welcomeBack: Rule = (f) =>
  f.daysAway !== null && f.daysAway >= WELCOME_AFTER_DAYS ? { text: rotate(P.welcome, f.turn), mood: "wave" } : null;

function closeLine(nearest: NearestQuest): string {
  return P.questClose[nearest.kind](nearest.left, nearest.target);
}

const praise: Rule = (f) => {
  if (f.lessonsToday <= 0) return null;
  if (f.questsOpen <= 0) return { text: rotate(P.praiseAllQuests, f.turn), mood: "happy" };
  // Alternate between praise and a nudge toward the nearest quest.
  if (Math.abs(Math.trunc(f.turn)) % 2 === 1) {
    return { text: f.nearest ? closeLine(f.nearest) : P.questsOpen(f.questsOpen), mood: "happy" };
  }
  return { text: rotate(P.praise, Math.trunc(f.turn / 2))(f.lessonsToday), mood: "happy" };
};

const nearChest: Rule = (f) =>
  f.lessonsToChest !== null && f.lessonsToChest >= 1 && f.lessonsToChest <= 2
    ? { text: rotate(P.nearChest, f.turn)(f.lessonsToChest), mood: "happy" }
    : null;

const nextLesson: Rule = (f) => (f.nextLesson ? { text: rotate(P.next, f.turn)(f.nextLesson), mood: "happy" } : null);

const brandNew: Rule = (f) => (f.daysAway === null ? { text: rotate(P.brandNew, f.turn), mood: "wave" } : null);

function timeOfDay(f: MotivatorFacts): MotivatorLine {
  const hour = ((Math.trunc(f.hour) % 24) + 24) % 24;
  if (hour < 5 || hour >= 20) return { text: rotate(P.night, f.turn), mood: "idle" };
  if (hour < 12) return { text: rotate(P.morning, f.turn), mood: "wave" };
  if (hour < 17) return { text: rotate(P.afternoon, f.turn), mood: "wave" };
  return { text: rotate(P.evening, f.turn), mood: "wave" };
}

const RULES: Rule[] = [chestReady, toCollect, unitChest, welcomeBack, praise, nearChest, nextLesson, brandNew];

export function pogoLine(facts: MotivatorFacts): MotivatorLine {
  for (const rule of RULES) {
    const line = rule(facts);
    if (line) return line;
  }
  return timeOfDay(facts);
}
