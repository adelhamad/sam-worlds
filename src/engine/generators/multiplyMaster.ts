// Prime Peaks — advanced multiplication & division for a math-strong kid:
// tables to 12, division (exact + remainders), missing factors, factors,
// multiples, primes, and square numbers. Genuinely beyond Grade-2 arithmetic.
import { pick, randInt, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

export type MultType =
  | "times" | "divide" | "remainder" | "missing"
  | "factor" | "multiple" | "prime" | "square";

export interface MultParams {
  types: MultType[];
  /** Tables to draw from (default 2–12). */
  tables?: number[];
  /** Largest second operand. */
  max?: number;
}

let qid = 0;
const id = () => `pp${++qid}`;

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

function factorsOf(n: number): number[] {
  const out: number[] = [];
  for (let i = 2; i < n; i++) if (n % i === 0) out.push(i);
  return out;
}

function tablesOf(p: MultParams): number[] {
  return p.tables ?? [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
}

function genTimes(p: MultParams, rng: RNG): Question {
  const a = pick(rng, tablesOf(p));
  const b = randInt(rng, 2, p.max ?? 12);
  return {
    id: id(),
    prompt: `${a} × ${b} = ?`,
    answer: String(a * b),
    choices: [],
    hint: `${b} groups of ${a}. Skip-count: ${a}, ${a * 2}, ${a * 3}…`,
  };
}

function genDivide(p: MultParams, rng: RNG): Question {
  const divisor = pick(rng, tablesOf(p));
  const quotient = randInt(rng, 2, p.max ?? 12);
  const dividend = divisor * quotient;
  return {
    id: id(),
    prompt: `${dividend} ÷ ${divisor} = ?`,
    answer: String(quotient),
    choices: [],
    hint: `How many ${divisor}s fit in ${dividend}?`,
  };
}

function genRemainder(p: MultParams, rng: RNG): Question {
  const divisor = pick(rng, tablesOf(p).filter((t) => t >= 3));
  const quotient = randInt(rng, 2, p.max ?? 9);
  const rem = randInt(rng, 1, divisor - 1);
  const dividend = divisor * quotient + rem;
  return {
    id: id(),
    prompt: `${dividend} ÷ ${divisor} — what is left over?`,
    answer: String(rem),
    choices: [],
    hint: `${divisor} × ${quotient} = ${divisor * quotient}. How far to ${dividend}?`,
  };
}

function genMissing(p: MultParams, rng: RNG): Question {
  const a = pick(rng, tablesOf(p));
  const b = randInt(rng, 2, p.max ?? 12);
  return {
    id: id(),
    prompt: `${a} × ▢ = ${a * b}`,
    answer: String(b),
    choices: [],
    hint: `How many ${a}s make ${a * b}?`,
  };
}

function genSquare(p: MultParams, rng: RNG): Question {
  const n = randInt(rng, 2, Math.min(12, p.max ?? 12));
  return {
    id: id(),
    prompt: `What is ${n} squared (${n} × ${n})?`,
    answer: String(n * n),
    choices: [],
    hint: `A square number is a number times itself.`,
  };
}

function genMultiple(p: MultParams, rng: RNG): Question {
  const base = pick(rng, tablesOf(p));
  const k = randInt(rng, 3, p.max ?? 9);
  const ord = ["3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"][k - 3];
  return {
    id: id(),
    prompt: `What is the ${ord} multiple of ${base}?`,
    answer: String(base * k),
    choices: [],
    hint: `Count: ${base}, ${base * 2}, ${base * 3}…`,
  };
}

function genFactor(rng: RNG): Question {
  const n = pick(rng, [12, 16, 18, 20, 24, 28, 30, 36, 40, 48, 56, 60, 64, 72]);
  const factors = factorsOf(n);
  const answer = pick(rng, factors);
  const nonFactors = shuffle(rng, [3, 5, 7, 9, 11, 13, 14, 7, 8].filter((x) => n % x !== 0));
  const wrong = [...new Set(nonFactors)].slice(0, 3);
  return {
    id: id(),
    prompt: `Which number is a factor of ${n}?`,
    answer: String(answer),
    choices: shuffle(rng, [String(answer), ...wrong.map(String)]),
    inputMode: "choices",
    hint: `A factor divides ${n} with nothing left over.`,
    dedupeKey: `factor-${n}-${answer}`,
  };
}

function genPrime(rng: RNG): Question {
  const n = randInt(rng, 5, 40);
  const prime = isPrime(n);
  return {
    id: id(),
    prompt: `Is ${n} a prime number?`,
    answer: prime ? "Prime" : "Not prime",
    choices: ["Prime", "Not prime"],
    inputMode: "choices",
    hint: `A prime has exactly two factors: 1 and itself.`,
    dedupeKey: `prime-${n}`,
  };
}

const GENERATORS: Record<MultType, (p: MultParams, rng: RNG, ctx: GenContext) => Question> = {
  times: genTimes,
  divide: genDivide,
  remainder: genRemainder,
  missing: genMissing,
  square: genSquare,
  multiple: genMultiple,
  factor: (_p, rng) => genFactor(rng),
  prime: (_p, rng) => genPrime(rng),
};

export function generateMultiplyMaster(params: MultParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  return (GENERATORS[type] ?? genTimes)(params, rng, ctx);
}
