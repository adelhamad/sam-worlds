// Color Lab — mixing colors, primary vs secondary, warm vs cool, and the
// colors of everyday things.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [colorA, colorB, result]
const MIX: Array<[string, string, string]> = [
  ["🔴 red", "🟡 yellow", "🟠 orange"],
  ["🔵 blue", "🟡 yellow", "🟢 green"],
  ["🔴 red", "🔵 blue", "🟣 purple"],
  ["⚪ white", "🔴 red", "🩷 pink"],
  ["⚫ black", "⚪ white", "⚪ grey"],
  ["🔵 blue", "⚪ white", "🩵 light blue"],
];
const MIX_WRONGS = ["🟤 brown", "🟢 green", "🟠 orange", "🟣 purple", "🩷 pink", "⚫ black"];

// [emoji, thing, color]
const OBJECTS: Array<[string, string, string]> = [
  ["🌿", "grass", "green"], ["☀️", "the sun", "yellow"], ["🌊", "the clear sky", "blue"],
  ["❄️", "snow", "white"], ["🍅", "a tomato", "red"], ["🍌", "a banana", "yellow"],
  ["🍆", "an eggplant", "purple"], ["🐻", "a brown bear", "brown"], ["🌙", "the night sky", "black"],
  ["🦩", "a flamingo", "pink"], ["🍊", "an orange", "orange"], ["🌱", "a leaf", "green"],
];

// [color, warm|cool]
const TEMP: Array<[string, string]> = [
  ["🔴 red", "warm"], ["🟠 orange", "warm"], ["🟡 yellow", "warm"],
  ["🔵 blue", "cool"], ["🟢 green", "cool"], ["🟣 purple", "cool"],
];

export interface ColorsParams {
  types: Array<"mix" | "object" | "temp">;
}

let qid = 0;
const id = () => `co${++qid}`;

export function generateColors(params: ColorsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "object") {
    const [emoji, thing, color] = pick(rng, OBJECTS);
    const wrong = shuffle(rng, [...new Set(OBJECTS.map((o) => o[2]))].filter((c) => c !== color)).slice(0, 3);
    return { id: id(), prompt: `What color is ${thing}?`, answer: color, choices: shuffle(rng, [color, ...wrong]), hint: "Picture it in your mind.", inputMode: "choices", dedupeKey: `object-${thing}`, payload: { bigSymbol: emoji } };
  }
  if (type === "temp") {
    const [color, warmcool] = pick(rng, TEMP);
    return { id: id(), prompt: `Is ${color} a warm or a cool color?`, answer: warmcool, choices: shuffle(rng, ["warm", "cool"]), hint: "Warm = fire & sun. Cool = water & sky.", inputMode: "choices", dedupeKey: `temp-${color}` };
  }
  const [a, b, result] = pick(rng, MIX);
  const wrong = shuffle(rng, MIX_WRONGS.filter((c) => c !== result)).slice(0, 3);
  return { id: id(), prompt: `Mix ${a} and ${b}. What color do you get?`, answer: result, choices: shuffle(rng, [result, ...wrong]), hint: "Imagine the paints swirling together.", inputMode: "choices", dedupeKey: `mix-${a}-${b}` };
}
