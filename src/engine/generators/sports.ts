// Sports Arena — sports, the gear you use, and where each is played.
import { pick, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

// [emoji, sport, gear you use, where you play]
const SPORTS: Array<[string, string, string, string]> = [
  ["⚽", "soccer", "a round ball", "a grassy field"],
  ["🏀", "basketball", "a ball and a hoop", "a court"],
  ["🎾", "tennis", "a racket", "a court"],
  ["🏊", "swimming", "goggles", "a pool"],
  ["⚾", "baseball", "a bat and ball", "a field"],
  ["🏏", "cricket", "a flat bat", "a pitch"],
  ["🏓", "table tennis", "a small paddle", "a table"],
  ["🏸", "badminton", "a racket and shuttlecock", "a court"],
  ["⛸️", "ice skating", "skates", "the ice"],
  ["🚴", "cycling", "a bicycle", "a track or road"],
  ["🏐", "volleyball", "a ball and a net", "a court or beach"],
  ["🥋", "karate", "a belt and uniform", "a dojo"],
];

export interface SportsParams {
  types: Array<"gear" | "where" | "name">;
}

let qid = 0;
const id = () => `sp${++qid}`;

export function generateSports(params: SportsParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  const [emoji, sport, gear, where] = pick(rng, SPORTS);
  if (type === "gear") {
    const wrong = shuffle(rng, SPORTS.filter((s) => s[2] !== gear)).slice(0, 3);
    return { id: id(), prompt: `What do you use to play ${sport}?`, answer: gear, choices: shuffle(rng, [gear, ...wrong.map(([, , g]) => g)]), hint: "Picture playing the sport.", inputMode: "choices", dedupeKey: `gear-${sport}`, payload: { bigSymbol: emoji } };
  }
  if (type === "where") {
    const wrong = shuffle(rng, [...new Set(SPORTS.map((s) => s[3]))].filter((p) => p !== where)).slice(0, 3);
    return { id: id(), prompt: `Where do you play ${sport}?`, answer: where, choices: shuffle(rng, [where, ...wrong]), hint: "Where does this sport happen?", inputMode: "choices", dedupeKey: `where-${sport}`, payload: { bigSymbol: emoji } };
  }
  const wrong = shuffle(rng, SPORTS.filter((s) => s[1] !== sport)).slice(0, 3);
  return { id: id(), prompt: `Which sport uses ${gear}?`, answer: `${emoji} ${sport}`, choices: shuffle(rng, [`${emoji} ${sport}`, ...wrong.map(([e, n]) => `${e} ${n}`)]), hint: "Match the gear to the sport.", inputMode: "choices", dedupeKey: `name-${sport}` };
}
