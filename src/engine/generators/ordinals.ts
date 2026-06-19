// Race Ranks — ordinal numbers: first, second, third … and reading positions
// in a line-up.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

const WORDS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];
const RACERS = ["🐢", "🐰", "🦊", "🐶", "🐱", "🐭", "🐸", "🦁"];

export interface OrdinalsParams {
  types: Array<"word" | "position" | "front">;
}

let qid = 0;
const id = () => `od${++qid}`;

function genWord(rng: RNG): Question {
  const n = 1 + Math.floor(rng() * WORDS.length);
  const answer = WORDS[n - 1];
  const wrong = shuffle(rng, WORDS.filter((w) => w !== answer)).slice(0, 3);
  return { id: id(), prompt: `What is the word for position number ${n}?`, answer, choices: shuffle(rng, [answer, ...wrong]), hint: "1st = first, 2nd = second, 3rd = third…", inputMode: "choices", dedupeKey: `word-${n}` };
}

function genPosition(rng: RNG): Question {
  const lineup = shuffle(rng, RACERS).slice(0, 4);
  const spot = 1 + Math.floor(rng() * 4);
  return {
    id: id(),
    prompt: `They lined up 1st to 4th:  ${lineup.join("  ")}\nWho is in ${WORDS[spot - 1]} place?`,
    answer: lineup[spot - 1],
    choices: shuffle(rng, [...lineup]),
    hint: "Count from the left: 1st, 2nd, 3rd, 4th.",
    inputMode: "choices",
    dedupeKey: `pos-${lineup.join("")}-${spot}`,
    payload: { listRows: [lineup.map((r, i) => `${WORDS[i]}: ${r}`).join("   ")] },
  };
}

function genFront(rng: RNG): Question {
  const n = 2 + Math.floor(rng() * 6);
  return { id: id(), prompt: `You are ${WORDS[n - 1]} in line. How many people are in front of you?`, answer: String(n - 1), choices: [], hint: "Everyone before your spot is in front.", dedupeKey: `front-${n}` };
}

export function generateOrdinals(params: OrdinalsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  if (type === "position") return genPosition(rng);
  if (type === "front") return genFront(rng);
  return genWord(rng);
}
