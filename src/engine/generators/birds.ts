// Bird World — all about birds: who's who, feathers, beaks, eggs and flight.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, bird, clue]
const BIRDS: Array<[string, string, string]> = [
  ["🦅", "eagle", "has sharp eyes and hunts from high in the sky"],
  ["🦉", "owl", "stays awake at night and hoots"],
  ["🐧", "penguin", "cannot fly but swims and waddles on ice"],
  ["🦜", "parrot", "is colorful and can copy your words"],
  ["🦢", "swan", "is white with a long, graceful neck"],
  ["🐓", "rooster", "crows ‘cock-a-doodle-doo’ at sunrise"],
  ["🦩", "flamingo", "is pink and stands on one leg"],
  ["🕊️", "dove", "is white and is a symbol of peace"],
  ["🐦", "robin", "has a red front and hops on the lawn"],
  ["🦚", "peacock", "fans out a tail of beautiful feathers"],
  ["🦃", "turkey", "is a big bird with a wobbly red throat"],
];

// [question, answer, wrongs]
const FACTS: Array<[string, string, string[]]> = [
  ["A bird's body is covered in…", "feathers", ["fur", "scales", "wool"]],
  ["Baby birds hatch out of…", "eggs", ["seeds", "cocoons", "shells of nuts"]],
  ["A bird's mouth is called a…", "beak", ["snout", "trunk", "nose"]],
  ["Birds build a ___ to keep their eggs safe.", "nest", ["web", "burrow", "shell"]],
  ["What do birds use to fly?", "their wings", ["their feet", "their tails", "their beaks"]],
  ["Which bird CANNOT fly?", "a penguin", ["an eagle", "a robin", "a dove"]],
  ["When birds fly to warm places for winter, it's called…", "migration", ["hibernation", "swimming", "nesting"]],
];

const COUNT: Array<[string, number]> = [
  ["How many legs does a bird have?", 2],
  ["How many wings does a bird have?", 2],
];

export interface BirdsParams {
  types: Array<"identify" | "fact" | "count">;
}

let qid = 0;
const id = () => `bd${++qid}`;

export function generateBirds(params: BirdsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "fact") {
    const [p, a, w] = pick(rng, FACTS);
    return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Think about our feathered friends.", inputMode: "choices", dedupeKey: `fact-${p}` };
  }
  if (type === "count") {
    const [p, n] = pick(rng, COUNT);
    return { id: id(), prompt: p, answer: String(n), choices: [], hint: "Picture a bird and count.", dedupeKey: `count-${p}` };
  }
  const [emoji, bird, clue] = pick(rng, BIRDS);
  const wrong = shuffle(rng, BIRDS.filter((b) => b[1] !== bird)).slice(0, 3);
  return { id: id(), prompt: `Which bird ${clue}?`, answer: `${emoji} ${bird}`, choices: shuffle(rng, [`${emoji} ${bird}`, ...wrong.map(([e, n]) => `${e} ${n}`)]), hint: "Picture the bird.", inputMode: "choices", dedupeKey: `id-${bird}` };
}
