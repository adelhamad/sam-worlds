// Great Minds — famous inventors and scientists and what they're known for.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, person, what they are famous for]
const PEOPLE: Array<[string, string, string]> = [
  ["💡", "Thomas Edison", "made the electric light bulb work"],
  ["🍎", "Isaac Newton", "explained gravity after seeing an apple fall"],
  ["✈️", "the Wright Brothers", "built the first flying airplane"],
  ["📞", "Alexander Graham Bell", "invented the telephone"],
  ["🧪", "Marie Curie", "studied radioactivity and won two Nobel Prizes"],
  ["⚡", "Benjamin Franklin", "flew a kite to learn about electricity"],
  ["🎨", "Leonardo da Vinci", "painted famous art and sketched flying machines"],
  ["🌌", "Albert Einstein", "had amazing ideas about space and time"],
  ["🔭", "Galileo", "used a telescope to study the planets"],
  ["🚗", "Henry Ford", "made cars that many families could buy"],
];

export interface InventorsParams {
  types: Array<"who" | "what">;
}

let qid = 0;
const id = () => `iv${++qid}`;

export function generateInventors(params: InventorsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  const [emoji, person, famous] = pick(rng, PEOPLE);
  if (type === "what") {
    const wrong = shuffle(rng, PEOPLE.filter((p) => p[2] !== famous)).slice(0, 3);
    return {
      id: id(),
      prompt: `What is ${person} famous for?`,
      answer: famous,
      choices: shuffle(rng, [famous, ...wrong.map(([, , f]) => f)]),
      hint: "Think about their big idea or invention.",
      inputMode: "choices",
      dedupeKey: `what-${person}`,
      payload: { bigSymbol: emoji },
    };
  }
  const wrong = shuffle(rng, PEOPLE.filter((p) => p[1] !== person)).slice(0, 3);
  return {
    id: id(),
    prompt: `Who ${famous}?`,
    answer: `${emoji} ${person}`,
    choices: shuffle(rng, [`${emoji} ${person}`, ...wrong.map(([e, n]) => `${e} ${n}`)]),
    hint: "Match the great idea to the great mind.",
    inputMode: "choices",
    dedupeKey: `who-${person}`,
  };
}
