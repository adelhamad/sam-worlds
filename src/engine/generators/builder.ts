// Builder's Reach — physics: TNT-cannon trajectory shots (aim, FIRE) and
// lever-balance puzzles (computed on the number pad).
import { pick, randInt, type RNG } from "../rng";
import { lerp, type GenContext, type Question } from "./types";

export interface BuilderParams {
  types: Array<"launch" | "lever">;
  /** Hit tolerance in distance units (smaller = harder). */
  tolerance?: number;
}

let qid = 0;

export function generateBuilder(params: BuilderParams, rng: RNG, ctx: GenContext): Question {
  const type = ctx.easier ? params.types[0] : pick(rng, params.types);
  return type === "lever" ? genLever(rng, ctx) : genLaunch(params, rng, ctx);
}

/** Range ∝ sin(2θ); 100 units at 45°. Same model as the widget. */
export function rangeForAngle(angle: number): number {
  return Math.round(Math.sin((2 * angle * Math.PI) / 180) * 100);
}

function genLaunch(params: BuilderParams, rng: RNG, ctx: GenContext): Question {
  const baseTol = params.tolerance ?? 8;
  const tolerance = ctx.easier ? baseTol + 4 : Math.max(3, Math.round(lerp(baseTol + 2, baseTol - 2, ctx.difficulty)));
  // pick a target reachable at a 5°-step angle, away from the trivial 45°
  const angle = pick(rng, [20, 25, 30, 35, 40, 50, 55, 60, 65, 70]);
  const target = rangeForAngle(angle);
  return {
    id: `br${++qid}`,
    prompt: "Aim the TNT cannon — hit the target! 🧨",
    answer: "hit",
    choices: [],
    hint: angle < 45 ? "Flatter shots land closer in." : "Steep shots also drop short — try high!",
    inputMode: "launch",
    payload: { target, tolerance },
  };
}

function genLever(rng: RNG, ctx: GenContext): Question {
  // w1 · d1 = w2 · d2 — solve for the missing weight
  const d1 = randInt(rng, 2, ctx.easier ? 4 : 6);
  const w1 = randInt(rng, 2, ctx.easier ? 6 : 10);
  const moment = w1 * d1;
  const d2s = [2, 3, 4, 5, 6].filter((d) => d !== d1 && moment % d === 0);
  if (d2s.length === 0) return genLever(rng, ctx);
  const d2 = pick(rng, d2s);
  const answer = moment / d2;
  return {
    id: `br${++qid}`,
    prompt: `Balance! ${w1} blocks at ${d1}m = ▢ blocks at ${d2}m`,
    answer: String(answer),
    choices: [],
    hint: `${w1} × ${d1} = ${moment}. How many ${d2}s make ${moment}?`,
    inputMode: "numpad",
  };
}
