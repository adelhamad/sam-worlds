// Ancient Worlds — old civilizations and history (distinct from Then & Now,
// which is everyday old-vs-new objects).
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, civilization, clue]
const CIVS: Array<[string, string, string]> = [
  ["🔺", "Ancient Egypt", "built giant pyramids and made mummies"],
  ["🏛️", "Ancient Greece", "started the Olympic Games and democracy"],
  ["🗡️", "Ancient Rome", "built roads and had gladiators in the Colosseum"],
  ["🧱", "Ancient China", "built the Great Wall and invented paper"],
  ["⛵", "the Vikings", "sailed longboats and were brave explorers"],
  ["🏰", "the Middle Ages", "had knights, castles, and grand tales"],
];

// [question, answer, wrongs]
const FACTS: Array<[string, string, string[]]> = [
  ["Egyptian kings and queens were called…", "pharaohs", ["presidents", "captains", "wizards"]],
  ["A wrapped-up, preserved Egyptian body is a…", "mummy", ["robot", "statue", "scarecrow"]],
  ["Knights wore metal suits called…", "armor", ["pajamas", "raincoats", "costumes"]],
  ["The Great Wall was built in…", "China", ["Egypt", "Rome", "Greece"]],
  ["People who dig up ancient treasures are…", "archaeologists", ["astronauts", "chefs", "pilots"]],
  ["Ancient Egyptians wrote with picture symbols called…", "hieroglyphs", ["emojis", "numbers", "music notes"]],
  ["A king or queen's home with high towers is a…", "castle", ["tent", "cottage", "boat"]],
  ["The first Olympic Games were held in ancient…", "Greece", ["China", "Egypt", "Rome"]],
];

export interface AncientParams {
  types: Array<"civ" | "fact">;
}

let qid = 0;
const id = () => `aw${++qid}`;

export function generateAncient(params: AncientParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "fact") {
    const [p, a, w] = pick(rng, FACTS);
    return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Travel back in time in your mind.", inputMode: "choices", dedupeKey: `fact-${p}` };
  }
  const [emoji, name, clue] = pick(rng, CIVS);
  const wrong = shuffle(rng, CIVS.filter((c) => c[1] !== name)).slice(0, 3);
  return { id: id(), prompt: `Which ancient people ${clue}?`, answer: `${emoji} ${name}`, choices: shuffle(rng, [`${emoji} ${name}`, ...wrong.map(([e, n]) => `${e} ${n}`)]), hint: "Think about long, long ago.", inputMode: "choices", dedupeKey: `civ-${name}` };
}
