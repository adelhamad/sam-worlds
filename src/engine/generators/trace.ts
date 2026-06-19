// Trace It — handwriting & shape practice on a canvas. The child traces a faint
// number, letter, or shape; the TraceCanvas input scores how well it was traced.
import { pick, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

const DIGITS = "0123456789".split("");
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const SHAPES = ["circle", "square", "triangle", "heart", "star"];

export interface TraceParams {
  types: Array<"digit" | "letter" | "shape">;
}

let qid = 0;
const id = () => `tc${++qid}`;

export function generateTrace(params: TraceParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "shape") {
    const shape = pick(rng, SHAPES);
    return {
      id: id(),
      prompt: `Trace the ${shape}!`,
      answer: shape,
      choices: [],
      inputMode: "canvas",
      hint: "Follow the dotted outline with your finger.",
      dedupeKey: `shape-${shape}`,
      payload: { kind: "shape", glyph: shape },
    };
  }
  if (type === "letter") {
    const ch = pick(rng, LETTERS);
    return {
      id: id(),
      prompt: `Trace the letter ${ch}!`,
      answer: ch,
      choices: [],
      inputMode: "canvas",
      hint: "Trace right over the faint letter.",
      dedupeKey: `letter-${ch}`,
      payload: { kind: "glyph", glyph: ch },
    };
  }
  const ch = pick(rng, DIGITS);
  return {
    id: id(),
    prompt: `Trace the number ${ch}!`,
    answer: ch,
    choices: [],
    inputMode: "canvas",
    hint: "Trace right over the faint number.",
    dedupeKey: `digit-${ch}`,
    payload: { kind: "glyph", glyph: ch },
  };
}
