// Habitat Hunt — biomes and which animals live in them (desert, arctic,
// rainforest, ocean, forest, grassland).
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, animal, biome]
const ANIMALS: Array<[string, string, string]> = [
  ["🐪", "camel", "desert"], ["🦂", "scorpion", "desert"], ["🦎", "lizard", "desert"],
  ["🐻‍❄️", "polar bear", "arctic"], ["🐧", "penguin", "arctic"], ["🦭", "seal", "arctic"],
  ["🐒", "monkey", "rainforest"], ["🦜", "parrot", "rainforest"], ["🐸", "tree frog", "rainforest"],
  ["🐠", "fish", "ocean"], ["🐙", "octopus", "ocean"], ["🦈", "shark", "ocean"],
  ["🦌", "deer", "forest"], ["🦉", "owl", "forest"], ["🐺", "wolf", "forest"],
  ["🦁", "lion", "grassland"], ["🦓", "zebra", "grassland"], ["🐘", "elephant", "grassland"],
];

// [biome, description]
const BIOMES: Array<[string, string]> = [
  ["desert", "is hot, dry and very sandy"],
  ["arctic", "is freezing cold and covered in ice"],
  ["rainforest", "is warm, wet and packed with tall trees"],
  ["ocean", "is deep, salty water"],
  ["forest", "is full of trees with shade and leaves"],
  ["grassland", "is wide open land with tall grass"],
];

export interface HabitatsParams {
  types: Array<"where" | "desc" | "which">;
}

let qid = 0;
const id = () => `hb${++qid}`;
const biomeNames = BIOMES.map((b) => b[0]);
const article = (w: string) => (/^[aeiou]/i.test(w) ? "an" : "a");

export function generateHabitats(params: HabitatsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "desc") {
    const [biome, desc] = pick(rng, BIOMES);
    const wrong = shuffle(rng, biomeNames.filter((b) => b !== biome)).slice(0, 3);
    return { id: id(), prompt: `Which place ${desc}?`, answer: biome, choices: shuffle(rng, [biome, ...wrong]), hint: "Picture that kind of place.", inputMode: "choices", dedupeKey: `desc-${biome}` };
  }
  if (type === "which") {
    const biome = pick(rng, biomeNames);
    const [emoji, animal] = pick(rng, ANIMALS.filter((a) => a[2] === biome));
    const wrong = shuffle(rng, ANIMALS.filter((a) => a[2] !== biome)).slice(0, 3);
    return { id: id(), prompt: `Which animal lives in the ${biome}?`, answer: `${emoji} ${animal}`, choices: shuffle(rng, [`${emoji} ${animal}`, ...wrong.map(([e, n]) => `${e} ${n}`)]), hint: `The ${biome} is a special home.`, inputMode: "choices", dedupeKey: `which-${biome}-${animal}` };
  }
  const [emoji, animal, biome] = pick(rng, ANIMALS);
  const wrong = shuffle(rng, biomeNames.filter((b) => b !== biome)).slice(0, 3);
  return { id: id(), prompt: `Where does ${article(animal)} ${animal} live?`, answer: biome, choices: shuffle(rng, [biome, ...wrong]), hint: "Match the animal to its home.", inputMode: "choices", dedupeKey: `where-${animal}`, payload: { bigSymbol: emoji } };
}
