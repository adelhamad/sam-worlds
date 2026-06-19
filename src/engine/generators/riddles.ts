// Riddle Room — classic "what am I?" riddles to stretch a kid's thinking.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [riddle, answer, wrongs]
const RIDDLES: Array<[string, string, string[]]> = [
  ["I have a face and two hands, but no arms. What am I?", "a clock", ["a person", "a glove", "a robot"]],
  ["I am full of holes but can still hold water. What am I?", "a sponge", ["a net", "a sieve", "a basket"]],
  ["The more I dry, the wetter I get. What am I?", "a towel", ["the sun", "a sponge", "a cloud"]],
  ["I have keys but open no doors. What am I?", "a piano", ["a car", "a map", "a door"]],
  ["I have a neck but no head. What am I?", "a bottle", ["a giraffe", "a shirt", "a snake"]],
  ["I am tall when I am young and short when I am old. What am I?", "a candle", ["a tree", "a person", "a tower"]],
  ["I fall down but never get hurt. What am I?", "the rain", ["a ball", "a leaf", "a cat"]],
  ["I follow you around but only come out in the sun. What am I?", "your shadow", ["the moon", "a dog", "the wind"]],
  ["I have a tail and a head but no body. What am I?", "a coin", ["a snake", "a kite", "a fish"]],
];

// [riddle, answer, wrongs] — "what has…" riddles
const WHATHAS: Array<[string, string, string[]]> = [
  ["What has hands but cannot clap?", "a clock", ["a tree", "a fish", "a rock"]],
  ["What has a thumb and four fingers but is not alive?", "a glove", ["a hand", "a foot", "a sock"]],
  ["What has legs but cannot walk?", "a table", ["a horse", "a baby", "a snake"]],
  ["What has one eye but cannot see?", "a needle", ["a person", "a storm", "a cat"]],
  ["What has teeth but cannot bite?", "a comb", ["a shark", "a dog", "a saw"]],
  ["What has a ring but no finger?", "a telephone", ["a hand", "a tree", "a bell"]],
  ["What has pages but is not a tree?", "a book", ["a leaf", "a forest", "a notebook"]],
  ["What has wings but is not a bird?", "an airplane", ["a fish", "a car", "a bee"]],
];

export interface RiddlesParams {
  types: Array<"riddle" | "whathas">;
}

let qid = 0;
const id = () => `rd${++qid}`;

export function generateRiddles(params: RiddlesParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  const pool = type === "whathas" ? WHATHAS : RIDDLES;
  const [riddle, answer, wrong] = pick(rng, pool);
  return {
    id: id(),
    prompt: riddle,
    answer,
    choices: shuffle(rng, [answer, ...wrong]),
    hint: "Picture each answer — which one fits the clue?",
    inputMode: "choices",
    dedupeKey: `${type}-${riddle}`,
  };
}
