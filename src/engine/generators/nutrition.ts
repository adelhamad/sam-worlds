// Healthy Plate — food groups, where food comes from, and what foods do for
// your body. (Distinct from Body Explorer's healthy-habits questions.)
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, food, food group]
const GROUPS: Array<[string, string, string]> = [
  ["🍎", "apple", "fruit"], ["🍌", "banana", "fruit"], ["🍓", "strawberry", "fruit"],
  ["🥕", "carrot", "vegetable"], ["🥦", "broccoli", "vegetable"], ["🥬", "spinach", "vegetable"],
  ["🍞", "bread", "grains"], ["🍚", "rice", "grains"], ["🍝", "pasta", "grains"],
  ["🍗", "chicken", "protein"], ["🥚", "egg", "protein"], ["🐟", "fish", "protein"],
  ["🥛", "milk", "dairy"], ["🧀", "cheese", "dairy"], ["🥣", "yogurt", "dairy"],
];

// [emoji, food, where it comes from]
const SOURCE: Array<[string, string, string]> = [
  ["🥛", "Milk", "comes from cows"],
  ["🍯", "Honey", "is made by bees"],
  ["🥚", "Eggs", "come from hens"],
  ["🍞", "Bread", "is made from wheat"],
  ["🧀", "Cheese", "is made from milk"],
  ["🍎", "Apples", "grow on trees"],
  ["🥕", "Carrots", "grow under the ground"],
  ["🍚", "Rice", "grows in flooded fields"],
  ["🍫", "Chocolate", "is made from cocoa beans"],
  ["🍟", "Potatoes", "grow under the ground"],
];

// [question, answer, wrongs] — what foods do for you
const FUNCTION: Array<[string, string, string[]]> = [
  ["Which food group helps build strong bones?", "dairy (like milk)", ["candy", "soda", "chips"]],
  ["Which food group gives you quick energy?", "grains (like bread)", ["lollipops", "ice cream", "cake"]],
  ["Which food group helps you grow muscles?", "protein (like eggs)", ["gummy bears", "cookies", "fizzy drinks"]],
  ["Which foods are packed with vitamins?", "fruits and vegetables", ["donuts", "candy", "crisps"]],
  ["The most important drink for your body is…", "water", ["soda", "milkshake", "energy drink"]],
  ["A healthy plate has lots of…", "colorful fruits and veggies", ["only candy", "only chips", "only cake"]],
];

export interface NutritionParams {
  types: Array<"group" | "source" | "function">;
}

let qid = 0;
const id = () => `nu${++qid}`;

export function generateNutrition(params: NutritionParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "source") {
    const [emoji, food, src] = pick(rng, SOURCE);
    const wrong = shuffle(rng, SOURCE.filter((s) => s[2] !== src)).slice(0, 3);
    return { id: id(), prompt: `Where does food come from?  ${food} …`, answer: src, choices: shuffle(rng, [src, ...wrong.map(([, , s]) => s)]), hint: "Think about farms and animals.", inputMode: "choices", dedupeKey: `source-${food}`, payload: { bigSymbol: emoji } };
  }
  if (type === "function") {
    const [p, a, w] = pick(rng, FUNCTION);
    return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Healthy foods help your body in different ways.", inputMode: "choices", dedupeKey: `func-${p}` };
  }
  const [emoji, food, group] = pick(rng, GROUPS);
  const groupNames = [...new Set(GROUPS.map((g) => g[2]))];
  const wrong = shuffle(rng, groupNames.filter((g) => g !== group)).slice(0, 3);
  return { id: id(), prompt: `Which food group is ${food} in?`, answer: group, choices: shuffle(rng, [group, ...wrong]), hint: "Fruit, vegetable, grains, protein or dairy?", inputMode: "choices", dedupeKey: `group-${food}`, payload: { bigSymbol: emoji } };
}
