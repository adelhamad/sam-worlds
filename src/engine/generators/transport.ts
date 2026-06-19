// On the Move — transportation: vehicles that travel on land, in the air, and
// on water, plus which vehicle fits which job.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, vehicle, where it travels: land|air|water]
const VEHICLES: Array<[string, string, string]> = [
  ["🚗", "car", "land"], ["🚂", "train", "land"], ["🚲", "bicycle", "land"],
  ["🚌", "bus", "land"], ["🚜", "tractor", "land"], ["🏍️", "motorbike", "land"],
  ["✈️", "airplane", "air"], ["🚁", "helicopter", "air"], ["🎈", "hot-air balloon", "air"],
  ["🚀", "rocket", "air"], ["🚢", "ship", "water"], ["⛵", "sailboat", "water"],
  ["🚤", "speedboat", "water"], ["🛶", "canoe", "water"], ["🛥️", "ferry", "water"],
];

// [need, best vehicle, wrongs]
const USE: Array<[string, string, string[]]> = [
  ["To cross a big ocean, you take a…", "🚢 ship", ["🚗 car", "🚲 bicycle", "🚂 train"]],
  ["To fly far away quickly, you take a…", "✈️ airplane", ["🚌 bus", "🛶 canoe", "🚜 tractor"]],
  ["To travel to space, you ride a…", "🚀 rocket", ["🚲 bicycle", "⛵ sailboat", "🚗 car"]],
  ["To plow a field on a farm, you drive a…", "🚜 tractor", ["✈️ airplane", "🚤 speedboat", "🚁 helicopter"]],
  ["To take the whole class on a trip, you take a…", "🚌 bus", ["🚲 bicycle", "🛶 canoe", "🏍️ motorbike"]],
  ["To paddle gently down a river, you use a…", "🛶 canoe", ["🚀 rocket", "🚂 train", "✈️ airplane"]],
];

const COUNT: Array<[string, number]> = [
  ["How many wheels does a bicycle have?", 2],
  ["How many wheels does a car have?", 4],
  ["How many wheels does a tricycle have?", 3],
];

export interface TransportParams {
  types: Array<"where" | "use" | "count">;
}

let qid = 0;
const id = () => `tr${++qid}`;

export function generateTransport(params: TransportParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "use") {
    const [p, a, w] = pick(rng, USE);
    return { id: id(), prompt: p, answer: a, choices: shuffle(rng, [a, ...w]), hint: "Match the trip to the right vehicle.", inputMode: "choices", dedupeKey: `use-${p}` };
  }
  if (type === "count") {
    const [p, n] = pick(rng, COUNT);
    return { id: id(), prompt: p, answer: String(n), choices: [], hint: "Picture the vehicle and count its wheels.", dedupeKey: `count-${p}` };
  }
  const [emoji, vehicle, where] = pick(rng, VEHICLES);
  const PLACES: Record<string, string> = { land: "on land", air: "in the air", water: "on water" };
  const place = PLACES[where];
  return {
    id: id(),
    prompt: `Where does a ${vehicle} travel?`,
    answer: place,
    choices: shuffle(rng, ["on land", "in the air", "on water"]),
    hint: "Land, air, or water?",
    inputMode: "choices",
    dedupeKey: `where-${vehicle}`,
    payload: { bigSymbol: emoji },
  };
}
