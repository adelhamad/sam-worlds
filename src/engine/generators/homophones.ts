// Sound-Alikes — homophones: words that sound the same but mean different things
// and are spelled differently (there/their, to/two/too…).
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [sentence with a blank, the right word, the sound-alike wrong words]
const SENTENCES: Array<[string, string, string[]]> = [
  ["I can ___ a bird singing outside.", "hear", ["here"]],
  ["Come ___ and sit beside me.", "here", ["hear"]],
  ["I have ___ red apples.", "two", ["to", "too"]],
  ["Can I come ___, as well?", "too", ["two", "to"]],
  ["I want ___ go to the park.", "to", ["two", "too"]],
  ["Look over ___ at the rainbow!", "there", ["their", "they're"]],
  ["That is ___ dog wagging its tail.", "their", ["there", "they're"]],
  ["We ___ a yummy cake yesterday.", "ate", ["eight"]],
  ["I am ___ years old today.", "eight", ["ate"]],
  ["The sky is bright ___ today.", "blue", ["blew"]],
  ["The wind ___ the leaves away.", "blew", ["blue"]],
  ["Let's swim in the ___.", "sea", ["see"]],
  ["I can ___ the big ship.", "see", ["sea"]],
  ["The ___ is shining warm and bright.", "sun", ["son"]],
  ["I picked a pretty ___ from the garden.", "flower", ["flour"]],
  ["We need ___ to bake the bread.", "flour", ["flower"]],
];

// [meaning, the matching word, sound-alike wrongs]
const MEANINGS: Array<[string, string, string[]]> = [
  ["the number after one", "two", ["to", "too"]],
  ["a big body of salty water", "sea", ["see"]],
  ["to use your eyes", "see", ["sea"]],
  ["to use your ears", "hear", ["here"]],
  ["the opposite of day", "night", ["knight"]],
  ["a brave warrior in armor", "knight", ["night"]],
  ["a boy child in a family", "son", ["sun"]],
  ["the star that warms the Earth", "sun", ["son"]],
];

export interface HomophonesParams {
  types: Array<"choose" | "mean">;
}

let qid = 0;
const id = () => `hp${++qid}`;

export function generateHomophones(params: HomophonesParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "mean") {
    const [meaning, word, wrong] = pick(rng, MEANINGS);
    return { id: id(), prompt: `Which word means “${meaning}”?`, answer: word, choices: shuffle(rng, [word, ...wrong]), hint: "They sound the same — pick the right spelling.", inputMode: "choices", dedupeKey: `mean-${meaning}` };
  }
  const [sentence, word, wrong] = pick(rng, SENTENCES);
  return { id: id(), prompt: `Finish the sentence:  ${sentence}`, answer: word, choices: shuffle(rng, [word, ...wrong]), hint: "Which spelling fits the sentence?", inputMode: "choices", dedupeKey: `choose-${sentence}` };
}
