// Around the World — greetings in other languages, famous landmarks, and
// continents. A friendly first taste of world cultures and geography.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [greeting word, language]
const GREETINGS: Array<[string, string]> = [
  ["Bonjour", "French"],
  ["Hola", "Spanish"],
  ["Ciao", "Italian"],
  ["Konnichiwa", "Japanese"],
  ["Ni hao", "Chinese"],
  ["Namaste", "Hindi"],
  ["Marhaba", "Arabic"],
  ["Hallo", "German"],
];

// [emoji, landmark, country]
const LANDMARKS: Array<[string, string, string]> = [
  ["🗼", "the Eiffel Tower", "France"],
  ["🗽", "the Statue of Liberty", "the USA"],
  ["🔺", "the Great Pyramids", "Egypt"],
  ["🧱", "the Great Wall", "China"],
  ["🕌", "the Taj Mahal", "India"],
  ["🕰️", "Big Ben", "England"],
  ["🏛️", "the Colosseum", "Italy"],
  ["🗿", "the Moai statues", "Chile"],
];

// [question, answer, wrongs] — continents & world facts
const FACTS: Array<[string, string, string[]]> = [
  ["Which is the biggest continent?", "Asia", ["Europe", "Antarctica", "Australia"]],
  ["Which continent is icy and the coldest?", "Antarctica", ["Africa", "Asia", "Europe"]],
  ["On which continent do lions and elephants roam wild?", "Africa", ["Europe", "Antarctica", "North America"]],
  ["The land all around us, with all its countries, is called…", "the world", ["the town", "the street", "the school"]],
  ["People in different countries often speak different…", "languages", ["colors", "numbers", "shapes"]],
  ["A round model of the Earth is called a…", "globe", ["ball", "clock", "plate"]],
];

const COUNT: Array<[string, number]> = [
  ["How many continents are there on Earth?", 7],
  ["How many oceans are there on Earth?", 5],
];

export interface CulturesParams {
  types: Array<"greeting" | "landmark" | "fact" | "count">;
}

let qid = 0;
const id = () => `cu${++qid}`;

export function generateCultures(params: CulturesParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "landmark") {
    const [emoji, mark, country] = pick(rng, LANDMARKS);
    const wrong = shuffle(rng, [...new Set(LANDMARKS.map((l) => l[2]))].filter((c) => c !== country)).slice(0, 3);
    return { id: id(), prompt: `Which country is ${mark} in?`, answer: country, choices: shuffle(rng, [country, ...wrong]), hint: "Picture this famous place.", inputMode: "choices", dedupeKey: `landmark-${mark}`, payload: { bigSymbol: emoji } };
  }
  if (type === "fact") {
    const [p, a, w] = pick(rng, FACTS);
    return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Think about our big, wide world.", inputMode: "choices", dedupeKey: `fact-${p}` };
  }
  if (type === "count") {
    const [p, n] = pick(rng, COUNT);
    return { id: id(), prompt: p, answer: String(n), choices: [], hint: "Think about a map of the world.", dedupeKey: `count-${p}` };
  }
  const [word, lang] = pick(rng, GREETINGS);
  const wrong = shuffle(rng, GREETINGS.filter((g) => g[1] !== lang)).slice(0, 3);
  return { id: id(), prompt: `“${word}” means hello in which language?`, answer: lang, choices: shuffle(rng, [lang, ...wrong.map(([, l]) => l)]), hint: "It's a way to say hello around the world.", inputMode: "choices", dedupeKey: `greeting-${word}` };
}
