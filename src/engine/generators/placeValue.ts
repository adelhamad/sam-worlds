// Tower of Tens — Grade 1–2 place value & number sense (US Common Core 1.NBT /
// 2.NBT): tens & ones, expanded form, comparing numbers, skip-counting, ten/one
// more-and-less, and hundreds to 1000. Answers are typed on the number pad,
// except comparisons which pick the <, =, > sign (a true matching question).
import { pick, randInt, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

/** The <, =, > sign relating two numbers. */
function signOf(a: number, b: number): string {
  if (a < b) return "<";
  if (a > b) return ">";
  return "=";
}

const stepWord = (step: number): string => String(step);

export type PlaceValueType =
  | "tensOnes" // "5 tens and 3 ones = ?"
  | "digitValue" // "In 47, the 4 is worth ?"  / "how many tens?"
  | "expand" // "40 + 3 = ?" and "53 = 40 + ?"
  | "compare" // "47 ▢ 41" → pick <, =, >
  | "skip" // "5, 10, 15, ?, ..."
  | "moreLess" // "10 more than 34 = ?"
  | "hundreds"; // "3 hundreds, 4 tens, 2 ones = ?"

export interface PlaceValueParams {
  types: PlaceValueType[];
  /** Largest number in play (≈ 99 for Grade 1 bands, up to 1000 for Grade 2). */
  max?: number;
  /** Allowed skip-count steps. */
  steps?: number[];
}

let qid = 0;
const id = () => `pv${++qid}`;

const PLACE_NAME: Record<number, string> = { 1: "ones", 10: "tens", 100: "hundreds" };

export function generatePlaceValue(params: PlaceValueParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  const max = params.max ?? 99;
  switch (type) {
    case "digitValue":
      return genDigitValue(rng, max);
    case "expand":
      return genExpand(rng, max);
    case "compare":
      return genCompare(rng, max, ctx);
    case "skip":
      return genSkip(params, rng, ctx);
    case "moreLess":
      return genMoreLess(rng, max, ctx);
    case "hundreds":
      return genHundreds(rng);
    default:
      return genTensOnes(rng, max, ctx);
  }
}

/** "5 tens and 3 ones = ?" — build a number from its parts. */
function genTensOnes(rng: RNG, max: number, ctx: GenContext): Question {
  const maxTens = Math.min(9, Math.floor(max / 10));
  const tens = randInt(rng, 1, Math.max(2, ctx.easier ? Math.min(4, maxTens) : maxTens));
  const ones = randInt(rng, 0, 9);
  const value = tens * 10 + ones;
  const onesWord = ones === 1 ? "one" : "ones";
  return {
    id: id(),
    prompt: `${tens} tens and ${ones} ${onesWord}\n= ?`,
    answer: String(value),
    choices: [],
    hint: `${tens} tens is ${tens * 10}. Add ${ones} more.`,
    dedupeKey: `to-${tens}-${ones}`,
  };
}

/** "In 47, how many tens?" or "the 4 is worth ?" — read a digit's place. */
function genDigitValue(rng: RNG, max: number): Question {
  const value = randInt(rng, 12, Math.max(20, max));
  const places = value >= 100 ? [100, 10, 1] : [10, 1];
  const place = pick(rng, places);
  const digit = Math.floor(value / place) % 10;
  if (rng() < 0.5) {
    return {
      id: id(),
      prompt: `In ${value},\nthe ${digit} is worth ?`,
      answer: String(digit * place),
      choices: [],
      hint: `It sits in the ${PLACE_NAME[place]} place, so it means ${digit} × ${place}.`,
      dedupeKey: `dv-${value}-${place}`,
    };
  }
  return {
    id: id(),
    prompt: `In ${value},\nhow many ${PLACE_NAME[place]}?`,
    answer: String(digit),
    choices: [],
    hint: `Look at the ${PLACE_NAME[place]} digit of ${value}.`,
    dedupeKey: `dc-${value}-${place}`,
  };
}

/** Expanded form both directions: "40 + 3 = ?" and "53 = 40 + ?". */
function genExpand(rng: RNG, max: number): Question {
  const big = max >= 200 && rng() < 0.5;
  const hundreds = big ? randInt(rng, 1, 9) * 100 : 0;
  const tens = randInt(rng, 1, 9) * 10;
  const ones = randInt(rng, 1, 9);
  const value = hundreds + tens + ones;
  const parts = big ? `${hundreds} + ${tens} + ${ones}` : `${tens} + ${ones}`;
  if (rng() < 0.5) {
    return {
      id: id(),
      prompt: `${parts}\n= ?`,
      answer: String(value),
      choices: [],
      hint: `Add the parts together to make one number.`,
      dedupeKey: `ex-${value}`,
    };
  }
  // Hide the ones part and ask for it.
  const shown = big ? `${hundreds} + ${tens} + ▢` : `${tens} + ▢`;
  return {
    id: id(),
    prompt: `${value} =\n${shown}`,
    answer: String(ones),
    choices: [],
    hint: `The ones digit of ${value} fills the box.`,
    dedupeKey: `eb-${value}`,
  };
}

/** "47 ▢ 41" → choose <, =, or >. */
function genCompare(rng: RNG, max: number, ctx: GenContext): Question {
  const lo = ctx.easier ? 1 : 10;
  const a = randInt(rng, lo, max);
  // bias toward close numbers so it isn't trivial
  const b = rng() < 0.35 ? a : Math.max(lo, Math.min(max, a + randInt(rng, -9, 9)));
  const biggerSide = a > b ? "left" : "right";
  const hint = a === b ? "Same number on both sides!" : `Bigger number is on the ${biggerSide}. The sign opens to the bigger one.`;
  return {
    id: id(),
    prompt: `${a} ▢ ${b}\nWhich sign?`,
    answer: signOf(a, b),
    choices: ["<", "=", ">"],
    inputMode: "choices",
    hint,
    dedupeKey: `cmp-${a}-${b}`,
  };
}

/** "5, 10, 15, ?, 25" — find the missing skip-count number. */
function genSkip(params: PlaceValueParams, rng: RNG, ctx: GenContext): Question {
  const step = pick(rng, params.steps ?? [2, 5, 10]);
  const start = step * randInt(rng, 1, 6);
  const seq = [0, 1, 2, 3, 4].map((k) => start + k * step);
  const holeAt = ctx.easier ? 4 : randInt(rng, 2, 4);
  const shown = seq.map((v, i) => (i === holeAt ? "?" : String(v))).join(", ");
  return {
    id: id(),
    prompt: `${shown}\nWhat's the ?`,
    answer: String(seq[holeAt]),
    choices: [],
    hint: `Count up by ${step}s each step.`,
    dedupeKey: `sk-${start}-${step}-${holeAt}`,
  };
}

/** "10 more than 34 = ?" — change one place by ±1 or ±10 (±100). */
function genMoreLess(rng: RNG, max: number, ctx: GenContext): Question {
  const steps = max >= 200 ? [1, 10, 100] : [1, 10];
  const step = ctx.easier ? pick(rng, [1, 10]) : pick(rng, steps);
  const more = rng() < 0.5;
  // keep the answer in range and non-negative
  const lo = more ? 0 : step;
  const value = randInt(rng, lo + 1, Math.max(lo + 2, max - (more ? step : 0)));
  const answer = more ? value + step : value - step;
  const word = stepWord(step);
  return {
    id: id(),
    prompt: `${word} ${more ? "more" : "less"} than ${value}\n= ?`,
    answer: String(answer),
    choices: [],
    hint: more ? `Count up ${word} from ${value}.` : `Count down ${word} from ${value}.`,
    dedupeKey: `ml-${value}-${step}-${more}`,
  };
}

/** "3 hundreds, 4 tens, 2 ones = ?" — Grade 2 numbers to 1000. */
function genHundreds(rng: RNG): Question {
  const h = randInt(rng, 1, 9);
  const t = randInt(rng, 0, 9);
  const o = randInt(rng, 0, 9);
  const value = h * 100 + t * 10 + o;
  return {
    id: id(),
    prompt: `${h} hundreds, ${t} tens, ${o} ones\n= ?`,
    answer: String(value),
    choices: [],
    hint: `${h} hundreds is ${h * 100}. Then add ${t * 10} and ${o}.`,
    dedupeKey: `hd-${value}`,
  };
}
