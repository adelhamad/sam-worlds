// "Where will Pogo stop?" (trace): a program of plain arrows that never bumps
// and never steps on a square twice — so the end cannot be guessed from the
// picture — on a grid with rocks around the path and no flag.
import type { Question } from "../generators/types";
import { pick, randInt } from "../rng";
import { CODE } from "../../strings/code";
import { runProgram, stepFrom, traceAnswer } from "./judge";
import {
  DIRS, buildWithFallback, codeQuestion, distance, fingerprint, freeSample, gridSize, longest, turns, wallCount, type CodeEnv,
} from "./grids";
import type { CodeBlock, CodeGrid, Dir, TracePayload } from "./types";

const E = CODE.engine;

/** A random walk of `length` steps that never leaves the grid or revisits a square; null when it gets stuck. */
function randomWalk(env: CodeEnv, size: number, start: number, length: number): { dirs: Dir[]; path: number[] } | null {
  const open: CodeGrid = { size, start, goal: -1, walls: [], stars: [] };
  const dirs: Dir[] = [];
  const path = [start];
  for (let i = 0; i < length; i++) {
    const at = path[path.length - 1];
    const options = DIRS.filter((dir) => {
      const next = stepFrom(open, at, dir);
      return next !== null && !path.includes(next);
    });
    if (!options.length) return null;
    // Short straight runs read better than a zig-zag: keep going a little more often.
    const last = dirs[dirs.length - 1];
    const dir = last && options.includes(last) && env.rng() < 0.35 ? last : pick(env.rng, options);
    dirs.push(dir);
    path.push(stepFrom(open, at, dir) as number);
  }
  return { dirs, path };
}

/** A trace question for `program` on `grid` (goal −1, no stars). */
export function traceQuestion(grid: CodeGrid, program: CodeBlock[], task: "trace" | "loop-trace"): Question {
  const payload: TracePayload = { tour: "code-trace", task, grid, program, solution: program };
  const hint = task === "trace" ? E.hint.trace : E.hint.loopTrace;
  return codeQuestion(E.trace, traceAnswer(grid, program), hint, payload, fingerprint(grid, program));
}

/** Rocks on squares the program never visits. */
export function rocksAround(env: CodeEnv, size: number, path: number[]): number[] {
  return freeSample(env.rng, size, path, wallCount(env, size));
}

/** The trace contract: never bumps, ends at least two squares from the start. */
export function traceable(grid: CodeGrid, program: CodeBlock[]): boolean {
  const run = runProgram(grid, program);
  return !run.bumped && distance(grid.start, run.end, grid.size) >= 2;
}

function traceAttempt(env: CodeEnv): Question | null {
  const size = gridSize(env);
  const start = randInt(env.rng, 0, size * size - 1);
  const walked = randomWalk(env, size, start, randInt(env.rng, 3, longest(env)));
  if (!walked) return null;
  if (!env.easier && env.difficulty >= 0.3 && turns(walked.dirs) === 0) return null;
  const grid: CodeGrid = { size, start, goal: -1, walls: rocksAround(env, size, walked.path), stars: [] };
  return traceable(grid, walked.dirs) ? traceQuestion(grid, walked.dirs, "trace") : null;
}

/** Up, up, right from somewhere on the bottom row. */
export function traceFloor(env: CodeEnv): Question {
  const size = 4;
  const start = (size - 1) * size + randInt(env.rng, 0, size - 2);
  return traceQuestion({ size, start, goal: -1, walls: [], stars: [] }, ["N", "N", "E"], "trace");
}

export function buildTrace(env: CodeEnv): Question {
  return buildWithFallback("trace", env, { attempt: traceAttempt, floor: traceFloor });
}
