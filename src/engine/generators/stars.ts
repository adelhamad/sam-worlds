// Star Map — constellations and stargazing (distinct from Space Voyage, which is
// planets and rockets).
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, constellation, clue]
const CONSTELLATIONS: Array<[string, string, string]> = [
  ["🥄", "the Big Dipper", "looks like a giant spoon or saucepan"],
  ["🐻", "Ursa Major", "is the Great Bear in the night sky"],
  ["🦁", "Leo", "is shaped like a proud lion"],
  ["🦂", "Scorpius", "looks like a scorpion with a curling tail"],
  ["🏹", "Orion", "the hunter, has a belt of three bright stars"],
  ["🐂", "Taurus", "is the bull among the stars"],
  ["👯", "Gemini", "is the twin brothers"],
  ["🐉", "Draco", "is the dragon winding through the sky"],
];

// [question, answer, wrongs]
const FACTS: Array<[string, string, string[]]> = [
  ["The star that always points North is the…", "North Star", ["Sun", "Moon", "shooting star"]],
  ["A group of stars that makes a picture is a…", "constellation", ["planet", "galaxy", "comet"]],
  ["Stars look tiny because they are very…", "far away", ["small", "shy", "cold"]],
  ["Our Sun is actually a…", "star", ["planet", "moon", "comet"]],
  ["The misty band of countless stars is the…", "Milky Way", ["rainbow", "North Pole", "ocean"]],
  ["A scientist who studies the stars is an…", "astronomer", ["artist", "farmer", "actor"]],
  ["To see faraway stars we use a…", "telescope", ["microscope", "magnet", "mirror"]],
  ["Stars are easiest to see on a clear, dark…", "night", ["morning", "noon", "rainy day"]],
];

export interface StarsParams {
  types: Array<"constellation" | "fact">;
}

let qid = 0;
const id = () => `sr${++qid}`;

export function generateStars(params: StarsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "fact") {
    const [p, a, w] = pick(rng, FACTS);
    return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Look up at the night sky in your mind.", inputMode: "choices", dedupeKey: `fact-${p}` };
  }
  const [emoji, name, clue] = pick(rng, CONSTELLATIONS);
  const wrong = shuffle(rng, CONSTELLATIONS.filter((c) => c[1] !== name)).slice(0, 3);
  return { id: id(), prompt: `Which constellation ${clue}?`, answer: `${emoji} ${name}`, choices: shuffle(rng, [`${emoji} ${name}`, ...wrong.map(([e, n]) => `${e} ${n}`)]), hint: "Picture the star pattern.", inputMode: "choices", dedupeKey: `con-${name}` };
}
