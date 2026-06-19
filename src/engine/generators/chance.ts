// Chance & Luck — probability for kids: certain, likely, unlikely, impossible,
// plus coins and dice.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

const LIKELIHOODS = ["certain", "likely", "unlikely", "impossible"];

// [event, answer]
const EVENTS: Array<[string, string]> = [
  ["The sun will rise tomorrow morning.", "certain"],
  ["A dog will fly to the Moon today.", "impossible"],
  ["If you roll a dice, you will get a number.", "certain"],
  ["It will rain ice cream from the sky.", "impossible"],
  ["You pick a red ball from a bag of ONLY red balls.", "certain"],
  ["You pick a blue ball from a bag of ONLY red balls.", "impossible"],
  ["You will grow taller as you get older.", "likely"],
  ["A snowman will melt on a hot summer day.", "likely"],
  ["You will see a real dinosaur walking to school.", "impossible"],
  ["A coin will land on heads OR tails.", "certain"],
  ["It will snow in the desert tomorrow.", "unlikely"],
  ["You will eat something today.", "certain"],
];

// [question, answer, wrongs] — coins & dice
const FACTS: Array<[string, string, string[]]> = [
  ["When you flip a coin, it can land on…", "heads or tails", ["only heads", "a number", "its side forever"]],
  ["How many sides does a coin have?", "2", ["6", "4", "1"]],
  ["The numbers on a normal dice go from 1 to…", "6", ["10", "3", "100"]],
  ["When you flip a fair coin, getting heads is…", "just as likely as tails", ["impossible", "certain", "never"]],
  ["If a bag has 9 red and 1 blue, picking red is…", "more likely", ["impossible", "less likely", "certain"]],
];

export interface ChanceParams {
  types: Array<"likely" | "fact">;
}

let qid = 0;
const id = () => `ch${++qid}`;

export function generateChance(params: ChanceParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "fact") {
    const [p, a, w] = pick(rng, FACTS);
    return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Think about what could happen.", inputMode: "choices", dedupeKey: `fact-${p}` };
  }
  const [event, answer] = pick(rng, EVENTS);
  return {
    id: id(),
    prompt: `How likely is this?  “${event}”`,
    answer,
    choices: shuffle(rng, [...LIKELIHOODS]),
    hint: "Certain = will happen. Impossible = can never happen.",
    inputMode: "choices",
    dedupeKey: `event-${event}`,
  };
}
