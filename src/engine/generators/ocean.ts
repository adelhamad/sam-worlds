// Ocean Deep — sea creatures and ocean facts (marine biology for kids).
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, name, clue]
const CREATURES: Array<[string, string, string]> = [
  ["🐙", "octopus", "has eight wiggly arms"],
  ["🦈", "shark", "has rows of sharp teeth"],
  ["🐬", "dolphin", "is a smart animal that leaps from the water"],
  ["🐳", "whale", "is the biggest animal in the whole ocean"],
  ["🐠", "clownfish", "is orange and hides in sea anemones"],
  ["🦀", "crab", "walks sideways with two claws"],
  ["🐢", "sea turtle", "swims with flippers and has a hard shell"],
  ["🦑", "squid", "has ten arms and squirts ink"],
  ["🐡", "pufferfish", "puffs up into a spiky ball"],
  ["🦭", "seal", "barks and slides onto rocks"],
  ["🪼", "jellyfish", "is wobbly, clear, and can sting"],
  ["⭐", "starfish", "has five arms and rests on the seabed"],
  ["🦞", "lobster", "is red with two big claws"],
  ["🐚", "sea snail", "carries a curly shell on its back"],
];

// [question, answer, wrongs]
const FACTS: Array<[string, string, string[]]> = [
  ["Most of the Earth is covered by…", "oceans", ["deserts", "forests", "mountains"]],
  ["Sea water tastes…", "salty", ["sweet", "sour", "fizzy"]],
  ["The biggest animal ever is the…", "blue whale", ["elephant", "shark", "dinosaur"]],
  ["Fish breathe underwater using their…", "gills", ["nose", "ears", "lungs"]],
  ["Which of these is a mammal, not a fish?", "dolphin", ["shark", "tuna", "clownfish"]],
  ["Deep down in the ocean it is very…", "dark and cold", ["bright and warm", "sunny", "windy"]],
  ["Coral reefs are home to lots of…", "colorful fish", ["lions", "camels", "spiders"]],
  ["Sharks are excellent…", "swimmers", ["fliers", "climbers", "diggers"]],
];

// [question, number]
const COUNT: Array<[string, number]> = [
  ["How many arms does an octopus have?", 8],
  ["How many arms does a starfish usually have?", 5],
  ["How many arms does a squid have?", 10],
  ["How many oceans are there on Earth?", 5],
];

export interface OceanParams {
  types: Array<"creature" | "fact" | "count">;
}

let qid = 0;
const id = () => `oc${++qid}`;

export function generateOcean(params: OceanParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "fact") {
    const [p, a, w] = pick(rng, FACTS);
    return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Think about life under the sea.", inputMode: "choices", dedupeKey: `fact-${p}` };
  }
  if (type === "count") {
    const [p, n] = pick(rng, COUNT);
    return { id: id(), prompt: p, answer: String(n), choices: [], hint: "Picture the creature and count.", dedupeKey: `count-${p}` };
  }
  const [emoji, name, clue] = pick(rng, CREATURES);
  const wrong = shuffle(rng, CREATURES.filter((c) => c[1] !== name)).slice(0, 3);
  return {
    id: id(),
    prompt: `Which sea creature ${clue}?`,
    answer: `${emoji} ${name}`,
    choices: shuffle(rng, [`${emoji} ${name}`, ...wrong.map(([e, n]) => `${e} ${n}`)]),
    hint: "Picture it swimming in the sea.",
    inputMode: "choices",
    dedupeKey: `creature-${name}`,
  };
}
