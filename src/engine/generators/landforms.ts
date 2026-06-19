// Landform Land — the Earth's natural features: mountains, rivers, islands and
// more (physical geography, distinct from the country-focused worlds).
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, landform, clue]
const LANDFORMS: Array<[string, string, string]> = [
  ["⛰️", "a mountain", "is a very tall, rocky peak"],
  ["🏞️", "a river", "is moving water that flows to the sea"],
  ["🏝️", "an island", "is land with water all around it"],
  ["🏜️", "a desert", "is dry, sandy land with almost no rain"],
  ["🌋", "a volcano", "is a mountain that can erupt with lava"],
  ["🏔️", "a valley", "is the low land between two hills"],
  ["🏖️", "a beach", "is sandy land right beside the sea"],
  ["💧", "a lake", "is a big pool of water with land all around"],
  ["🕳️", "a cave", "is a hollow space inside rock"],
  ["🌊", "an ocean", "is a huge body of salty water"],
  ["🌾", "a plain", "is wide, flat, grassy land"],
  ["🏞️", "a waterfall", "is water tumbling down over a cliff"],
];

export interface LandformsParams {
  types: Array<"identify" | "desc">;
}

let qid = 0;
const id = () => `lf${++qid}`;

export function generateLandforms(params: LandformsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  const [emoji, name, clue] = pick(rng, LANDFORMS);
  if (type === "desc") {
    const wrong = shuffle(rng, LANDFORMS.filter((l) => l[2] !== clue)).slice(0, 3);
    return {
      id: id(),
      prompt: `What is ${name}?`,
      answer: `It ${clue}.`,
      choices: shuffle(rng, [`It ${clue}.`, ...wrong.map(([, , c]) => `It ${c}.`)]),
      hint: "Picture that place in nature.",
      inputMode: "choices",
      dedupeKey: `desc-${name}`,
      payload: { bigSymbol: emoji },
    };
  }
  const wrong = shuffle(rng, LANDFORMS.filter((l) => l[1] !== name)).slice(0, 3);
  return {
    id: id(),
    prompt: `Which landform ${clue}?`,
    answer: `${emoji} ${name}`,
    choices: shuffle(rng, [`${emoji} ${name}`, ...wrong.map(([e, n]) => `${e} ${n}`)]),
    hint: "Picture it on a map or in nature.",
    inputMode: "choices",
    dedupeKey: `id-${name}`,
  };
}
