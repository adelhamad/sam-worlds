// Around Town — places in the community and what you do at each one.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, place, what you do there]
const PLACES: Array<[string, string, string]> = [
  ["🏥", "hospital", "go when you are very sick or hurt"],
  ["🏫", "school", "go to learn and see friends"],
  ["📚", "library", "borrow books to read"],
  ["🏦", "bank", "keep your money safe"],
  ["🛒", "supermarket", "buy food and groceries"],
  ["🏤", "post office", "send letters and parcels"],
  ["🥖", "bakery", "buy fresh bread and cakes"],
  ["🏛️", "museum", "see old and amazing things"],
  ["🐾", "vet", "take a sick or hurt pet"],
  ["🍽️", "restaurant", "eat a meal cooked for you"],
  ["🎢", "fun fair", "ride rides and play games"],
  ["⛽", "gas station", "fill the car with fuel"],
  ["✂️", "barber", "get your hair cut"],
  ["🌳", "park", "play and run outside"],
];

export interface TownParams {
  types: Array<"where" | "what">;
}

let qid = 0;
const id = () => `tw${++qid}`;

export function generateTown(params: TownParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  const [emoji, place, doIt] = pick(rng, PLACES);
  if (type === "what") {
    const wrong = shuffle(rng, PLACES.filter((p) => p[2] !== doIt)).slice(0, 3);
    return {
      id: id(),
      prompt: `What do you do at the ${place}?`,
      answer: `You ${doIt}.`,
      choices: shuffle(rng, [`You ${doIt}.`, ...wrong.map(([, , d]) => `You ${d}.`)]),
      hint: "Picture going to that place.",
      inputMode: "choices",
      dedupeKey: `what-${place}`,
      payload: { bigSymbol: emoji },
    };
  }
  const wrong = shuffle(rng, PLACES.filter((p) => p[1] !== place)).slice(0, 3);
  return {
    id: id(),
    prompt: `Where do you go to ${doIt}?`,
    answer: `${emoji} the ${place}`,
    choices: shuffle(rng, [`${emoji} the ${place}`, ...wrong.map(([e, n]) => `${e} the ${n}`)]),
    hint: "Match the job to the right place in town.",
    inputMode: "choices",
    dedupeKey: `where-${place}`,
  };
}
