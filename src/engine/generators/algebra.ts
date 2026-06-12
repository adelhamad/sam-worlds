// Equation Station — first algebra: a hidden number to find. Box equations
// (▢ + 3 = 7) and visual emoji puzzles (🍎 + 🍎 = 8 → 🍎 = ?), including
// real two-step substitution. Every answer is typed on the number pad.
import { pick, randInt, type RNG } from "../rng";
import { lerp, type GenContext, type Question } from "./types";

const SYMBOLS = ["🍎", "🍌", "🍇", "🍓", "🥕", "⭐", "🐟", "🧁"];

export interface AlgebraParams {
  types: Array<"box" | "emoji" | "pair" | "pairSum" | "mulBox">;
  /** Cap for totals. */
  max?: number;
  /** Multiplication tables for mulBox. */
  tables?: number[];
}

let qid = 0;
const id = () => `al${++qid}`;

export function generateAlgebra(params: AlgebraParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  const max = Math.max(6, Math.round(lerp((params.max ?? 10) * 0.6, params.max ?? 10, ctx.easier ? 0 : ctx.difficulty)));
  switch (type) {
    case "emoji":
      return genEmoji(rng, max);
    case "pair":
      return genPair(rng, max, false);
    case "pairSum":
      return genPair(rng, max, true);
    case "mulBox":
      return genMulBox(params, rng, ctx);
    default:
      return genBox(rng, max);
  }
}

/** ▢ + 3 = 7 — what hides in the box? */
function genBox(rng: RNG, max: number): Question {
  const add = rng() < 0.5;
  const boxFirst = rng() < 0.5;
  if (add) {
    const total = randInt(rng, 4, max);
    const known = randInt(rng, 1, total - 1);
    const answer = total - known;
    return boxQ(boxFirst ? `▢ + ${known} = ${total}` : `${known} + ▢ = ${total}`, answer,
      `What do you add to ${known} to reach ${total}?`);
  }
  if (boxFirst) {
    const sub = randInt(rng, 1, max - 2);
    const result = randInt(rng, 1, max - sub);
    return boxQ(`▢ − ${sub} = ${result}`, sub + result, `The box lost ${sub} and ${result} was left. Add them back!`);
  }
  const start = randInt(rng, 3, max);
  const result = randInt(rng, 1, start - 1);
  return boxQ(`${start} − ▢ = ${result}`, start - result, `How far is it from ${result} back up to ${start}?`);
}

function boxQ(prompt: string, answer: number, hint: string): Question {
  return {
    id: id(),
    prompt,
    answer: String(answer),
    choices: [],
    hint,
    dedupeKey: `box-${prompt}`,
  };
}

/** 🍎 + 🍎 = 8 → 🍎 = ? */
function genEmoji(rng: RNG, max: number): Question {
  const e = pick(rng, SYMBOLS);
  const v = randInt(rng, 1, Math.max(2, Math.floor(max / 2)));
  return {
    id: id(),
    prompt: `${e} + ${e} = ${v * 2}\n${e} = ?`,
    answer: String(v),
    choices: [],
    hint: `Two of the same make ${v * 2}. Split it in half!`,
    dedupeKey: `em-${e}-${v}`,
  };
}

/** Two-step substitution: solve 🍎 first, then use it to find 🍌. */
function genPair(rng: RNG, max: number, askSum: boolean): Question {
  const e = pick(rng, SYMBOLS);
  const f2 = pick(rng, SYMBOLS.filter((s) => s !== e));
  const a = randInt(rng, 1, Math.max(2, Math.floor(max / 2)));
  const b = randInt(rng, 1, Math.max(2, max - a));
  const lines = `${e} + ${e} = ${a * 2}\n${e} + ${f2} = ${a + b}`;
  if (askSum) {
    return {
      id: id(),
      prompt: `${lines}\n${f2} + ${f2} = ?`,
      answer: String(b * 2),
      choices: [],
      hint: `First find ${e}, then ${f2}, then double it.`,
      dedupeKey: `ps-${e}${f2}-${a}-${b}`,
    };
  }
  return {
    id: id(),
    prompt: `${lines}\n${f2} = ?`,
    answer: String(b),
    choices: [],
    hint: `${e} is ${a}. Now look at the second line…`,
    dedupeKey: `pr-${e}${f2}-${a}-${b}`,
  };
}

/** ▢ × 3 = 12 — the multiplying box. */
function genMulBox(params: AlgebraParams, rng: RNG, ctx: GenContext): Question {
  const table = pick(rng, params.tables ?? [2, 3, 4, 5]);
  const factor = randInt(rng, 2, ctx.easier ? 5 : 9);
  const boxFirst = rng() < 0.5;
  return {
    id: id(),
    prompt: boxFirst ? `▢ × ${table} = ${table * factor}` : `${table} × ▢ = ${table * factor}`,
    answer: String(factor),
    choices: [],
    hint: `How many ${table}s make ${table * factor}? Skip-count: ${table}, ${table * 2}…`,
    dedupeKey: `mb-${table}-${factor}-${boxFirst}`,
  };
}
