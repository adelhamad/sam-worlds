// Compass Cove — directions, fully visual: emoji line-ups (left/right),
// find-the-way grids (arrows), turning, and a compass map around YOU.
import { pick, randInt, shuffle, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

const GAP = "　"; // fullwidth space keeps emoji grids aligned

const PETS = ["🐱", "🐶", "🐰", "🦊", "🐸", "🐼", "🦁", "🐷"];
const TREATS = ["🧀", "🍎", "🍪", "🥕", "🦴", "🍌"];
const SEEKERS = ["🐭", "🐶", "🐰", "🤖"];
const PLACES = ["🏠", "🌳", "⛲", "🏪", "🏰", "⛺"];

type Dir = "up" | "down" | "left" | "right";
const ARROWS: Record<Dir, string> = { up: "⬆️", down: "⬇️", left: "⬅️", right: "➡️" };
const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const COMPASS = ["North", "East", "South", "West"];
const COMPASS_ARROW: Record<string, string> = { North: "⬆️", East: "➡️", South: "⬇️", West: "⬅️" };

export interface DirectionParams {
  types: Array<"row" | "way" | "turn" | "compass">;
  /** Grid distance cap for "way" questions. */
  span?: number;
}

let qid = 0;
const id = () => `dr${++qid}`;

export function generateDirections(params: DirectionParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  switch (type) {
    case "way":
      return genWay(params, rng, ctx);
    case "turn":
      return genTurn(rng);
    case "compass":
      return genCompass(rng);
    default:
      return genRow(rng, ctx);
  }
}

/** A line-up of friends — who stands left/right of whom? */
function genRow(rng: RNG, ctx: GenContext): Question {
  const count = ctx.easier ? 3 : 4;
  const row = shuffle(rng, PETS).slice(0, count);
  const side = rng() < 0.5 ? "LEFT" : "RIGHT";
  // pick a target that has a neighbour on that side
  const ti = side === "LEFT" ? randInt(rng, 1, count - 1) : randInt(rng, 0, count - 2);
  const answer = side === "LEFT" ? row[ti - 1] : row[ti + 1];
  const wrong = row.filter((p) => p !== answer && p !== row[ti]).slice(0, 3);
  return {
    id: id(),
    prompt: `Who is just ${side} of the ${row[ti]}?`,
    answer,
    choices: shuffle(rng, [answer, ...wrong]),
    hint: side === "LEFT" ? "Left is this way: ⬅️" : "Right is this way: ➡️",
    inputMode: "choices",
    dedupeKey: `row-${row.join("")}-${ti}-${side}`,
    payload: { gridRows: [row.join(GAP)], bigChoices: true },
  };
}

/** Where can a walk of `dist` steps in direction `delta` start, on axis size 3? */
function startCoord(rng: RNG, delta: number, dist: number, size: number): number {
  if (delta < 0) return randInt(rng, dist, size - 1);
  if (delta > 0) return randInt(rng, 0, size - 1 - dist);
  return randInt(rng, 0, size - 1);
}

/** A grid with a seeker and a treat — which way to walk? */
function genWay(params: DirectionParams, rng: RNG, ctx: GenContext): Question {
  const size = 3;
  const span = ctx.easier ? 1 : (params.span ?? 2);
  const seeker = pick(rng, SEEKERS);
  const treat = pick(rng, TREATS);
  const dir = pick(rng, ["up", "down", "left", "right"] as Dir[]);
  const dist = randInt(rng, 1, Math.min(span, 2));
  const [dx, dy] = DELTA[dir];
  const sx = startCoord(rng, dx, dist, size);
  const sy = startCoord(rng, dy, dist, size);
  const tx = sx + dx * dist;
  const ty = sy + dy * dist;
  const rows = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => {
      if (x === sx && y === sy) return seeker;
      if (x === tx && y === ty) return treat;
      return "⬜";
    }).join(""),
  );
  return {
    id: id(),
    prompt: `Which way must ${seeker} go to reach the ${treat}?`,
    answer: ARROWS[dir],
    choices: shuffle(rng, Object.values(ARROWS)),
    hint: "Start at the friend, slide your finger to the treat.",
    inputMode: "choices",
    dedupeKey: `way-${seeker}${treat}-${dir}-${sx}${sy}`,
    payload: { gridRows: rows, bigChoices: true },
  };
}

/** Turning: face a way, turn, where do you face now? */
function genTurn(rng: RNG): Question {
  const fi = randInt(rng, 0, 3);
  const move = pick(rng, ["RIGHT", "LEFT", "all the way AROUND"] as const);
  const deltas: Record<string, number> = { RIGHT: 1, LEFT: 3 };
  const answer = COMPASS[(fi + (deltas[move] ?? 2)) % 4];
  return {
    id: id(),
    prompt: `You face ${COMPASS[fi]} ${COMPASS_ARROW[COMPASS[fi]]}. You turn ${move}. Now you face…?`,
    answer: `${answer} ${COMPASS_ARROW[answer]}`,
    choices: shuffle(rng, COMPASS.map((c) => `${c} ${COMPASS_ARROW[c]}`)),
    hint: "Stand up and really turn your body!",
    inputMode: "choices",
    dedupeKey: `turn-${fi}-${move}`,
  };
}

/** A map around YOU — which compass way is the landmark? */
function genCompass(rng: RNG): Question {
  const [n, e, s, w] = shuffle(rng, PLACES).slice(0, 4);
  const spots: Record<string, string> = { North: n, East: e, South: s, West: w };
  const target = pick(rng, COMPASS);
  const rows = [`${GAP}${n}${GAP}`, `${w}🧍${e}`, `${GAP}${s}${GAP}`];
  return {
    id: id(),
    prompt: `You are 🧍 in the middle. What is ${target} ${COMPASS_ARROW[target]} of you?`,
    answer: spots[target],
    choices: shuffle(rng, [n, e, s, w]),
    hint: "North is UP on the map, South is down.",
    inputMode: "choices",
    dedupeKey: `comp-${target}-${spots[target]}`,
    payload: { gridRows: rows, bigChoices: true },
  };
}
