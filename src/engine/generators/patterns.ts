// Pattern Power — spotting and continuing patterns, finding the odd one out,
// and number sequences. Early logical-reasoning practice.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

const TOKENS = ["🔴", "🔵", "🟡", "🟢", "🟣", "🟠", "⭐", "🔷"];
const TEMPLATES: Record<string, number[]> = {
  AB: [0, 1],
  ABC: [0, 1, 2],
  AABB: [0, 0, 1, 1],
  ABB: [0, 1, 1],
  AAB: [0, 0, 1],
};

// [items that match, the odd one, category]
const ODD: Array<[string[], string, string]> = [
  [["🍎", "🍌", "🍊"], "🚗", "fruit"],
  [["🐶", "🐱", "🐰"], "🍕", "animal"],
  [["🚗", "🚌", "🚲"], "🐶", "vehicle"],
  [["⚽", "🏀", "🎾"], "🍎", "ball"],
  [["🌸", "🌻", "🌷"], "🐝", "flower"],
  [["👕", "👖", "🧦"], "🍞", "clothes"],
  [["🐟", "🐠", "🦈"], "🦁", "sea animal"],
  [["🔴", "🔵", "🟡"], "🐶", "color"],
  [["🍎", "🍇", "🍓"], "✏️", "fruit"],
  [["🚂", "✈️", "🚀"], "🥪", "thing that travels"],
];

// [sequence shown, next number]
const GROW: Array<[string, number]> = [
  ["2, 4, 6, 8, ?", 10], ["5, 10, 15, 20, ?", 25], ["1, 2, 3, 4, ?", 5],
  ["10, 20, 30, ?", 40], ["2, 4, 6, ?", 8], ["3, 6, 9, ?", 12],
  ["1, 3, 5, 7, ?", 9], ["10, 9, 8, 7, ?", 6], ["5, 4, 3, 2, ?", 1],
  ["20, 18, 16, ?", 14], ["0, 2, 4, 6, ?", 8], ["15, 20, 25, ?", 30],
];

export interface PatternsParams {
  types: Array<"next" | "odd" | "grow">;
}

let qid = 0;
const id = () => `pt${++qid}`;

function genNext(rng: RNG): Question {
  const tname = pick(rng, Object.keys(TEMPLATES));
  const pat = TEMPLATES[tname];
  const distinct = Math.max(...pat) + 1;
  const toks = shuffle(rng, TOKENS).slice(0, distinct);
  const shown = 6;
  const seq = Array.from({ length: shown }, (_, i) => toks[pat[i % pat.length]]);
  const answer = toks[pat[shown % pat.length]];
  const extra = pick(rng, TOKENS.filter((t) => !toks.includes(t)));
  const choices = shuffle(rng, [...toks, extra]);
  return {
    id: id(),
    prompt: `What comes next in the pattern?  ${seq.join(" ")} __`,
    answer,
    choices,
    hint: "Say the pattern out loud and listen for the beat.",
    inputMode: "choices",
    dedupeKey: `next-${tname}-${toks.join("")}`,
  };
}

function genOdd(rng: RNG): Question {
  const [same, odd, category] = pick(rng, ODD);
  return {
    id: id(),
    prompt: "Which one does NOT belong?",
    answer: odd,
    choices: shuffle(rng, [...same, odd]),
    hint: `Three of them are the same kind of thing (a ${category}).`,
    inputMode: "choices",
    dedupeKey: `odd-${odd}-${category}`,
  };
}

function genGrow(rng: RNG): Question {
  const [seq, n] = pick(rng, GROW);
  return {
    id: id(),
    prompt: `What number comes next?  ${seq}`,
    answer: String(n),
    choices: [],
    hint: "Find how much it jumps each time.",
    dedupeKey: `grow-${seq}`,
  };
}

export function generatePatterns(params: PatternsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "odd") return genOdd(rng);
  if (type === "grow") return genGrow(rng);
  return genNext(rng);
}
