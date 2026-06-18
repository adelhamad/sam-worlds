// Star Ranger — pure game logic (no React, no three.js). A patrol is a ramp of
// math quests; each quest spawns a cluster of numbered crystals (one correct,
// the rest plausible distractors) drawn from the SHARED, vetted generators so
// question quality matches the rest of the game. Answer-integrity rule 1
// (regenerate on miss) is honored by the React module simply re-calling
// buildQuest with the same index for a fresh same-difficulty question.
import { pick, shuffle, type RNG } from "./rng";
import { numericChoices } from "./generators/types";
import { generateArithmetic, type ArithmeticParams } from "./generators/arithmetic";
import { generateNumberSequence, type SequenceParams } from "./generators/numberSequence";
import type { Question } from "./generators/types";
import { persona } from "../persona.config";

export interface RangerTarget {
  id: number;
  value: string;
  correct: boolean;
}

export interface Quest {
  index: number;
  /** Skill key — used for rapid-guess tracking + difficulty grouping. */
  skill: string;
  question: Question;
  targets: RangerTarget[];
}

type QuestKind =
  | { gen: "arithmetic"; skill: string; diff: number; params: ArithmeticParams }
  | { gen: "sequence"; skill: string; diff: number; params: SequenceParams };

/**
 * The patrol ladder: 12 quests rising from add/sub-within-10 to two-digit
 * carrying, skip-counting, sequences and ×tables — aligned to US Common Core
 * G1–2 and kept lively for a gifted seven-year-old. Difficulty within a band
 * comes from each entry's `diff` (0..1) fed to the generator context.
 */
const SCHEDULE: QuestKind[] = [
  { gen: "arithmetic", skill: "add10", diff: 0.1, params: { op: "add", max: 10 } },
  { gen: "arithmetic", skill: "sub10", diff: 0.2, params: { op: "sub", max: 10 } },
  { gen: "arithmetic", skill: "add20", diff: 0.35, params: { op: "add", max: 20 } },
  { gen: "arithmetic", skill: "missing", diff: 0.45, params: { op: "add", max: 20, missingOperand: true } },
  { gen: "arithmetic", skill: "sub20", diff: 0.4, params: { op: "sub", max: 20 } },
  { gen: "sequence", skill: "skip", diff: 0.4, params: { kinds: ["skip"], stepMax: 10, mode: "next" } },
  { gen: "arithmetic", skill: "add2", diff: 0.5, params: { op: "add", digits: [2, 2], carrying: true } },
  { gen: "arithmetic", skill: "sub2", diff: 0.55, params: { op: "sub", digits: [2, 2], carrying: true } },
  { gen: "sequence", skill: "seq", diff: 0.6, params: { kinds: ["step", "skip", "alternate"], stepMax: 6, mode: "missing" } },
  { gen: "arithmetic", skill: "mul", diff: 0.5, params: { op: "mul", tables: [2, 3, 5, 10] } },
  { gen: "arithmetic", skill: "mix2", diff: 0.65, params: { op: "mix", digits: [2, 2], tables: [2, 3, 5] } },
  { gen: "arithmetic", skill: "chain", diff: 0.7, params: { op: "add", max: 40, chain: 3 } },
];

export const PATROL_LEN = SCHEDULE.length;

function questionKey(q: Question): string {
  return q.dedupeKey ?? `${q.prompt}|${q.answer}`;
}

/** Turn a question's choices into floating crystal targets (one correct). */
function buildTargets(rng: RNG, q: Question): RangerTarget[] {
  let values = q.choices.filter((c) => /^-?\d+$/.test(c));
  if (values.length < 3 || !values.includes(q.answer)) {
    values = numericChoices(rng, Number(q.answer), [1, 2, 3, 10]);
  }
  // unique, keep the correct one, cap at 4 so the cluster stays readable
  const seen = new Set<string>();
  const unique = values.filter((v) => (seen.has(v) ? false : (seen.add(v), true)));
  if (!unique.includes(q.answer)) unique[0] = q.answer;
  return shuffle(rng, unique.slice(0, 4)).map((value, id) => ({
    id,
    value,
    correct: value === q.answer,
  }));
}

/**
 * Build the quest at `index`. Re-draws until the question is new for this
 * patrol (within-session no-repeat), falling back to whatever it has after a
 * bounded number of tries so it never loops forever on a small pool.
 */
export function buildQuest(rng: RNG, index: number, easier: boolean, seen?: Set<string>): Quest {
  const entry = SCHEDULE[Math.min(index, SCHEDULE.length - 1)];
  const ctx = { difficulty: entry.diff, easier };
  let q: Question | null = null;
  for (let tries = 0; tries < 14; tries++) {
    const candidate =
      entry.gen === "arithmetic"
        ? generateArithmetic(entry.params, rng, ctx)
        : generateNumberSequence(entry.params, rng, ctx);
    q = candidate;
    const key = questionKey(candidate);
    if (!seen || !seen.has(key)) {
      seen?.add(key);
      break;
    }
  }
  const question = q!;
  return { index, skill: entry.skill, question, targets: buildTargets(rng, question) };
}

const PRAISE = [
  "Bullseye!",
  "Nice shot!",
  "Crystal cracked!",
  "Perfect aim!",
  "Zapped it!",
  "You nailed it!",
];

/** A short, warm hit line — sometimes name-aware ("Ranger Sam"). */
export function praise(rng: RNG): string {
  return rng() < 0.4 ? `${pick(rng, PRAISE)} Ranger ${persona.name}!` : pick(rng, PRAISE);
}

/** A friendly rank for the patrol scorecard, scaling with first-try count. */
export function rankTitle(firstTryCount: number): string {
  if (firstTryCount >= PATROL_LEN) return "⭐ Star Ranger Legend";
  if (firstTryCount >= 9) return "🏅 Master Ranger";
  if (firstTryCount >= 6) return "🎖️ Sharp Ranger";
  if (firstTryCount >= 3) return "🤠 Ranger Scout";
  return "🌱 Ranger Cadet";
}

/** Score per crystal: full for a first-try hit, partial after a hint (rule 4). */
export function crystalScore(firstTry: boolean): number {
  return firstTry ? 10 : 4;
}
