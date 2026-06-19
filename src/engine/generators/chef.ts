// Little Chef — the kitchen: tastes, cooking tools, and putting recipe steps in
// order. (Distinct from Healthy Plate, which is about food groups.)
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, food, taste]
const TASTE: Array<[string, string, string]> = [
  ["🍋", "a lemon", "sour"], ["🥒", "a pickle", "sour"], ["🍬", "candy", "sweet"],
  ["🍫", "chocolate", "sweet"], ["🍯", "honey", "sweet"], ["🧂", "salty chips", "salty"],
  ["🍿", "popcorn", "salty"], ["🌶️", "a chili pepper", "spicy"], ["☕", "black coffee", "bitter"],
];

// [emoji, tool, what it's for]
const TOOLS: Array<[string, string, string]> = [
  ["🔪", "knife", "cutting food"], ["🥄", "spoon", "stirring and scooping"], ["🍴", "fork", "picking up food"],
  ["🥣", "bowl", "mixing food in"], ["🍳", "frying pan", "frying eggs"], ["🫕", "pot", "boiling soup"],
  ["⏲️", "timer", "counting the cooking minutes"], ["🧊", "fridge", "keeping food cold"], ["🧤", "oven mitt", "holding hot dishes safely"],
];

// recipe ordering
const STEPS: Array<[string, string[]]> = [
  ["Making a cake:", ["🥚 crack the eggs", "🥣 mix the batter", "🔥 bake it", "🎂 eat it"]],
  ["Making a sandwich:", ["🍞 get two slices of bread", "🧈 add the filling", "🥪 put them together"]],
  ["Making toast:", ["🍞 take a slice of bread", "🔥 toast it", "🧈 spread butter"]],
  ["Boiling pasta:", ["💧 boil the water", "🍝 add the pasta", "🍽️ serve it up"]],
];

export interface ChefParams {
  types: Array<"taste" | "tool" | "step">;
}

let qid = 0;
const id = () => `cf${++qid}`;

export function generateChef(params: ChefParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "tool") {
    const [emoji, tool, use] = pick(rng, TOOLS);
    const wrong = shuffle(rng, TOOLS.filter((t) => t[2] !== use)).slice(0, 3);
    return { id: id(), prompt: `Which kitchen tool is for ${use}?`, answer: `${emoji} ${tool}`, choices: shuffle(rng, [`${emoji} ${tool}`, ...wrong.map(([e, n]) => `${e} ${n}`)]), hint: "Picture using it in the kitchen.", inputMode: "choices", dedupeKey: `tool-${tool}` };
  }
  if (type === "step") {
    const [title, seq] = pick(rng, STEPS);
    return { id: id(), prompt: `${title} Put it in order!`, answer: seq.join(" → "), choices: [], hint: `It starts with ${seq[0]}.`, inputMode: "order", dedupeKey: `step-${title}`, payload: { items: shuffle(rng, seq), arrow: "→" } };
  }
  const [emoji, food, taste] = pick(rng, TASTE);
  const allTastes = ["sweet", "sour", "salty", "spicy", "bitter"];
  const wrong = shuffle(rng, allTastes.filter((t) => t !== taste)).slice(0, 3);
  return {
    id: id(),
    prompt: `How does ${food} taste?`,
    answer: taste,
    choices: shuffle(rng, [taste, ...wrong]),
    hint: "Sweet, sour, salty, spicy or bitter?",
    inputMode: "choices",
    dedupeKey: `taste-${food}`,
    payload: { bigSymbol: emoji },
  };
}
