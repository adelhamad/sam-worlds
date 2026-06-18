// Turbo Tracks — pure racing logic (no React, no three.js). Each "gate" is a
// row of three numbered arches across the lanes; drive through the correct one
// to BOOST and overtake the rivals. Questions come from the SHARED arithmetic
// generator (CC G1–2, quick mental-math pace), so quality matches the game.
import { shuffle, type RNG } from "./rng";
import { numericChoices, type Question } from "./generators/types";
import { generateArithmetic, type ArithmeticParams } from "./generators/arithmetic";

export const LANES = 3;
export const GATES_TOTAL = 10;

interface GateKind { skill: string; diff: number; params: ArithmeticParams }

// Fast mental-math ladder for a race: add/sub then the ×tables, escalating.
const SCHEDULE: GateKind[] = [
  { skill: "add10", diff: 0.15, params: { op: "add", max: 10 } },
  { skill: "sub10", diff: 0.2, params: { op: "sub", max: 10 } },
  { skill: "add20", diff: 0.35, params: { op: "add", max: 20 } },
  { skill: "mul-easy", diff: 0.3, params: { op: "mul", tables: [2, 5, 10] } },
  { skill: "sub20", diff: 0.4, params: { op: "sub", max: 20 } },
  { skill: "mul-mid", diff: 0.45, params: { op: "mul", tables: [2, 3, 4, 5] } },
  { skill: "add2", diff: 0.5, params: { op: "add", digits: [2, 2] } },
  { skill: "mul-mid2", diff: 0.6, params: { op: "mul", tables: [3, 4, 5, 6] } },
  { skill: "mix", diff: 0.6, params: { op: "mix", max: 20, tables: [2, 3, 5] } },
  { skill: "mul-hard", diff: 0.7, params: { op: "mul", tables: [4, 6, 7, 8] } },
];

export interface GateLane { value: string; correct: boolean }
export interface Gate {
  index: number;
  question: Question;
  /** Exactly LANES values, one correct, in lane order. */
  lanes: GateLane[];
}

function questionKey(q: Question): string {
  return q.dedupeKey ?? `${q.prompt}|${q.answer}`;
}

function laneValues(rng: RNG, q: Question): string[] {
  let pool = q.choices.filter((c) => /^-?\d+$/.test(c));
  if (!pool.includes(q.answer)) pool = numericChoices(rng, Number(q.answer), [1, 2, 3]);
  const seen = new Set<string>();
  const uniq = pool.filter((v) => (seen.has(v) ? false : (seen.add(v), true)));
  const others = uniq.filter((v) => v !== q.answer).slice(0, LANES - 1);
  while (others.length < LANES - 1) others.push(String(Number(q.answer) + others.length + 11));
  return shuffle(rng, [q.answer, ...others]);
}

/** Build the gate at `index`; re-rolls to avoid repeats within the race. */
export function buildGate(rng: RNG, index: number, easier: boolean, seen?: Set<string>): Gate {
  const kind = SCHEDULE[Math.min(index, SCHEDULE.length - 1)];
  let q: Question | null = null;
  for (let tries = 0; tries < 14; tries++) {
    const candidate = generateArithmetic(kind.params, rng, { difficulty: kind.diff, easier });
    q = candidate;
    if (!seen || !seen.has(questionKey(candidate))) { seen?.add(questionKey(candidate)); break; }
  }
  const question = q!;
  const lanes = laneValues(rng, question).map((value) => ({ value, correct: value === question.answer }));
  return { index, question, lanes };
}

// Rival racers. `gain` is metres of track advanced per gate — a mostly-correct
// driver (player gains BOOST_GAIN per correct gate) finishes ahead of all.
export const RIVALS = [
  { name: "Zoomer", emoji: "🏎️", color: 0xff5252, gain: 11 },
  { name: "Bolt", emoji: "🚙", color: 0x4caf50, gain: 13 },
  { name: "Rocket", emoji: "🚗", color: 0xab47bc, gain: 14.5 },
];
export const BOOST_GAIN = 22;
export const MISS_GAIN = 6;

/** 1st/2nd/3rd/4th from final distances (1 = best). */
export function placeOf(playerDist: number, rivalDists: number[]): number {
  return 1 + rivalDists.filter((d) => d > playerDist + 0.001).length;
}

export function placeLabel(place: number): string {
  return ["🥇 1st place!", "🥈 2nd place!", "🥉 3rd place!", "4th place"][place - 1] ?? `${place}th place`;
}
