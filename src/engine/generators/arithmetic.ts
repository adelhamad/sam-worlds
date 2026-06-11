import { randInt, pick, type RNG } from "../rng";
import { lerp, numericChoices, type GenContext, type Question } from "./types";

export interface ArithmeticParams {
  op: "add" | "sub" | "mul" | "div" | "mix";
  /** Cap for results/operands (single-digit band). */
  max?: number;
  /** Two-digit mode: digit counts per operand, e.g. [2, 2]. */
  digits?: [number, number];
  /** Force carrying (add) / borrowing (sub) on or off. Omit = either. */
  carrying?: boolean;
  /** Mix in missing-operand questions (a + _ = c). */
  missingOperand?: boolean;
  /** Multiplication/division tables to draw from, e.g. [2, 3, 5]. */
  tables?: number[];
  /** Chain of N operands with + and −, e.g. 3 → "8 + 5 − 4". */
  chain?: number;
  /** Order-of-operations lite: "a × b + c" (multiply first). */
  orderOfOps?: boolean;
}

let qid = 0;
const id = () => `q${++qid}`;

export function generateArithmetic(params: ArithmeticParams, rng: RNG, ctx: GenContext): Question {
  if (params.orderOfOps) return genOrderOfOps(params, rng, ctx);
  if (params.chain && params.chain >= 3) return genChain(params, rng, ctx);

  const op = resolveOp(params, rng);
  if (op === "mul") return genMul(params, rng, ctx);
  if (op === "div") return genDiv(params, rng, ctx);
  return genAddSub(params, op, rng, ctx);
}

function resolveOp(params: ArithmeticParams, rng: RNG): "add" | "sub" | "mul" | "div" {
  if (params.op !== "mix") return params.op;
  const pool: Array<"add" | "sub" | "mul" | "div"> = [];
  if (params.max !== undefined || params.digits) pool.push("add", "sub");
  if (params.tables?.length) pool.push("mul", "div");
  return pool.length ? pick(rng, pool) : "add";
}

/* ---------- multiplication & division ---------- */

function genMul(params: ArithmeticParams, rng: RNG, ctx: GenContext): Question {
  const a = pick(rng, params.tables ?? [2, 3, 4, 5]);
  const bMax = ctx.easier ? 6 : Math.round(lerp(7, 12, ctx.difficulty));
  const b = randInt(rng, 1, bMax);
  const result = a * b;
  const missing = Boolean(params.missingOperand) && !ctx.easier && rng() < 0.35;

  if (missing) {
    return {
      id: id(),
      prompt: `${a} × ▢ = ${result}`,
      answer: String(b),
      choices: numericChoices(rng, b, [1, 2, 3]),
      hint: `How many ${a}s make ${result}?`,
    };
  }
  return {
    id: id(),
    prompt: `${a} × ${b} = ?`,
    answer: String(result),
    choices: numericChoices(rng, result, [a, b, 1]),
    hint: `${b} groups of ${a}. Skip-count: ${a}, ${a * 2}, …`,
  };
}

function genDiv(params: ArithmeticParams, rng: RNG, ctx: GenContext): Question {
  const divisor = pick(rng, params.tables ?? [2, 3, 4, 5]);
  const qMax = ctx.easier ? 5 : Math.round(lerp(5, 10, ctx.difficulty));
  const quotient = randInt(rng, 2, qMax);
  const dividend = divisor * quotient;
  return {
    id: id(),
    prompt: `${dividend} ÷ ${divisor} = ?`,
    answer: String(quotient),
    choices: numericChoices(rng, quotient, [1, 2, divisor]),
    hint: `How many ${divisor}s fit in ${dividend}?`,
  };
}

/* ---------- chains & order of operations ---------- */

function genChain(params: ArithmeticParams, rng: RNG, ctx: GenContext): Question {
  const max = Math.max(20, Math.round(lerp((params.max ?? 30) * 0.5, params.max ?? 30, ctx.difficulty)));
  const len = ctx.easier ? 3 : (params.chain ?? 3);
  let total = randInt(rng, 5, Math.max(10, Math.floor(max * 0.6)));
  const parts: string[] = [String(total)];
  for (let i = 1; i < len; i++) {
    const canAdd = total < max - 2;
    const canSub = total > 3;
    const add = canAdd && (!canSub || rng() < 0.5);
    if (add) {
      const v = randInt(rng, 2, max - total);
      total += v;
      parts.push(`+ ${v}`);
    } else {
      const v = randInt(rng, 1, total - 1);
      total -= v;
      parts.push(`− ${v}`);
    }
  }
  return {
    id: id(),
    prompt: `${parts.join(" ")} = ?`,
    answer: String(total),
    choices: numericChoices(rng, total, [1, 2, 10, 5]),
    hint: "Work left to right, one step at a time.",
  };
}

function genOrderOfOps(params: ArithmeticParams, rng: RNG, ctx: GenContext): Question {
  const a = pick(rng, params.tables ?? [2, 3, 4, 5]);
  const b = randInt(rng, 2, ctx.easier ? 4 : Math.round(lerp(4, 9, ctx.difficulty)));
  const prod = a * b;
  const c = randInt(rng, 2, Math.min(params.max ?? 20, 20));
  const subtract = !ctx.easier && rng() < 0.4 && prod > c;
  const result = subtract ? prod - c : prod + c;
  // sometimes lead with the addend so it isn't always "× first in reading order"
  let prompt: string;
  if (subtract) {
    prompt = `${a} × ${b} − ${c} = ?`;
  } else if (rng() < 0.35) {
    prompt = `${c} + ${a} × ${b} = ?`;
  } else {
    prompt = `${a} × ${b} + ${c} = ?`;
  }
  return {
    id: id(),
    prompt,
    answer: String(result),
    choices: numericChoices(rng, result, [c, a, 1]),
    hint: "Multiply first, then the rest!",
  };
}

/* ---------- add & subtract ---------- */

function genAddSub(
  params: ArithmeticParams,
  op: "add" | "sub",
  rng: RNG,
  ctx: GenContext,
): Question {
  let a: number, b: number;
  if (params.digits) {
    [a, b] = twoDigitPair(params, op, rng, ctx);
  } else {
    const max = Math.max(5, Math.round(lerp((params.max ?? 10) * 0.5, params.max ?? 10, ctx.easier ? 0 : ctx.difficulty)));
    if (op === "add") {
      a = randInt(rng, 1, max - 1);
      b = randInt(rng, 1, max - a);
    } else {
      a = randInt(rng, 2, max);
      b = randInt(rng, 1, a - 1);
    }
  }

  const result = op === "add" ? a + b : a - b;
  const sym = op === "add" ? "+" : "−";
  const missing = Boolean(params.missingOperand) && !ctx.easier && rng() < 0.4;

  if (missing) {
    return {
      id: id(),
      prompt: `${a} ${sym} ▢ = ${result}`,
      answer: String(b),
      choices: numericChoices(rng, b, [1, 2, 10, 3]),
      hint:
        op === "add"
          ? `What do you add to ${a} to make ${result}?`
          : `${a} take away what leaves ${result}?`,
    };
  }
  return {
    id: id(),
    prompt: `${a} ${sym} ${b} = ?`,
    answer: String(result),
    choices: numericChoices(rng, result, [1, 2, 10, 3]),
    hint: op === "add" ? `Start at ${a}, count up ${b}.` : `Start at ${a}, count back ${b}.`,
  };
}

function twoDigitPair(
  params: ArithmeticParams,
  op: "add" | "sub",
  rng: RNG,
  ctx: GenContext,
): [number, number] {
  // Difficulty moves operands toward the top of the two-digit range.
  const hiCap = ctx.easier ? 49 : Math.round(lerp(49, 89, ctx.difficulty));
  for (let tries = 0; tries < 200; tries++) {
    const a = randInt(rng, 11, Math.max(20, hiCap));
    const b = randInt(rng, params.digits?.[1] === 1 ? 2 : 11, op === "sub" ? a - 1 : 99 - a);
    if (b < 1) continue;
    const onesA = a % 10;
    const onesB = b % 10;
    const carries = op === "add" ? onesA + onesB >= 10 : onesA < onesB;
    const want = ctx.easier ? false : params.carrying;
    if (want !== undefined && carries !== want) continue;
    return [a, b];
  }
  // Fallback: simple safe pair
  return op === "add" ? [12, 13] : [25, 12];
}
