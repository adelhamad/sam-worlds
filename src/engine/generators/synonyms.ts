// Word Twins — synonyms (same meaning) and antonyms (opposite meaning).
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

const SYN: Array<[string, string]> = [
  ["big", "large"], ["happy", "glad"], ["small", "little"], ["fast", "quick"], ["cold", "chilly"],
  ["smart", "clever"], ["scared", "afraid"], ["pretty", "beautiful"], ["tired", "sleepy"], ["angry", "mad"],
  ["jump", "leap"], ["begin", "start"], ["shut", "close"], ["tidy", "neat"], ["sad", "unhappy"], ["loud", "noisy"],
];
const ANT: Array<[string, string]> = [
  ["big", "small"], ["hot", "cold"], ["up", "down"], ["fast", "slow"], ["happy", "sad"], ["day", "night"],
  ["open", "shut"], ["full", "empty"], ["light", "dark"], ["wet", "dry"], ["high", "low"], ["push", "pull"],
  ["soft", "hard"], ["old", "new"], ["loud", "quiet"], ["near", "far"], ["first", "last"], ["give", "take"],
];

export interface SynonymsParams {
  types: Array<"synonym" | "antonym">;
}

let qid = 0;
const id = () => `sy${++qid}`;

function build(rng: RNG, phrase: string, word: string, answer: string, bank: string[], dedupe: string): Question {
  const wrong = shuffle(rng, bank.filter((o) => o !== answer && o !== word)).slice(0, 3);
  return {
    id: id(),
    prompt: `Which word means the ${phrase} “${word}”?`,
    answer,
    choices: shuffle(rng, [answer, ...wrong]),
    hint: phrase === "same as" ? "Find a word that means the same." : "Find a word that means the opposite.",
    inputMode: "choices",
    dedupeKey: dedupe,
  };
}

export function generateSynonyms(params: SynonymsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "antonym") {
    const [a, b] = pick(rng, ANT);
    const flip = rng() < 0.5;
    return build(rng, "opposite of", flip ? a : b, flip ? b : a, ANT.flat(), `ant-${a}-${b}`);
  }
  const [a, b] = pick(rng, SYN);
  const flip = rng() < 0.5;
  return build(rng, "same as", flip ? a : b, flip ? b : a, SYN.flat(), `syn-${a}-${b}`);
}
