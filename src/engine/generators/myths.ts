// Myths & Legends — mythical creatures and folklore from around the world.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, creature, clue]
const CREATURES: Array<[string, string, string]> = [
  ["🐉", "a dragon", "breathes fire and has scales and wings"],
  ["🦄", "a unicorn", "is a horse with one magical horn"],
  ["🧜‍♀️", "a mermaid", "is half person and half fish"],
  ["🐦‍🔥", "a phoenix", "is a bird that bursts into flame and is reborn"],
  ["🧚", "a fairy", "is tiny with sparkly wings and magic dust"],
  ["🧞", "a genie", "grants wishes from a magic lamp"],
  ["👹", "an ogre", "is a big, grumpy giant"],
  ["🐺", "a werewolf", "is a person who turns into a wolf at full moon"],
  ["🦅", "a griffin", "has an eagle's head and a lion's body"],
  ["🪶", "Pegasus", "is a flying horse with feathered wings"],
];

// [question, answer, wrongs]
const FACTS: Array<[string, string, string[]]> = [
  ["A made-up story passed down for many years is a…", "legend", ["recipe", "map", "test"]],
  ["A genie usually lives inside a magic…", "lamp", ["box", "shoe", "book"]],
  ["In the tale, King Arthur pulled a sword from a…", "stone", ["tree", "lake", "cloud"]],
  ["A unicorn is famous for the single horn on its…", "head", ["foot", "tail", "wing"]],
  ["Mythical creatures are make-believe, which means they are…", "not real", ["real animals", "dinosaurs", "robots"]],
  ["A dragon's favorite thing to breathe is…", "fire", ["bubbles", "snow", "music"]],
];

export interface MythsParams {
  types: Array<"creature" | "fact">;
}

let qid = 0;
const id = () => `my${++qid}`;

export function generateMyths(params: MythsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "fact") {
    const [p, a, w] = pick(rng, FACTS);
    return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "These are make-believe stories.", inputMode: "choices", dedupeKey: `fact-${p}` };
  }
  const [emoji, name, clue] = pick(rng, CREATURES);
  const wrong = shuffle(rng, CREATURES.filter((c) => c[1] !== name)).slice(0, 3);
  return { id: id(), prompt: `Which mythical creature ${clue}?`, answer: `${emoji} ${name}`, choices: shuffle(rng, [`${emoji} ${name}`, ...wrong.map(([e, n]) => `${e} ${n}`)]), hint: "Picture the magical creature.", inputMode: "choices", dedupeKey: `cr-${name}` };
}
