// Garden Grow — how plants grow: their parts, what they need, the life cycle,
// and sorting fruits from vegetables.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [part, what it does]
const PARTS: Array<[string, string]> = [
  ["roots", "drink water from the soil"],
  ["stem", "holds the plant up tall"],
  ["leaves", "catch sunlight to make food"],
  ["flower", "makes new seeds"],
  ["seed", "grows into a brand new plant"],
];

// what plants need (good vs silly)
const NEEDS: Array<[string, string[]]> = [
  ["☀️ sunlight", ["📺 television", "🍬 candy", "🎮 toys"]],
  ["💧 water", ["🥤 soda", "🍪 cookies", "🔋 batteries"]],
  ["🌱 soil to grow in", ["📱 a phone", "👟 shoes", "🎈 balloons"]],
  ["🌬️ fresh air", ["🍔 burgers", "💰 money", "📚 homework"]],
];

// [emoji, food, fruit|vegetable]
const SORT: Array<[string, string, string]> = [
  ["🍎", "apple", "fruit"], ["🍌", "banana", "fruit"], ["🍓", "strawberry", "fruit"],
  ["🍊", "orange", "fruit"], ["🍇", "grapes", "fruit"], ["🍉", "watermelon", "fruit"],
  ["🥕", "carrot", "vegetable"], ["🥦", "broccoli", "vegetable"], ["🥔", "potato", "vegetable"],
  ["🧅", "onion", "vegetable"], ["🥬", "lettuce", "vegetable"], ["🌽", "corn", "vegetable"],
];

// life-cycle ordering
const CYCLES: Array<[string, string[]]> = [
  ["A plant grows:", ["🌰 seed", "🌱 sprout", "🌿 small plant", "🌻 flower"]],
  ["From seed to snack:", ["🌱 plant a seed", "💧 water it", "🍅 fruit grows"]],
];

export interface GardenParams {
  types: Array<"part" | "need" | "sort" | "cycle">;
}

let qid = 0;
const id = () => `gd${++qid}`;

export function generateGarden(params: GardenParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "need") {
    const [good, bad] = pick(rng, NEEDS);
    return { id: id(), prompt: "Which of these does a plant need to grow?", answer: good, choices: shuffle(rng, [good, ...bad]), hint: "Plants need sun, water, air and soil.", inputMode: "choices", dedupeKey: `need-${good}` };
  }
  if (type === "sort") {
    const [emoji, food, kind] = pick(rng, SORT);
    return { id: id(), prompt: `Is a ${food} a fruit or a vegetable?`, answer: kind, choices: shuffle(rng, ["fruit", "vegetable"]), hint: "Fruits usually have seeds and taste sweet.", inputMode: "choices", dedupeKey: `sort-${food}`, payload: { bigSymbol: emoji } };
  }
  if (type === "cycle") {
    const [title, seq] = pick(rng, CYCLES);
    return { id: id(), prompt: `${title} Put it in order!`, answer: seq.join(" → "), choices: [], hint: `It starts with ${seq[0]}.`, inputMode: "order", dedupeKey: `cycle-${title}`, payload: { items: shuffle(rng, seq), arrow: "→" } };
  }
  const [part, job] = pick(rng, PARTS);
  const askJob = rng() < 0.5;
  if (askJob) {
    const wrong = shuffle(rng, PARTS.filter((p) => p[0] !== part)).slice(0, 3);
    return { id: id(), prompt: `Which plant part ${job}?`, answer: part, choices: shuffle(rng, [part, ...wrong.map(([p]) => p)]), hint: "Picture a plant from roots to flower.", inputMode: "choices", dedupeKey: `partWhich-${part}` };
  }
  const wrong = shuffle(rng, PARTS.filter((p) => p[1] !== job)).slice(0, 3);
  return { id: id(), prompt: `What do the ${part} do?`, answer: job, choices: shuffle(rng, [job, ...wrong.map(([, j]) => j)]), hint: "Think about that part's job.", inputMode: "choices", dedupeKey: `partJob-${part}` };
}
