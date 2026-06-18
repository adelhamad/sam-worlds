// Fraction Factory — fractions & decimals well past "name the half" (plan:
// advanced math): fraction of a number, equivalent fractions, comparing,
// adding like denominators, simplifying, fraction→decimal, and reading a
// shaded bar. Numeric answers use the number pad; fraction answers are chosen.
import { pick, randInt, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

export type FractionType =
  | "ofNumber" | "equivalent" | "compare" | "addSame" | "simplify" | "toDecimal" | "shaded";

export interface FractionParams {
  types: FractionType[];
}

let qid = 0;
const id = () => `fr${++qid}`;

interface Frac {
  n: number;
  d: number;
}
const fracStr = (f: Frac): string => `${f.n}/${f.d}`;
const val = (f: Frac): number => f.n / f.d;

const PROPER: Frac[] = [
  { n: 1, d: 2 }, { n: 1, d: 3 }, { n: 2, d: 3 }, { n: 1, d: 4 }, { n: 3, d: 4 },
  { n: 1, d: 5 }, { n: 2, d: 5 }, { n: 3, d: 5 }, { n: 4, d: 5 }, { n: 1, d: 6 },
  { n: 5, d: 6 }, { n: 1, d: 8 }, { n: 3, d: 8 }, { n: 5, d: 8 }, { n: 7, d: 8 },
];
const DECIMALS: Array<[Frac, string]> = [
  [{ n: 1, d: 2 }, "0.5"], [{ n: 1, d: 4 }, "0.25"], [{ n: 3, d: 4 }, "0.75"],
  [{ n: 1, d: 5 }, "0.2"], [{ n: 2, d: 5 }, "0.4"], [{ n: 3, d: 5 }, "0.6"],
  [{ n: 4, d: 5 }, "0.8"], [{ n: 1, d: 10 }, "0.1"], [{ n: 3, d: 10 }, "0.3"],
];

function genOfNumber(rng: RNG): Question {
  const f = pick(rng, PROPER.filter((x) => x.d <= 6));
  const mult = randInt(rng, 2, 8);
  const whole = f.d * mult;
  return {
    id: id(),
    prompt: `What is ${fracStr(f)} of ${whole}?`,
    answer: String(f.n * mult), // = (n/d) × (d·mult), kept integer to avoid float error
    choices: [],
    hint: `Split ${whole} into ${f.d} equal parts, then take ${f.n}.`,
  };
}

function genEquivalent(rng: RNG): Question {
  const f = pick(rng, PROPER.filter((x) => x.d <= 5));
  const k = randInt(rng, 2, 4);
  return {
    id: id(),
    prompt: `${fracStr(f)} = ▢/${f.d * k}`,
    answer: String(f.n * k),
    choices: [],
    hint: `Both top and bottom multiply by ${k}.`,
  };
}

function genCompare(rng: RNG): Question {
  const a = pick(rng, PROPER);
  let b = pick(rng, PROPER);
  while (val(a) === val(b)) b = pick(rng, PROPER);
  const bigger = val(a) > val(b) ? a : b;
  return {
    id: id(),
    prompt: `Which is bigger: ${fracStr(a)} or ${fracStr(b)}?`,
    answer: fracStr(bigger),
    choices: shuffle(rng, [fracStr(a), fracStr(b)]),
    inputMode: "choices",
    hint: `Same pieces? More on top wins. Same top? Fewer pieces are bigger.`,
    dedupeKey: `cmp-${fracStr(a)}-${fracStr(b)}`,
  };
}

function genAddSame(rng: RNG): Question {
  const d = pick(rng, [3, 4, 5, 6, 8]);
  const n1 = randInt(rng, 1, d - 2);
  const n2 = randInt(rng, 1, d - n1 - 1);
  return {
    id: id(),
    prompt: `${n1}/${d} + ${n2}/${d} = ▢/${d}  (top number?)`,
    answer: String(n1 + n2),
    choices: [],
    hint: `Same bottom — just add the tops: ${n1} + ${n2}.`,
  };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function genSimplify(rng: RNG): Question {
  const base = pick(rng, PROPER.filter((x) => x.d <= 5));
  const k = randInt(rng, 2, 3);
  const n = base.n * k;
  const d = base.d * k;
  const g = gcd(n, d);
  const answer = `${n / g}/${d / g}`;
  const wrongs = shuffle(rng, PROPER.filter((f) => fracStr(f) !== answer)).slice(0, 3).map(fracStr);
  return {
    id: id(),
    prompt: `Simplify ${n}/${d} to its simplest form.`,
    answer,
    choices: shuffle(rng, [answer, ...wrongs]),
    inputMode: "choices",
    hint: `Divide top and bottom by the same number.`,
    dedupeKey: `simp-${n}-${d}`,
  };
}

function genToDecimal(rng: RNG): Question {
  const [f, dec] = pick(rng, DECIMALS);
  const wrongs = shuffle(rng, DECIMALS.map(([, d]) => d).filter((d) => d !== dec)).slice(0, 3);
  return {
    id: id(),
    prompt: `Write ${fracStr(f)} as a decimal.`,
    answer: dec,
    choices: shuffle(rng, [dec, ...wrongs]),
    inputMode: "choices",
    hint: `1/2 = 0.5, 1/4 = 0.25, 1/5 = 0.2.`,
    dedupeKey: `dec-${fracStr(f)}`,
  };
}

function genShaded(rng: RNG): Question {
  const d = pick(rng, [3, 4, 5, 6, 8]);
  const n = randInt(rng, 1, d - 1);
  const bar = "🟦".repeat(n) + "⬜".repeat(d - n);
  const answer = `${n}/${d}`;
  const cand = [`${d - n}/${d}`, `${n}/${d + 1}`, `${Math.max(1, n - 1)}/${d}`, `${Math.min(d - 1, n + 1)}/${d}`, `${n}/${d + 2}`];
  const wrongs = [...new Set(cand.filter((w) => w !== answer))].slice(0, 3);
  return {
    id: id(),
    prompt: `${bar}\nWhat fraction is blue?`,
    answer,
    choices: shuffle(rng, [answer, ...wrongs]),
    inputMode: "choices",
    hint: `Blue parts on top, total parts on the bottom.`,
    dedupeKey: `shaded-${n}-${d}`,
  };
}

const GENERATORS: Record<FractionType, (rng: RNG, ctx: GenContext) => Question> = {
  ofNumber: (rng) => genOfNumber(rng),
  equivalent: (rng) => genEquivalent(rng),
  compare: (rng) => genCompare(rng),
  addSame: (rng) => genAddSame(rng),
  simplify: (rng) => genSimplify(rng),
  toDecimal: (rng) => genToDecimal(rng),
  shaded: (rng) => genShaded(rng),
};

export function generateFractions(params: FractionParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  return (GENERATORS[type] ?? genOfNumber)(rng, ctx);
}
