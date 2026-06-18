// Binary Beacon — computer-science basics in base 2: binary↔decimal, place
// values (1·2·4·8·16…), counting bits, binary addition, and comparing. A novel,
// genuinely advanced system for a pattern-loving kid (plan §1.4 pattern transfer).
import { pick, randInt, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

export type BinaryType =
  | "toDecimal" | "toBinary" | "place" | "countOnes" | "add" | "next" | "compare";

export interface BinaryParams {
  types: BinaryType[];
  /** Largest decimal value to use. */
  max?: number;
}

let qid = 0;
const id = () => `bb${++qid}`;

const toBin = (n: number): string => n.toString(2);

function genToDecimal(p: BinaryParams, rng: RNG): Question {
  const n = randInt(rng, 2, p.max ?? 31);
  const b = toBin(n);
  return {
    id: id(),
    prompt: `Binary ${b} = ? in decimal`,
    answer: String(n),
    choices: [],
    hint: `Add the place values where there is a 1: …8 4 2 1.`,
  };
}

function genToBinary(rng: RNG): Question {
  const n = randInt(rng, 2, 15); // ≤ 4 binary digits for the numpad
  return {
    id: id(),
    prompt: `Write ${n} in binary.`,
    answer: toBin(n),
    choices: [],
    hint: `Which of 8, 4, 2, 1 add up to ${n}? Put a 1 there.`,
  };
}

function genPlace(rng: RNG): Question {
  const k = randInt(rng, 1, 8);
  const value = 2 ** (k - 1);
  const ord = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"][k - 1];
  return {
    id: id(),
    prompt: `In binary, what is the ${ord} place worth (from the right)?`,
    answer: String(value),
    choices: [],
    hint: `Binary places double: 1, 2, 4, 8, 16, 32…`,
  };
}

function genCountOnes(p: BinaryParams, rng: RNG): Question {
  const n = randInt(rng, 1, p.max ?? 31);
  const b = toBin(n);
  const ones = [...b].filter((c) => c === "1").length;
  return {
    id: id(),
    prompt: `How many 1-bits are in binary ${b}?`,
    answer: String(ones),
    choices: [],
    hint: `Count just the 1s.`,
  };
}

function genAdd(rng: RNG): Question {
  const a = randInt(rng, 1, 7);
  const b = randInt(rng, 1, Math.min(8, 15 - a));
  return {
    id: id(),
    prompt: `Binary ${toBin(a)} + ${toBin(b)} = ? (in binary)`,
    answer: toBin(a + b),
    choices: [],
    hint: `Add them as normal numbers (${a} + ${b}), then write it in binary.`,
  };
}

function genNext(rng: RNG): Question {
  const n = randInt(rng, 1, 14);
  return {
    id: id(),
    prompt: `What comes right after binary ${toBin(n)}?`,
    answer: toBin(n + 1),
    choices: [],
    hint: `Add 1: binary counts 1, 10, 11, 100…`,
  };
}

function genCompare(p: BinaryParams, rng: RNG): Question {
  const a = randInt(rng, 2, p.max ?? 31);
  let b = randInt(rng, 2, p.max ?? 31);
  while (b === a) b = randInt(rng, 2, p.max ?? 31);
  const big = toBin(Math.max(a, b));
  return {
    id: id(),
    prompt: `Which binary number is BIGGER?`,
    answer: big,
    choices: shuffle(rng, [toBin(a), toBin(b)]),
    inputMode: "choices",
    hint: `More digits, or a 1 further left, means bigger.`,
    dedupeKey: `bcmp-${Math.min(a, b)}-${Math.max(a, b)}`,
  };
}

const GENERATORS: Record<BinaryType, (p: BinaryParams, rng: RNG, ctx: GenContext) => Question> = {
  toDecimal: genToDecimal,
  toBinary: (_p, rng) => genToBinary(rng),
  place: (_p, rng) => genPlace(rng),
  countOnes: genCountOnes,
  add: (_p, rng) => genAdd(rng),
  next: (_p, rng) => genNext(rng),
  compare: genCompare,
};

export function generateBinary(params: BinaryParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  return (GENERATORS[type] ?? genToDecimal)(params, rng, ctx);
}
