// Word Joiner — compound words: two small words that join to make a bigger one
// (distinct from Word Builders, which is prefixes & suffixes).
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [word1, word2, compound]
const COMPOUNDS: Array<[string, string, string]> = [
  ["sun", "flower", "sunflower"], ["rain", "bow", "rainbow"], ["butter", "fly", "butterfly"],
  ["foot", "ball", "football"], ["snow", "man", "snowman"], ["tooth", "brush", "toothbrush"],
  ["cup", "cake", "cupcake"], ["star", "fish", "starfish"], ["pan", "cake", "pancake"],
  ["fire", "work", "firework"], ["bed", "room", "bedroom"], ["gold", "fish", "goldfish"],
  ["rain", "coat", "raincoat"], ["sea", "shell", "seashell"], ["play", "ground", "playground"],
  ["air", "plane", "airplane"], ["key", "board", "keyboard"], ["sand", "castle", "sandcastle"],
];

export interface CompoundsParams {
  types: Array<"join" | "missing">;
}

let qid = 0;
const id = () => `cw${++qid}`;

export function generateCompounds(params: CompoundsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  const [w1, w2, compound] = pick(rng, COMPOUNDS);
  if (type === "missing") {
    const wrong = shuffle(rng, COMPOUNDS.map((c) => c[1]).filter((w) => w !== w2)).slice(0, 3);
    return {
      id: id(),
      prompt: `Finish the compound word:  ${w1} + ___ = ${compound}`,
      answer: w2,
      choices: shuffle(rng, [w2, ...wrong]),
      hint: `Which little word finishes ${compound}?`,
      inputMode: "choices",
      dedupeKey: `missing-${compound}`,
    };
  }
  const wrong = shuffle(rng, COMPOUNDS.map((c) => c[2]).filter((w) => w !== compound)).slice(0, 3);
  return {
    id: id(),
    prompt: `Join the two words:  ${w1} + ${w2} = ?`,
    answer: compound,
    choices: shuffle(rng, [compound, ...wrong]),
    hint: "Push the two words together into one.",
    inputMode: "choices",
    dedupeKey: `join-${compound}`,
  };
}
