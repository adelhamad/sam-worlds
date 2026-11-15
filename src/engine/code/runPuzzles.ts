// "Take Pogo to the flag" (run) and "Grab the stars, then the flag" (stars):
// sample a grid, solve it with the shortest-program search, keep it when the
// solution has a fitting length, and give a block limit with a little slack
// (none when hard — "find the shortest way").
import type { Question } from "../generators/types";
import { randInt } from "../rng";
import { CODE } from "../../strings/code";
import { CODE_DONE, runProgram } from "./judge";
import {
  buildWithFallback, codeQuestion, distance, fingerprint, freeSample, gridSize, longest, turns, wallCount, type CodeEnv,
} from "./grids";
import { shortestProgram } from "./solver";
import type { CodeGrid, Dir, RunPayload } from "./types";

const E = CODE.engine;

/** Extra blocks on top of the shortest program: 2 early, 1 mid, 0 above 0.7. */
export function slackFor(env: CodeEnv): number {
  if (env.easier || env.difficulty < 0.35) return 2;
  return env.difficulty <= 0.7 ? 1 : 0;
}

/** A random grid: start, flag, `stars` stars and some rocks, all on different squares. */
export function sampleGrid(env: CodeEnv, stars: number): CodeGrid {
  const size = gridSize(env);
  const [start, goal, ...rest] = freeSample(env.rng, size, [], 2 + stars);
  const walls = freeSample(env.rng, size, [start, goal, ...rest], wallCount(env, size));
  return { size, start, goal, walls, stars: rest };
}

/** At difficulty ≥ 0.3 the flag is never one straight line away (most of the time early on, too). */
function turnsEnough(env: CodeEnv, solution: Dir[]): boolean {
  if (turns(solution) > 0) return true;
  return !env.easier && env.difficulty < 0.3 && env.rng() < 0.5;
}

function runQuestion(env: CodeEnv, grid: CodeGrid, solution: Dir[], task: "run" | "stars"): Question {
  const slack = slackFor(env);
  const payload: RunPayload = {
    tour: "code-run", task, grid, solution, maxBlocks: solution.length + slack, loops: [],
    preview: env.easier || env.difficulty < 0.35,
  };
  let prompt = slack === 0 ? E.shortest : E.run;
  let hint = slack === 0 ? E.hint.shortest : E.hint.run;
  if (task === "stars") {
    prompt = E.stars;
    hint = E.hint.stars;
  } else if (slack > 0 && grid.walls.length) {
    hint = E.hint.walls;
  }
  return codeQuestion(prompt, CODE_DONE, hint, payload, fingerprint(grid));
}

/** Shortest program a run puzzle may have: 2 early, growing to 4 when hard. */
function shortestAllowed(env: CodeEnv): number {
  return env.easier ? 2 : Math.max(2, Math.round(1 + 3 * env.difficulty));
}

function runAttempt(env: CodeEnv): Question | null {
  const grid = sampleGrid(env, 0);
  const direct = distance(grid.start, grid.goal, grid.size);
  if (direct < 2) return null;
  const solution = shortestProgram(grid);
  if (!solution || solution.length < shortestAllowed(env) || solution.length > longest(env)) return null;
  // "Find the shortest way" is only a puzzle when the rocks force a detour.
  if (slackFor(env) === 0 && solution.length === direct && env.rng() < 0.7) return null;
  return turnsEnough(env, solution) ? runQuestion(env, grid, solution, "run") : null;
}

/** 1–2 stars (1 when gentle), 3 above difficulty 0.7. */
function starCount(env: CodeEnv): number {
  if (env.easier) return 1;
  if (env.difficulty > 0.7) return 3;
  return env.difficulty < 0.35 ? randInt(env.rng, 1, 2) : 2;
}

function starsAttempt(env: CodeEnv): Question | null {
  const grid = sampleGrid(env, starCount(env));
  const solution = shortestProgram(grid);
  if (!solution || solution.length < 2 || solution.length > (env.easier ? 6 : 9)) return null;
  // Keep the picture honest: the flag is the LAST square the solution steps on.
  if (runProgram(grid, solution).path.indexOf(grid.goal) !== solution.length) return null;
  return runQuestion(env, grid, solution, "stars");
}

/** Bottom-left corner, offset by the rng so repeated floors still differ. */
function floorStart(env: CodeEnv, size: number): number {
  return (size - 1) * size + randInt(env.rng, 0, size - 2);
}

/** Up one, right one — always solvable on any grid. */
export function runFloor(env: CodeEnv): Question {
  const size = 4;
  const start = floorStart(env, size);
  const grid: CodeGrid = { size, start, goal: start - size + 1, walls: [], stars: [] };
  return runQuestion({ ...env, difficulty: Math.min(env.difficulty, 0.3) }, grid, ["N", "E"], "run");
}

/** A star straight above, the flag one to the right of it. */
export function starsFloor(env: CodeEnv): Question {
  const size = 4;
  const start = floorStart(env, size);
  const grid: CodeGrid = { size, start, goal: start - size + 1, walls: [], stars: [start - size] };
  return runQuestion({ ...env, difficulty: Math.min(env.difficulty, 0.3) }, grid, ["N", "E"], "stars");
}

export function buildRun(env: CodeEnv): Question {
  return buildWithFallback("run", env, { attempt: runAttempt, floor: runFloor });
}

export function buildStars(env: CodeEnv): Question {
  return buildWithFallback("stars", env, { attempt: starsAttempt, floor: starsFloor });
}
