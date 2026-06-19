// Bug World — insects and minibeasts: who's who, the butterfly life cycle, and
// fun bug facts.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, bug, clue]
const BUGS: Array<[string, string, string]> = [
  ["🐝", "bee", "buzzes from flower to flower and makes honey"],
  ["🦋", "butterfly", "has big colorful wings and was once a caterpillar"],
  ["🐜", "ant", "is tiny and lives in a busy colony"],
  ["🕷️", "spider", "spins a silky web and has eight legs"],
  ["🐞", "ladybug", "is round and red with little black spots"],
  ["🦗", "grasshopper", "leaps far with strong back legs"],
  ["🐛", "caterpillar", "is wiggly and will turn into a butterfly"],
  ["🐌", "snail", "is slow and carries its shell"],
  ["🦟", "mosquito", "buzzes at night and gives itchy bites"],
  ["🪲", "beetle", "has a hard shiny shell on its back"],
  ["🦂", "scorpion", "has pincers and a stinging tail"],
  ["🪰", "fly", "buzzes around and rubs its tiny feet"],
];

// [question, answer, wrongs]
const FACTS: Array<[string, string, string[]]> = [
  ["A caterpillar turns into a…", "butterfly", ["bird", "bee", "frog"]],
  ["Which bug makes honey?", "a bee", ["a spider", "an ant", "a fly"]],
  ["A spider is NOT an insect because it has…", "eight legs", ["six legs", "wings", "a shell"]],
  ["Bees help flowers by carrying…", "pollen", ["water", "leaves", "sand"]],
  ["Most insects have how many legs?", "six legs", ["four legs", "eight legs", "ten legs"]],
  ["Ants are very strong and live together in a…", "colony", ["nest of twigs", "cave", "shell"]],
];

const COUNT: Array<[string, number]> = [
  ["How many legs does an insect have?", 6],
  ["How many legs does a spider have?", 8],
  ["How many wings does a butterfly have?", 4],
];

const CYCLE: Array<[string, string[]]> = [
  ["A butterfly grows:", ["🥚 egg", "🐛 caterpillar", "🟢 chrysalis", "🦋 butterfly"]],
];

export interface BugsParams {
  types: Array<"identify" | "fact" | "count" | "cycle">;
}

let qid = 0;
const id = () => `bg${++qid}`;

export function generateBugs(params: BugsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "fact") {
    const [p, a, w] = pick(rng, FACTS);
    return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Think about tiny crawling creatures.", inputMode: "choices", dedupeKey: `fact-${p}` };
  }
  if (type === "count") {
    const [p, n] = pick(rng, COUNT);
    return { id: id(), prompt: p, answer: String(n), choices: [], hint: "Picture the bug and count carefully.", dedupeKey: `count-${p}` };
  }
  if (type === "cycle") {
    const [title, seq] = pick(rng, CYCLE);
    return { id: id(), prompt: `${title} Put it in order!`, answer: seq.join(" → "), choices: [], hint: `It starts with ${seq[0]}.`, inputMode: "order", dedupeKey: `cycle-${title}`, payload: { items: shuffle(rng, seq), arrow: "→" } };
  }
  const [emoji, bug, clue] = pick(rng, BUGS);
  const wrong = shuffle(rng, BUGS.filter((b) => b[1] !== bug)).slice(0, 3);
  return {
    id: id(),
    prompt: `Which minibeast ${clue}?`,
    answer: `${emoji} ${bug}`,
    choices: shuffle(rng, [`${emoji} ${bug}`, ...wrong.map(([e, n]) => `${e} ${n}`)]),
    hint: "Picture the little creature.",
    inputMode: "choices",
    dedupeKey: `id-${bug}`,
  };
}
