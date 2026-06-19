// Mirror Magic — symmetry: shapes and letters that match when mirrored.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, thing, "yes" if symmetrical]
const THINGS: Array<[string, string, string]> = [
  ["🦋", "a butterfly", "yes"], ["❤️", "a heart", "yes"], ["⭐", "a star", "yes"],
  ["🌳", "a tree", "yes"], ["⚽", "a ball", "yes"], ["🔷", "a diamond", "yes"],
  ["✋", "a hand", "no"], ["🦶", "a foot", "no"], ["🐟", "a fish", "no"],
  ["🎈", "a balloon on a string", "no"], ["🦵", "a leg", "no"], ["🍕", "a pizza slice", "no"],
];

const SYM_LETTERS = ["A", "H", "I", "M", "O", "T", "U", "V", "W", "X", "Y"];
const ASYM_LETTERS = ["F", "G", "J", "L", "N", "P", "Q", "R", "S", "Z", "B", "E"];

export interface SymmetryParams {
  types: Array<"object" | "letter">;
}

let qid = 0;
const id = () => `sm${++qid}`;

export function generateSymmetry(params: SymmetryParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "letter") {
    const wantSym = rng() < 0.5;
    const answer = pick(rng, wantSym ? SYM_LETTERS : ASYM_LETTERS);
    const wrong = shuffle(rng, wantSym ? ASYM_LETTERS : SYM_LETTERS).slice(0, 3);
    return {
      id: id(),
      prompt: wantSym
        ? "Which letter looks the SAME in a mirror (both sides match)?"
        : "Which letter does NOT match in a mirror?",
      answer,
      choices: shuffle(rng, [answer, ...wrong]),
      hint: "Imagine folding the letter down the middle.",
      inputMode: "choices",
      dedupeKey: `letter-${wantSym}-${answer}`,
    };
  }
  const [emoji, thing, sym] = pick(rng, THINGS);
  return {
    id: id(),
    prompt: `If you fold ${thing} down the middle, do both halves match?`,
    answer: sym === "yes" ? "Yes, it's symmetrical" : "No, the halves are different",
    choices: shuffle(rng, ["Yes, it's symmetrical", "No, the halves are different"]),
    hint: "Symmetrical means both sides are mirror twins.",
    inputMode: "choices",
    dedupeKey: `object-${thing}`,
    payload: { bigSymbol: emoji },
  };
}
