// Dino Dig — dinosaurs, what they ate, and how we find fossils. Matching +
// ordering + counting. Facts kept simple and accurate for a 7-year-old.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, name, diet, unique clue]   diet: "plants" | "meat"
const DINOS: Array<[string, string, "plants" | "meat", string]> = [
  ["🦖", "T. rex", "meat", "was a huge hunter with tiny arms and giant teeth"],
  ["🦕", "Brachiosaurus", "plants", "had a very long neck to reach the tallest trees"],
  ["🦕", "Diplodocus", "plants", "had a long neck and a long whip-like tail"],
  ["🦏", "Triceratops", "plants", "had three horns and a big bony frill"],
  ["🐊", "Stegosaurus", "plants", "had tall bony plates along its back"],
  ["🦎", "Velociraptor", "meat", "was a small, fast, clever hunter with sharp claws"],
  ["🐲", "Spinosaurus", "meat", "had a big sail on its back and loved the water"],
  ["🛡️", "Ankylosaurus", "plants", "had bony armor and a heavy club tail"],
  ["🦴", "Iguanodon", "plants", "had a pointy thumb spike"],
  ["🎺", "Parasaurolophus", "plants", "had a long trumpet crest on its head"],
  ["🦖", "Allosaurus", "meat", "was a fierce hunter long before T. rex"],
  ["🦷", "Gallimimus", "meat", "looked like a giant ostrich and ran very fast"],
];

// [question, correct, wrongs] — paleontology facts
const FACTS: Array<[string, string, string[]]> = [
  ["What do we call dinosaur bones found in rock?", "fossils", ["pebbles", "shells", "crystals"]],
  ["A scientist who digs up dinosaurs is a…", "paleontologist", ["astronaut", "dentist", "firefighter"]],
  ["What does the word 'dinosaur' mean?", "terrible lizard", ["tiny bird", "big fish", "old turtle"]],
  ["When did the dinosaurs live?", "millions of years ago", ["last year", "in the future", "when grandpa was a boy"]],
  ["Did people and dinosaurs live at the same time?", "no, never", ["yes, together", "only on weekends", "yes, last week"]],
  ["What hatched from dinosaur eggs?", "baby dinosaurs", ["butterflies", "chickens", "lizards"]],
  ["Plant-eating animals are called…", "herbivores", ["carnivores", "doctors", "robots"]],
  ["Meat-eating animals are called…", "carnivores", ["herbivores", "bakers", "campers"]],
  ["How do we learn about dinosaurs today?", "from their fossils", ["from photos of them", "from old movies", "they tell us"]],
  ["Where can you see real dinosaur skeletons?", "in a museum", ["at the swimming pool", "in a kitchen", "at the dentist"]],
  ["Which of these is NOT a dinosaur?", "🦣 a woolly mammoth", ["🦖 T. rex", "🦕 Brachiosaurus", "🦏 Triceratops"]],
  ["What were the biggest dinosaurs' favorite food?", "leaves from tall trees", ["ice cream", "fish sticks", "other dinosaurs only"]],
];

// [question, number]
const COUNT: Array<[string, number]> = [
  ["How many horns did Triceratops have?", 3],
  ["How many legs did T. rex walk on?", 2],
  ["How many legs did Brachiosaurus walk on?", 4],
  ["How many eyes did most dinosaurs have?", 2],
];

// ordering puzzles
const ORDER: Array<[string, string[]]> = [
  ["How a dinosaur grows:", ["🥚 egg", "🦕 baby dino", "🦖 grown dino"]],
  ["Finding a dinosaur:", ["🦴 bones in rock", "⛏️ dig them out", "🏛️ build them in a museum"]],
  ["A fossil forms:", ["🦕 dino dies", "🏖️ buried in mud", "🪨 turns to stone"]],
];

export interface DinoParams {
  types: Array<"clue" | "diet" | "fact" | "count" | "order">;
}

let qid = 0;
const id = () => `dn${++qid}`;

export function generateDinos(params: DinoParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "diet":
      return genDiet(rng);
    case "fact":
      return genFact(rng);
    case "count":
      return genCount(rng);
    case "order":
      return genOrder(rng);
    default:
      return genClue(rng);
  }
}

function genClue(rng: RNG): Question {
  const [emoji, name, , clue] = pick(rng, DINOS);
  const wrong = shuffle(rng, DINOS.filter((d) => d[1] !== name)).slice(0, 3);
  return {
    id: id(),
    prompt: `Which dinosaur ${clue}?`,
    answer: `${emoji} ${name}`,
    choices: shuffle(rng, [`${emoji} ${name}`, ...wrong.map(([e, n]) => `${e} ${n}`)]),
    hint: "Picture how each dinosaur looked.",
    inputMode: "choices",
    dedupeKey: `clue-${name}`,
  };
}

function genDiet(rng: RNG): Question {
  const [emoji, name, diet, clue] = pick(rng, DINOS);
  const answer = diet === "plants" ? "🌿 plants" : "🍖 meat";
  return {
    id: id(),
    prompt: `${name} ${clue}. Did it eat plants or meat?`,
    answer,
    choices: shuffle(rng, ["🌿 plants", "🍖 meat", "🪨 only rocks"]),
    hint: diet === "plants" ? "Long necks and beaks munch leaves." : "Sharp teeth and claws hunt other animals.",
    inputMode: "choices",
    dedupeKey: `diet-${name}`,
    payload: { bigSymbol: emoji },
  };
}

function genFact(rng: RNG): Question {
  const [q, correct, wrong] = pick(rng, FACTS);
  return {
    id: id(),
    prompt: q,
    answer: correct,
    choices: shuffle(rng, [correct, ...wrong]),
    hint: "Think like a dinosaur detective.",
    inputMode: "choices",
    dedupeKey: `fact-${q}`,
  };
}

function genCount(rng: RNG): Question {
  const [q, n] = pick(rng, COUNT);
  return {
    id: id(),
    prompt: q,
    answer: String(n),
    choices: [],
    hint: "Picture the dinosaur and count.",
    dedupeKey: `count-${q}`,
  };
}

function genOrder(rng: RNG): Question {
  const [title, seq] = pick(rng, ORDER);
  return {
    id: id(),
    prompt: `${title} Put it in order!`,
    answer: seq.join(" → "),
    choices: [],
    hint: `It starts with ${seq[0]}.`,
    inputMode: "order",
    dedupeKey: `order-${title}`,
    payload: { items: shuffle(rng, seq), arrow: "→" },
  };
}
