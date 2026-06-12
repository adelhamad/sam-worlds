// Tinker Lab — first physics, all intuition and pictures: sink or float,
// magnets, push or pull, everyday forces, gravity, light & shadow.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, name, floats?]
const WATER: Array<[string, string, boolean]> = [
  ["🪨", "rock", false], ["🪵", "log", true], ["🍎", "apple", true], ["🔑", "key", false],
  ["🎈", "balloon", true], ["⚓", "anchor", false], ["🍃", "leaf", true], ["🥄", "metal spoon", false],
  ["🏀", "basketball", true], ["🪙", "coin", false], ["🧊", "ice cube", true], ["🐤", "rubber duck", true],
  ["🍴", "fork", false], ["🍂", "dry leaf", true], ["🔨", "hammer", false], ["🛟", "swim ring", true],
];

// [emoji, name, magnetic?]
const MAGNET: Array<[string, string, boolean]> = [
  ["📎", "paper clip", true], ["🔩", "iron bolt", true], ["🗝️", "iron key", true], ["⛓️", "steel chain", true],
  ["🥫", "tin can", true], ["✂️", "steel scissors", true], ["🪛", "screwdriver tip", true],
  ["🪵", "wood block", false], ["🧸", "teddy bear", false], ["📄", "paper sheet", false],
  ["🥤", "plastic cup", false], ["🧦", "sock", false], ["🍎", "apple", false], ["🎈", "balloon", false],
];

// [scenario, push or pull]
const FORCES: Array<[string, "PUSH" | "PULL"]> = [
  ["Get the wagon rolling behind you", "PULL"],
  ["Make the swing fly higher", "PUSH"],
  ["Open a drawer", "PULL"],
  ["Close a drawer", "PUSH"],
  ["Sled up the hill with a rope", "PULL"],
  ["Move a shopping cart", "PUSH"],
  ["Take a tissue out of the box", "PULL"],
  ["Ring a doorbell", "PUSH"],
  ["Get a stuck carrot 🥕 out of the ground", "PULL"],
  ["Pop bubble wrap", "PUSH"],
  ["Raise the flag up the pole with a rope", "PULL"],
  ["Slide a book across the table", "PUSH"],
];

// [question, [winner emoji+name, loser emoji+name], teaching hint]
const COMPARE: Array<[string, [string, string], string]> = [
  ["Which one floats down sloooowly?", ["🪶 feather", "🪨 rock"], "Light and wide things catch the air."],
  ["Which is easier to slide on?", ["❄️ ice", "🟩 grass"], "Smooth things are slippery."],
  ["Which one rolls away?", ["⚽ ball", "📦 box"], "Round things roll, flat things sit."],
  ["Which one bounces back up?", ["🏀 basketball", "🪨 rock"], "Squishy things spring back."],
  ["Which can the wind blow away?", ["🍂 leaf", "🧱 brick"], "Wind moves light things."],
  ["Which makes the BIGGER splash?", ["🪨 big rock", "🍒 cherry"], "Heavy things push more water."],
  ["Which is harder to push?", ["🐘 elephant", "🐭 mouse"], "Heavy things need a bigger push."],
  ["Which one stretches?", ["🎈 balloon", "🥄 spoon"], "Rubber stretches, metal doesn't."],
  ["Which stops rolling first, on carpet or tiles?", ["🟫 on carpet", "⬜ on tiles"], "Rough carpet grabs the ball."],
  ["Which warms up in the sun faster?", ["⬛ black shirt", "⬜ white shirt"], "Dark colors drink in sunlight."],
];

// [question, answer, wrongs]
const GRAVITY: Array<[string, string, string[]]> = [
  ["You drop your spoon. Where does it go?", "down to the floor", ["up to the ceiling", "it stays in the air", "sideways"]],
  ["Throw a ball straight up. What happens next?", "it comes back down", ["it flies to space", "it stays up there", "it gets bigger"]],
  ["What pulls everything down to the ground?", "gravity", ["the wind", "magnets", "electricity"]],
  ["Rain always falls…", "down from the clouds", ["up to the sky", "sideways only", "in circles"]],
  ["A river flows…", "downhill", ["uphill", "straight up", "nowhere"]],
  ["On the Moon, gravity is weaker — so you could jump…", "much higher", ["not at all", "lower", "the same"]],
];

const LIGHT: Array<[string, string, string[]]> = [
  ["What makes a shadow?", "something blocking the light", ["cold air", "loud sounds", "water"]],
  ["The sun is in FRONT of you. Your shadow is…", "behind you", ["in front of you", "above you", "gone"]],
  ["To see a shadow you always need…", "light", ["rain", "wind", "music"]],
  ["Turn off every light in a dark room. Shadows…", "disappear", ["get darker", "glow", "multiply"]],
  ["Which one lets light pass through?", "🪟 glass window", ["🧱 brick wall", "🪵 wooden door", "📕 thick book"]],
  ["At noon the sun is highest — your shadow is…", "short", ["very long", "behind a tree", "blue"]],
];

export interface PhysicsParams {
  types: Array<"float" | "magnet" | "force" | "compare" | "gravity" | "light">;
}

let qid = 0;
const id = () => `ph${++qid}`;

export function generatePhysics(params: PhysicsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "magnet":
      return genMagnet(rng);
    case "force":
      return genForce(rng);
    case "compare":
      return genCompare(rng);
    case "gravity":
      return genFact(rng, GRAVITY, "grav", "Think about dropping it yourself!");
    case "light":
      return genFact(rng, LIGHT, "light", "Picture the light shining.");
    default:
      return genFloat(rng);
  }
}

function genFloat(rng: RNG): Question {
  const [emoji, name, floats] = pick(rng, WATER);
  return {
    id: id(),
    prompt: `Drop the ${name} in water — what happens?`,
    answer: floats ? "🛟 it floats" : "⬇️ it sinks",
    choices: shuffle(rng, ["🛟 it floats", "⬇️ it sinks"]),
    hint: "Heavy-for-its-size sinks. Light-for-its-size floats.",
    inputMode: "choices",
    dedupeKey: `float-${name}`,
    payload: { bigSymbol: emoji },
  };
}

function genMagnet(rng: RNG): Question {
  const [emoji, name, sticks] = pick(rng, MAGNET);
  return {
    id: id(),
    prompt: `Will the magnet 🧲 grab the ${name}?`,
    answer: sticks ? "🧲 yes, it sticks!" : "🙅 no, nothing happens",
    choices: shuffle(rng, ["🧲 yes, it sticks!", "🙅 no, nothing happens"]),
    hint: "Magnets only grab iron and steel.",
    inputMode: "choices",
    dedupeKey: `mag-${name}`,
    payload: { bigSymbol: emoji },
  };
}

function genForce(rng: RNG): Question {
  const [scenario, answer] = pick(rng, FORCES);
  return {
    id: id(),
    prompt: `${scenario} — push or pull?`,
    answer: answer === "PUSH" ? "🫸 PUSH" : "🪢 PULL",
    choices: shuffle(rng, ["🫸 PUSH", "🪢 PULL"]),
    hint: "Push moves it away from you. Pull brings it closer.",
    inputMode: "choices",
    dedupeKey: `force-${scenario}`,
  };
}

function genCompare(rng: RNG): Question {
  const [prompt, [winner, loser], hint] = pick(rng, COMPARE);
  return {
    id: id(),
    prompt,
    answer: winner,
    choices: shuffle(rng, [winner, loser]),
    hint,
    inputMode: "choices",
    dedupeKey: `cmp-${prompt}`,
    payload: { bigChoices: true },
  };
}

function genFact(rng: RNG, pool: Array<[string, string, string[]]>, key: string, hint: string): Question {
  const [prompt, answer, wrong] = pick(rng, pool);
  return {
    id: id(),
    prompt,
    answer,
    choices: shuffle(rng, [answer, ...wrong]),
    hint,
    inputMode: "choices",
    dedupeKey: `${key}-${prompt}`,
  };
}
