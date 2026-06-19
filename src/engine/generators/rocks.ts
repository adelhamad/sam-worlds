// Rock Lab — rocks, minerals, gems, volcanoes and the Earth (geology for kids).
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, name, clue]
const GEMS: Array<[string, string, string]> = [
  ["💎", "a diamond", "is the hardest, sparkliest gem of all"],
  ["⚫", "coal", "is a black rock we can burn for heat"],
  ["🧂", "salt", "is a mineral we sprinkle on food"],
  ["🟡", "gold", "is a shiny yellow metal"],
  ["🪨", "a boulder", "is a really, really big rock"],
  ["🔶", "amber", "is fossilized tree sap, golden and clear"],
  ["💠", "a crystal", "has flat, shiny, see-through sides"],
  ["🟤", "clay", "is soft, sticky earth we shape into pots"],
];

// [question, answer, wrongs] — volcanoes
const VOLCANO: Array<[string, string, string[]]> = [
  ["Melted rock that flows out of a volcano is called…", "lava", ["water", "mud", "snow"]],
  ["Hot melted rock deep inside the Earth is called…", "magma", ["ice", "sand", "air"]],
  ["When a volcano bursts open, we say it…", "erupts", ["sleeps", "melts", "freezes"]],
  ["A volcano can puff out clouds of grey…", "ash and smoke", ["snow", "rain", "leaves"]],
];

// [question, answer, wrongs] — earth & rocks
const FACTS: Array<[string, string, string[]]> = [
  ["The hard outer layer of the Earth is the…", "crust", ["core", "sky", "cloud"]],
  ["The super-hot center of the Earth is the…", "core", ["crust", "roof", "shell"]],
  ["When rocks break into tiny bits over time, they become…", "sand", ["water", "gold", "glass"]],
  ["Shiny, useful things we dig out of the ground are…", "minerals", ["clouds", "plants", "bubbles"]],
  ["A small rock made smooth by a river is a…", "pebble", ["boulder", "mountain", "cave"]],
  ["People dig deep underground in a…", "mine", ["pool", "garden", "library"]],
];

export interface RocksParams {
  types: Array<"gem" | "volcano" | "fact">;
}

let qid = 0;
const id = () => `rk${++qid}`;

export function generateRocks(params: RocksParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "volcano") {
    const [p, a, w] = pick(rng, VOLCANO);
    return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Think about a fiery volcano.", inputMode: "choices", dedupeKey: `volcano-${p}` };
  }
  if (type === "fact") {
    const [p, a, w] = pick(rng, FACTS);
    return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Think about rocks and the Earth.", inputMode: "choices", dedupeKey: `fact-${p}` };
  }
  const [emoji, name, clue] = pick(rng, GEMS);
  const wrong = shuffle(rng, GEMS.filter((g) => g[1] !== name)).slice(0, 3);
  return { id: id(), prompt: `Which one ${clue}?`, answer: `${emoji} ${name}`, choices: shuffle(rng, [`${emoji} ${name}`, ...wrong.map(([e, n]) => `${e} ${n}`)]), hint: "Picture the shiny rock or mineral.", inputMode: "choices", dedupeKey: `gem-${name}` };
}
