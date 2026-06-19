// Treasure Maps — reading maps: map symbols (keys) and finding things by their
// position in a row of boxes.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [symbol, what it means on a map]
const KEYS: Array<[string, string]> = [
  ["⛰️", "mountains"], ["🌊", "water or the sea"], ["🌲", "a forest"], ["🏠", "a house"],
  ["❌", "the buried treasure"], ["〰️", "a path or trail"], ["🌉", "a bridge"], ["🏝️", "an island"],
];

const FILLERS = ["🌴", "🪨", "🌵", "🐚", "⛵", "🦀"];

export interface MapsParams {
  types: Array<"key" | "find" | "what">;
}

let qid = 0;
const id = () => `mp${++qid}`;
const BOXES = ["Box 1", "Box 2", "Box 3", "Box 4"];

function boxesRow(items: string[]): string {
  return items.map((it, i) => `${BOXES[i]}: ${it}`).join("    ");
}

export function generateMaps(params: MapsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "key") {
    const [sym, means] = pick(rng, KEYS);
    const wrong = shuffle(rng, KEYS.filter((k) => k[1] !== means)).slice(0, 3);
    return { id: id(), prompt: `On a treasure map, what does ${sym} mean?`, answer: means, choices: shuffle(rng, [means, ...wrong.map(([, m]) => m)]), hint: "Picture that symbol on a map.", inputMode: "choices", dedupeKey: `key-${sym}`, payload: { bigSymbol: sym } };
  }
  // place a treasure 💎 and filler emojis in 4 boxes
  const spot = Math.floor(rng() * 4);
  const items = Array.from({ length: 4 }, (_, i) => (i === spot ? "💎" : pick(rng, FILLERS)));
  if (type === "what") {
    const ask = Math.floor(rng() * 4);
    const others = shuffle(rng, [...FILLERS, "💎"].filter((x) => x !== items[ask])).slice(0, 3);
    return { id: id(), prompt: `What is in ${BOXES[ask]}?`, answer: items[ask], choices: shuffle(rng, [items[ask], ...others]), hint: "Find the box and look inside.", inputMode: "choices", dedupeKey: `what-${ask}-${items[ask]}-${spot}`, payload: { listRows: [boxesRow(items)] } };
  }
  return { id: id(), prompt: "Which box has the treasure 💎?", answer: BOXES[spot], choices: shuffle(rng, [...BOXES]), hint: "Look along the boxes for the gem.", inputMode: "choices", dedupeKey: `find-${spot}-${items.join("")}`, payload: { listRows: [boxesRow(items)] } };
}
