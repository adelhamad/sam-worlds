// Data Detectives — reading simple charts: counting a pictograph, finding the
// most/fewest, and counting tally marks.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// emoji "things" we make little charts out of [emoji, plural name]
const THINGS: Array<[string, string]> = [
  ["🍎", "apples"], ["🍌", "bananas"], ["⭐", "stars"], ["🐶", "dogs"], ["🚗", "cars"],
  ["🌸", "flowers"], ["🐟", "fish"], ["🎈", "balloons"], ["🍪", "cookies"], ["🦋", "butterflies"],
];

let qid = 0;
const id = () => `dt${++qid}`;
const repeat = (emoji: string, n: number) => emoji.repeat(n);

function tally(n: number): string {
  const fives = "卌 ".repeat(Math.floor(n / 5));
  const ones = "| ".repeat(n % 5);
  return (fives + ones).trim();
}

function genCount(rng: RNG): Question {
  const [emoji, name] = pick(rng, THINGS);
  const n = 2 + Math.floor(rng() * 7);
  return {
    id: id(),
    prompt: `Count the chart. How many ${name} are there?`,
    answer: String(n),
    choices: [],
    hint: "Count each picture one by one.",
    dedupeKey: `count-${name}-${n}`,
    payload: { listRows: [`${name}:  ${repeat(emoji, n)}`] },
  };
}

function genMost(rng: RNG, most: boolean): Question {
  const picks = shuffle(rng, THINGS).slice(0, 3);
  const counts = new Set<number>();
  while (counts.size < 3) counts.add(2 + Math.floor(rng() * 7));
  const nums = [...counts];
  const rows = picks.map(([e, n], i) => ({ label: `${e} ${n}`, count: nums[i], line: `${e} ${n}:  ${repeat(e, nums[i])}` }));
  const target = most
    ? rows.reduce((a, b) => (b.count > a.count ? b : a))
    : rows.reduce((a, b) => (b.count < a.count ? b : a));
  return {
    id: id(),
    prompt: `Look at the chart. Which has the ${most ? "MOST" : "FEWEST"}?`,
    answer: target.label,
    choices: shuffle(rng, rows.map((r) => r.label)),
    hint: most ? "The longest row has the most." : "The shortest row has the fewest.",
    inputMode: "choices",
    dedupeKey: `most-${most}-${rows.map((r) => r.count).join("-")}`,
    payload: { listRows: rows.map((r) => r.line) },
  };
}

function genTally(rng: RNG): Question {
  const n = 3 + Math.floor(rng() * 10);
  return {
    id: id(),
    prompt: "Count the tally marks. How many?",
    answer: String(n),
    choices: [],
    hint: "Each ‘卌’ is a bundle of 5.",
    dedupeKey: `tally-${n}`,
    payload: { listRows: [tally(n)] },
  };
}

export interface DataParams {
  types: Array<"count" | "most" | "fewest" | "tally">;
}

export function generateData(params: DataParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "most") return genMost(rng, true);
  if (type === "fewest") return genMost(rng, false);
  if (type === "tally") return genTally(rng);
  return genCount(rng);
}
