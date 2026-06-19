// How It Works — simple machines and everyday inventions, and what each one is
// for. A gentle first look at how things make our lives easier.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, machine, what it does]
const MACHINES: Array<[string, string, string]> = [
  ["🎡", "wheel", "rolls things along so they move easily"],
  ["⚖️", "lever", "lifts a heavy load with less effort"],
  ["🛝", "ramp", "helps move things up a gentle slope"],
  ["🪛", "screw", "holds things together by twisting in"],
  ["✂️", "wedge", "splits or cuts things apart"],
  ["🪣", "pulley", "lifts a load up with a rope and wheel"],
];

// [machine, a real example, wrongs]
const EXAMPLE: Array<[string, string, string[]]> = [
  ["Which simple machine is a seesaw?", "a lever", ["a wheel", "a ramp", "a screw"]],
  ["A slide at the park is an example of a…", "ramp", ["lever", "pulley", "screw"]],
  ["Which simple machine helps a flag go up a pole?", "a pulley", ["a wedge", "a wheel", "a ramp"]],
  ["The blade of an axe that splits wood is a…", "wedge", ["wheel", "pulley", "lever"]],
  ["Roller skates roll because of their…", "wheels", ["screws", "levers", "ramps"]],
];

// [emoji, invention, what it's for]
const INVENTIONS: Array<[string, string, string]> = [
  ["💡", "the light bulb", "gives us light in the dark"],
  ["📞", "the telephone", "lets us talk to people far away"],
  ["⏰", "the clock", "tells us what time it is"],
  ["🧊", "the fridge", "keeps our food cold and fresh"],
  ["📷", "the camera", "takes pictures to remember things"],
  ["✈️", "the airplane", "lets people fly across the world"],
  ["🚲", "the bicycle", "lets us travel using our own legs"],
  ["📚", "the book", "stores stories and knowledge to read"],
];

export interface MachinesParams {
  types: Array<"machine" | "example" | "invention">;
}

let qid = 0;
const id = () => `mc${++qid}`;

export function generateMachines(params: MachinesParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "example") {
    const [p, a, w] = pick(rng, EXAMPLE);
    return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Think about how it helps you do work.", inputMode: "choices", dedupeKey: `example-${p}` };
  }
  if (type === "invention") {
    const [emoji, thing, use] = pick(rng, INVENTIONS);
    const wrong = shuffle(rng, INVENTIONS.filter((i) => i[2] !== use)).slice(0, 3);
    return { id: id(), prompt: `What is ${thing} for?`, answer: use, choices: shuffle(rng, [use, ...wrong.map(([, , u]) => u)]), hint: "Think about how people use it every day.", inputMode: "choices", dedupeKey: `invention-${thing}`, payload: { bigSymbol: emoji } };
  }
  const [emoji, machine, does] = pick(rng, MACHINES);
  const wrong = shuffle(rng, MACHINES.filter((m) => m[2] !== does)).slice(0, 3);
  return {
    id: id(),
    prompt: `What does a ${machine} do?`,
    answer: does,
    choices: shuffle(rng, [does, ...wrong.map(([, , d]) => d)]),
    hint: "Simple machines make hard work easier.",
    inputMode: "choices",
    dedupeKey: `machine-${machine}`,
    payload: { bigSymbol: emoji },
  };
}
