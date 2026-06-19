// Then & Now — how life has changed: old ways vs modern ways, and past /
// present / future. A first taste of history.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [task, what people used LONG AGO, what we use NOW]
const TASKS: Array<[string, string, string]> = [
  ["to light a dark room", "a candle", "an electric light"],
  ["to travel far", "a horse and cart", "a car"],
  ["to wash clothes", "scrubbing by hand", "a washing machine"],
  ["to keep food cold", "a box packed with ice", "a fridge"],
  ["to send a message far away", "a letter by post", "a mobile phone"],
  ["to write a story", "a feather quill pen", "a computer keyboard"],
  ["to listen to music", "a wind-up record player", "a smartphone"],
  ["to find the way", "a paper map", "a GPS screen"],
];

// [question, answer, wrongs] — past / present vocabulary
const CONCEPT: Array<[string, string, string[]]> = [
  ["Things that already happened are in the…", "past", ["future", "present", "middle"]],
  ["What is happening right now is the…", "present", ["past", "future", "yesterday"]],
  ["What has not happened yet is the…", "future", ["past", "present", "long ago"]],
  ["Very old objects kept in a museum are from…", "long ago", ["tomorrow", "next year", "the future"]],
  ["Your grandparents were children…", "a long time ago", ["next week", "tomorrow", "today"]],
];

export interface ThenNowParams {
  types: Array<"old" | "new" | "concept">;
}

let qid = 0;
const id = () => `tn${++qid}`;

export function generateThenNow(params: ThenNowParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "concept") {
    const [p, a, w] = pick(rng, CONCEPT);
    return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Past = before, present = now, future = later.", inputMode: "choices", dedupeKey: `concept-${p}` };
  }
  const [task, old, modern] = pick(rng, TASKS);
  if (type === "new") {
    const wrong = shuffle(rng, TASKS.map((t) => t[1]).filter((x) => x !== modern)).slice(0, 3);
    return { id: id(), prompt: `Today, what do we use ${task}?`, answer: modern, choices: shuffle(rng, [modern, ...wrong]), hint: "Pick the modern thing we use now.", inputMode: "choices", dedupeKey: `new-${task}` };
  }
  const wrong = shuffle(rng, TASKS.map((t) => t[2]).filter((x) => x !== old)).slice(0, 3);
  return { id: id(), prompt: `Long ago, what did people use ${task}?`, answer: old, choices: shuffle(rng, [old, ...wrong]), hint: "Pick the old-fashioned way.", inputMode: "choices", dedupeKey: `old-${task}` };
}
