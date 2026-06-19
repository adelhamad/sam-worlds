// More or Less — comparing numbers: greater, smaller, the >, <, = signs, and
// ordering numbers. Difficulty scales the number range.
import { pick, shuffle, type RNG } from "../rng";
import { lerp, type GenContext, type Question } from "./types";

export interface CompareParams {
  types: Array<"greater" | "smaller" | "sign" | "order">;
}

let qid = 0;
const id = () => `cp${++qid}`;

function range(ctx: GenContext): number {
  return Math.round(lerp(9, ctx.easier ? 12 : 99, ctx.difficulty));
}
const randInt = (rng: RNG, max: number) => 1 + Math.floor(rng() * max);

function genGreaterSmaller(rng: RNG, ctx: GenContext, greater: boolean): Question {
  const max = range(ctx);
  const a = randInt(rng, max);
  let b = randInt(rng, max);
  while (a === b) b = randInt(rng, max);
  const answer = greater ? Math.max(a, b) : Math.min(a, b);
  return {
    id: id(),
    prompt: `Which number is ${greater ? "GREATER" : "SMALLER"}:  ${a}  or  ${b}?`,
    answer: String(answer),
    choices: shuffle(rng, [String(a), String(b)]),
    hint: greater ? "Greater means bigger." : "Smaller means less.",
    inputMode: "choices",
    dedupeKey: `${greater ? "gt" : "lt"}-${Math.min(a, b)}-${Math.max(a, b)}`,
  };
}

function signOf(a: number, b: number): string {
  if (a > b) return ">";
  if (a < b) return "<";
  return "=";
}

function genSign(rng: RNG, ctx: GenContext): Question {
  const max = range(ctx);
  const a = randInt(rng, max);
  const b = rng() < 0.25 ? a : randInt(rng, max);
  const sign = signOf(a, b);
  return {
    id: id(),
    prompt: `Which sign goes here?   ${a}  __  ${b}`,
    answer: sign,
    choices: shuffle(rng, [">", "<", "="]),
    hint: "The open mouth ‘>’ always eats the BIGGER number.",
    inputMode: "choices",
    dedupeKey: `sign-${a}-${b}`,
  };
}

function genOrder(rng: RNG, ctx: GenContext): Question {
  const max = range(ctx);
  const set = new Set<number>();
  while (set.size < 3) set.add(randInt(rng, max));
  const nums = [...set];
  const ordered = [...nums].sort((x, y) => x - y);
  return {
    id: id(),
    prompt: "Put the numbers in order, smallest first!",
    answer: ordered.join(" → "),
    choices: [],
    hint: "Find the smallest number to start.",
    inputMode: "order",
    dedupeKey: `order-${ordered.join("-")}`,
    payload: { items: shuffle(rng, nums.map(String)), arrow: "→" },
  };
}

export function generateCompare(params: CompareParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "smaller") return genGreaterSmaller(rng, ctx, false);
  if (type === "sign") return genSign(rng, ctx);
  if (type === "order") return genOrder(rng, ctx);
  return genGreaterSmaller(rng, ctx, true);
}
