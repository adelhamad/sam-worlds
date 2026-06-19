// Roman Numerals — reading and writing I, V, X and friends.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [number, roman numeral]
const NUMS: Array<[number, string]> = [
  [1, "I"], [2, "II"], [3, "III"], [4, "IV"], [5, "V"], [6, "VI"],
  [7, "VII"], [8, "VIII"], [9, "IX"], [10, "X"], [11, "XI"], [12, "XII"], [20, "XX"],
];

// [symbol, value] — the key letters
const SYMBOLS: Array<[string, number]> = [
  ["I", 1], ["V", 5], ["X", 10], ["L", 50], ["C", 100],
];

export interface RomanParams {
  types: Array<"toRoman" | "toNumber" | "symbol">;
}

let qid = 0;
const id = () => `rm${++qid}`;

export function generateRoman(params: RomanParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "toNumber") {
    const [n, roman] = pick(rng, NUMS);
    return { id: id(), prompt: `What number is this Roman numeral?  ${roman}`, answer: String(n), choices: [], hint: "I = 1, V = 5, X = 10. Add them up.", dedupeKey: `toNum-${roman}` };
  }
  if (type === "symbol") {
    const [sym, val] = pick(rng, SYMBOLS);
    const wrong = shuffle(rng, SYMBOLS.filter((s) => s[0] !== sym)).slice(0, 3);
    return { id: id(), prompt: `Which Roman numeral means ${val}?`, answer: sym, choices: shuffle(rng, [sym, ...wrong.map(([s]) => s)]), hint: "I=1, V=5, X=10, L=50, C=100.", inputMode: "choices", dedupeKey: `sym-${val}` };
  }
  const [n, roman] = pick(rng, NUMS);
  const wrong = shuffle(rng, NUMS.filter((m) => m[1] !== roman)).slice(0, 3);
  return { id: id(), prompt: `How do you write ${n} in Roman numerals?`, answer: roman, choices: shuffle(rng, [roman, ...wrong.map(([, r]) => r)]), hint: "I=1, V=5, X=10. IV is one before five.", inputMode: "choices", dedupeKey: `toRoman-${n}` };
}
