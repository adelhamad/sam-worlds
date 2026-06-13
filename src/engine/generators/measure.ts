// Measure Up — Grade 1–2 measurement (US Common Core 1.MD / 2.MD): comparing and
// ordering lengths, measuring in length-units, how-much-longer differences,
// adding lengths, choosing & estimating with standard units (cm, inch, foot,
// meter), and reading a length off a ruler. Numbers are typed; "which is
// longer / which unit" are true matching questions.
import { pick, randInt, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

const THINGS = [
  { name: "snake", emoji: "🐍" },
  { name: "worm", emoji: "🐛" },
  { name: "pencil", emoji: "✏️" },
  { name: "carrot", emoji: "🥕" },
  { name: "ruler", emoji: "📏" },
  { name: "crayon", emoji: "🖍️" },
  { name: "rope", emoji: "🪢" },
  { name: "banana", emoji: "🍌" },
];
const UNITS = ["centimeters", "inches", "feet", "meters"];
const SHORT_UNITS = ["centimeters", "inches"];

export type MeasureType =
  | "compare" // "🐍 6 blocks, 🐛 4 blocks — which is longer?"
  | "difference" // "rope 8 cm, string 3 cm — how much longer?"
  | "addLength" // "4 cm + 5 cm end to end = ?"
  | "iterate" // "1 crayon = 5 clips. 2 crayons = ? clips"
  | "ruler" // "starts at 0, ends at 7 — how long?"
  | "unit" // "Which unit measures a short pencil?"
  | "estimate"; // "About how long is a door?"

export interface MeasureParams {
  types: MeasureType[];
  /** Biggest length value in play. */
  max?: number;
  /** Length unit word used in prompts. */
  unit?: string;
}

let qid = 0;
const id = () => `me${++qid}`;

export function generateMeasure(params: MeasureParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  const max = params.max ?? 12;
  const unit = params.unit ?? "cm";
  switch (type) {
    case "difference":
      return genDifference(rng, max, unit, ctx);
    case "addLength":
      return genAddLength(rng, max, unit);
    case "iterate":
      return genIterate(rng, ctx);
    case "ruler":
      return genRuler(rng, max, unit);
    case "unit":
      return genUnit(rng);
    case "estimate":
      return genEstimate(rng);
    default:
      return genCompare(rng, max, unit);
  }
}

function twoThings(rng: RNG): [(typeof THINGS)[number], (typeof THINGS)[number]] {
  const [a, b] = shuffle(rng, THINGS).slice(0, 2);
  return [a, b];
}

/** "🐍 is 6 blocks, 🐛 is 4 blocks. Which is longer?" */
function genCompare(rng: RNG, max: number, unit: string): Question {
  const [a, b] = twoThings(rng);
  const la = randInt(rng, 2, max);
  let lb = randInt(rng, 2, max);
  while (lb === la) lb = randInt(rng, 2, max);
  const longer = la > lb ? a : b;
  return {
    id: id(),
    prompt: `${a.emoji} ${a.name} is ${la} ${unit}.\n${b.emoji} ${b.name} is ${lb} ${unit}.\nWhich is longer?`,
    answer: longer.name,
    choices: shuffle(rng, [a.name, b.name]),
    inputMode: "choices",
    hint: `${la} and ${lb} — the bigger number is longer.`,
    dedupeKey: `cmp-${a.name}${la}-${b.name}${lb}`,
  };
}

/** "Rope 8 cm, string 3 cm. How much longer is the rope?" */
function genDifference(rng: RNG, max: number, unit: string, ctx: GenContext): Question {
  const [a, b] = twoThings(rng);
  const big = randInt(rng, ctx.easier ? 4 : 6, max);
  const small = randInt(rng, 1, big - 1);
  return {
    id: id(),
    prompt: `${a.emoji} is ${big} ${unit}, ${b.emoji} is ${small} ${unit}.\nHow much longer is ${a.emoji}?`,
    answer: String(big - small),
    choices: [],
    hint: `Take away: ${big} − ${small}.`,
    dedupeKey: `df-${big}-${small}`,
  };
}

/** "A 4 cm stick and a 5 cm stick end to end = ? cm" */
function genAddLength(rng: RNG, max: number, unit: string): Question {
  const a = randInt(rng, 2, max);
  const b = randInt(rng, 2, max);
  return {
    id: id(),
    prompt: `A ${a} ${unit} stick and a ${b} ${unit} stick,\nend to end = ? ${unit}`,
    answer: String(a + b),
    choices: [],
    hint: `Join them: ${a} + ${b}.`,
    dedupeKey: `al-${a}-${b}`,
  };
}

/** "1 crayon is 5 paperclips long. 2 crayons = ? paperclips" — iterate a unit. */
function genIterate(rng: RNG, ctx: GenContext): Question {
  const thing = pick(rng, THINGS);
  const per = randInt(rng, 2, 6);
  const n = randInt(rng, 2, ctx.easier ? 3 : 4);
  return {
    id: id(),
    prompt: `1 ${thing.name} ${thing.emoji} is ${per} paperclips long.\n${n} ${thing.name}s = ? paperclips`,
    answer: String(per * n),
    choices: [],
    hint: `Count ${per} for each one: ${Array(n).fill(per).join(" + ")}.`,
    dedupeKey: `it-${per}-${n}`,
  };
}

/** "The pencil starts at 0 and ends at 7. How long?" — read a ruler. */
function genRuler(rng: RNG, max: number, unit: string): Question {
  const thing = pick(rng, THINGS);
  const start = randInt(rng, 0, 3);
  const len = randInt(rng, 3, max);
  const end = start + len;
  return {
    id: id(),
    prompt: `${thing.emoji} starts at ${start} and ends at ${end}.\nHow long is it? (${unit})`,
    answer: String(len),
    choices: [],
    hint: start === 0 ? `It ends at ${end}, so it is ${end} long.` : `End minus start: ${end} − ${start}.`,
    dedupeKey: `rl-${start}-${end}`,
  };
}

/** "Which unit best measures a short pencil?" */
function genUnit(rng: RNG): Question {
  const small = rng() < 0.5;
  const thing = small ? pick(rng, ["pencil", "crayon", "bug", "key"]) : pick(rng, ["door", "car", "room", "playground"]);
  const answer = small ? pick(rng, SHORT_UNITS) : pick(rng, ["feet", "meters"]);
  return {
    id: id(),
    prompt: `Which unit best measures\na ${thing}?`,
    answer,
    choices: shuffle(rng, UNITS),
    inputMode: "choices",
    hint: small ? `Small things → centimeters or inches.` : `Big things → feet or meters.`,
    dedupeKey: `un-${thing}`,
  };
}

/** "About how long is a door?" — reasonable estimate. */
function genEstimate(rng: RNG): Question {
  const items = [
    { thing: "ant", ok: "1 centimeter", bad: ["1 meter", "1 foot"] },
    { thing: "new pencil", ok: "18 centimeters", bad: ["18 meters", "2 meters"] },
    { thing: "door", ok: "2 meters", bad: ["2 centimeters", "20 centimeters"] },
    { thing: "bed", ok: "2 meters", bad: ["2 centimeters", "20 millimeters"] },
    { thing: "school bus", ok: "10 meters", bad: ["10 centimeters", "1 meter"] },
    { thing: "shoe", ok: "25 centimeters", bad: ["25 meters", "2 meters"] },
  ];
  const it = pick(rng, items);
  return {
    id: id(),
    prompt: `About how long\nis a ${it.thing}?`,
    answer: it.ok,
    choices: shuffle(rng, [it.ok, ...it.bad]),
    inputMode: "choices",
    hint: `Picture it next to a ruler — which size makes sense?`,
    dedupeKey: `es-${it.thing}`,
  };
}
