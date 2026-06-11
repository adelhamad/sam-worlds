// Explorer's Atlas — space, geography, art & history from content pools.
// Ordering is constructed; landmark/continent questions are true matching.
import { pick, randInt, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

export interface AtlasParams {
  types: Array<"planets" | "landmark" | "color" | "timeline" | "continent">;
}

const PLANETS = ["☀️ Sun", "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];

const LANDMARKS: Array<[string, string]> = [
  ["🗼 Eiffel Tower", "France"], ["🗽 Statue of Liberty", "USA"], ["🐫 Great Pyramids", "Egypt"],
  ["🏯 Himeji Castle", "Japan"], ["🗿 Moai statues", "Easter Island"], ["🏛️ Parthenon", "Greece"],
  ["🧱 Great Wall", "China"], ["🎡 London Eye", "England"], ["⛪ Sagrada Família", "Spain"],
];
const COUNTRIES = [...new Set(LANDMARKS.map(([, c]) => c))];

const COLOR_MIXES: Array<[string, string]> = [
  ["purple 🟣", "🔴 red + 🔵 blue"], ["green 🟢", "🔵 blue + 🟡 yellow"],
  ["orange 🟠", "🔴 red + 🟡 yellow"], ["pink 🩷", "🔴 red + ⚪ white"],
  ["brown 🟤", "🔴 red + 🟢 green"], ["sky blue 🩵", "🔵 blue + ⚪ white"],
];
const MIX_OPTIONS = [...new Set(COLOR_MIXES.map(([, m]) => m))];

const TIMELINE = ["🛞 wheel", "📜 paper", "🖨️ printing press", "🚂 steam train", "💡 light bulb", "✈️ airplane", "🚀 space rocket", "💻 computer"];

const CONTINENT_ANIMALS: Array<[string, string]> = [
  ["🦘 kangaroo", "Australia"], ["🐼 panda", "Asia"], ["🦁 lion", "Africa"],
  ["🦬 bison", "North America"], ["🦙 llama", "South America"], ["🐺 wolf", "Europe"],
  ["🐧 emperor penguin", "Antarctica"],
];
const CONTINENTS = [...new Set(CONTINENT_ANIMALS.map(([, c]) => c))];

let qid = 0;
const id = () => `ea${++qid}`;

export function generateAtlas(params: AtlasParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "landmark":
      return matching(rng, LANDMARKS, COUNTRIES, (l) => `Where is the ${l}?`, "Picture the postcard!");
    case "continent":
      return matching(rng, CONTINENT_ANIMALS, CONTINENTS, (a) => `Which continent is home to the ${a}?`, "Think of the maps in the codex.");
    case "color":
      return matching(rng, COLOR_MIXES, MIX_OPTIONS, (c) => `Which mix makes ${c}?`, "Start from the primary colors.");
    case "timeline":
      return order(rng, ctx, TIMELINE, "Oldest first — order the inventions!", true);
    default:
      return order(rng, ctx, PLANETS, "Order from the Sun!", false);
  }
}

function order(rng: RNG, ctx: GenContext, pool: string[], prompt: string, anySlice: boolean): Question {
  const count = ctx.easier ? 3 : 4;
  const start = anySlice ? randInt(rng, 0, pool.length - count) : randInt(rng, 0, Math.min(2, pool.length - count));
  const seq = pool.slice(start, start + count);
  return {
    id: id(),
    prompt,
    answer: seq.join(" → "),
    choices: [],
    hint: `${seq[0]} comes first.`,
    inputMode: "order",
    dedupeKey: `seq-${seq.join("")}`,
    payload: { items: shuffle(rng, seq), arrow: "→" },
  };
}

function matching(
  rng: RNG,
  pairs: Array<[string, string]>,
  allAnswers: string[],
  promptFor: (subject: string) => string,
  hint: string,
): Question {
  const [subject, answer] = pick(rng, pairs);
  const wrong = shuffle(rng, allAnswers.filter((a) => a !== answer)).slice(0, 3);
  return {
    id: id(),
    prompt: promptFor(subject),
    answer,
    choices: shuffle(rng, [answer, ...wrong]),
    hint,
    inputMode: "choices",
  };
}
