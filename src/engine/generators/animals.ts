// Animal Kingdom — animal groups, baby names, homes, and special features.
// Matching questions over a rich animal pool.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, animal, group]  group: mammal/bird/fish/reptile/insect/amphibian
const GROUPS: Array<[string, string, string]> = [
  ["🐶", "dog", "mammal"], ["🐱", "cat", "mammal"], ["🐘", "elephant", "mammal"],
  ["🦁", "lion", "mammal"], ["🐴", "horse", "mammal"], ["🐻", "bear", "mammal"],
  ["🐦", "robin", "bird"], ["🦅", "eagle", "bird"], ["🦉", "owl", "bird"],
  ["🐧", "penguin", "bird"], ["🦆", "duck", "bird"],
  ["🐟", "goldfish", "fish"], ["🦈", "shark", "fish"], ["🐠", "clownfish", "fish"],
  ["🐍", "snake", "reptile"], ["🐢", "turtle", "reptile"], ["🦎", "lizard", "reptile"], ["🐊", "crocodile", "reptile"],
  ["🐝", "bee", "insect"], ["🐜", "ant", "insect"], ["🦋", "butterfly", "insect"], ["🐞", "ladybug", "insect"],
  ["🐸", "frog", "amphibian"],
];

// [emoji, animal, baby name]
const BABIES: Array<[string, string, string]> = [
  ["🐶", "dog", "puppy"], ["🐱", "cat", "kitten"], ["🐄", "cow", "calf"],
  ["🐑", "sheep", "lamb"], ["🐴", "horse", "foal"], ["🐸", "frog", "tadpole"],
  ["🐻", "bear", "cub"], ["🦘", "kangaroo", "joey"], ["🐔", "chicken", "chick"],
  ["🦅", "eagle", "eaglet"], ["🐐", "goat", "kid"], ["🐷", "pig", "piglet"],
  ["🦌", "deer", "fawn"], ["🦢", "swan", "cygnet"],
];

// [emoji, animal, home]
const HOMES: Array<[string, string, string]> = [
  ["🐝", "bee", "a hive"], ["🐦", "bird", "a nest"], ["🕷️", "spider", "a web"],
  ["🐰", "rabbit", "a burrow"], ["🐴", "horse", "a stable"], ["🐶", "dog", "a kennel"],
  ["🐻", "bear", "a cave"], ["🐝", "ant", "an anthill"], ["🐄", "cow", "a barn"],
  ["🐟", "fish", "the water"], ["🦫", "beaver", "a lodge"], ["🐦", "owl", "a tree hollow"],
];

// [emoji, animal, special feature]
const FEATURES: Array<[string, string, string]> = [
  ["🐘", "elephant", "a long trunk"], ["🦒", "giraffe", "a very long neck"], ["🦓", "zebra", "black-and-white stripes"],
  ["🦘", "kangaroo", "a pouch for its baby"], ["🐫", "camel", "humps on its back"], ["🦔", "hedgehog", "sharp spines"],
  ["🐢", "turtle", "a hard shell"], ["🦚", "peacock", "a colorful fan of feathers"], ["🐙", "octopus", "eight arms"],
  ["🦏", "rhino", "a horn on its nose"], ["🦇", "bat", "wings to fly at night"], ["🦂", "scorpion", "a stinging tail"],
];

export interface AnimalsParams {
  types: Array<"group" | "baby" | "home" | "feature">;
}

let qid = 0;
const id = () => `an${++qid}`;
const article = (w: string) => (/^[aeiou]/i.test(w) ? "an" : "a");

function choices(rng: RNG, answer: string, pool: string[]): string[] {
  const wrong = shuffle(rng, [...new Set(pool)].filter((x) => x !== answer)).slice(0, 3);
  return shuffle(rng, [answer, ...wrong]);
}

export function generateAnimals(params: AnimalsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "baby") {
    const [emoji, animal, baby] = pick(rng, BABIES);
    return mk(rng, `What is a baby ${animal} called?`, baby, BABIES.map((b) => b[2]), `A baby ${animal}…`, `baby-${animal}`, emoji);
  }
  if (type === "home") {
    const [emoji, animal, home] = pick(rng, HOMES);
    return mk(rng, `Where does ${article(animal)} ${animal} live?`, home, HOMES.map((h) => h[2]), `Picture where ${article(animal)} ${animal} rests.`, `home-${animal}`, emoji);
  }
  if (type === "feature") {
    const [emoji, animal, feat] = pick(rng, FEATURES);
    const askWhich = rng() < 0.5;
    if (askWhich) {
      return mk(rng, `Which animal has ${feat}?`, `${emoji} ${animal}`, FEATURES.map((f) => `${f[0]} ${f[1]}`), "Picture the animal.", `featWhich-${animal}`, undefined);
    }
    return mk(rng, `What does ${article(animal)} ${animal} have?`, feat, FEATURES.map((f) => f[2]), "Picture the animal.", `feat-${animal}`, emoji);
  }
  const [emoji, animal, group] = pick(rng, GROUPS);
  return mk(rng, `Which kind of animal is ${article(animal)} ${animal}?`, group, GROUPS.map((g) => g[2]), "Mammal, bird, fish, reptile, insect or amphibian?", `group-${animal}`, emoji);
}

function mk(rng: RNG, prompt: string, answer: string, pool: string[], hint: string, dedupe: string, emoji?: string): Question {
  return {
    id: id(),
    prompt,
    answer,
    choices: choices(rng, answer, pool),
    hint,
    inputMode: "choices",
    dedupeKey: dedupe,
    ...(emoji ? { payload: { bigSymbol: emoji } } : {}),
  };
}
