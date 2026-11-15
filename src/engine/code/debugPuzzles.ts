// "Fix the bug": a run-style puzzle with its shortest program, then ONE arrow
// turned so the program no longer wins (it bumps or stops somewhere else).
// Below difficulty 0.6 the bug must be the only arrow whose change fixes it,
// so there is exactly one honest answer.
import type { Question } from "../generators/types";
import { randInt, shuffle } from "../rng";
import { CODE } from "../../strings/code";
import { CODE_DONE, runProgram } from "./judge";
import { DIRS, buildWithFallback, codeQuestion, fingerprint, type CodeEnv } from "./grids";
import { sampleGrid } from "./runPuzzles";
import { shortestProgram } from "./solver";
import type { CodeGrid, DebugPayload, Dir } from "./types";

const E = CODE.engine;

/** How many single-arrow changes of `program` win. */
export function singleFixes(grid: CodeGrid, program: Dir[]): number {
  let fixes = 0;
  program.forEach((dir, i) => {
    for (const other of DIRS) {
      if (other === dir) continue;
      const edited = [...program];
      edited[i] = other;
      if (runProgram(grid, edited).won) fixes++;
    }
  });
  return fixes;
}

function debugQuestion(grid: CodeGrid, solution: Dir[], program: Dir[]): Question {
  const payload: DebugPayload = { tour: "code-debug", task: "debug", grid, program, solution, edits: 1 };
  return codeQuestion(E.debug, CODE_DONE, E.hint.debug, payload, fingerprint(grid, program));
}

/** Turn one arrow of `solution`; null when no turn gives a fair bug. */
function plantBug(env: CodeEnv, grid: CodeGrid, solution: Dir[]): Dir[] | null {
  const spots = shuffle(env.rng, solution.flatMap((dir, i) => DIRS.filter((other) => other !== dir).map((other) => [i, other] as const)));
  for (const [i, other] of spots) {
    const buggy = [...solution];
    buggy[i] = other;
    if (runProgram(grid, buggy).won) continue;
    if (env.difficulty < 0.6 && singleFixes(grid, buggy) !== 1) continue;
    return buggy;
  }
  return null;
}

function debugAttempt(env: CodeEnv): Question | null {
  const grid = sampleGrid(env, 0);
  const solution = shortestProgram(grid);
  const most = env.easier ? 5 : 5 + Math.round(2 * env.difficulty);
  if (!solution || solution.length < 4 || solution.length > most) return null;
  const buggy = plantBug(env, grid, solution);
  return buggy ? debugQuestion(grid, solution, buggy) : null;
}

/** Up, up, right, right — with the third arrow turned left into the edge. */
export function debugFloor(env: CodeEnv): Question {
  const size = 4;
  const start = (size - 1) * size + randInt(env.rng, 0, 1);
  const grid: CodeGrid = { size, start, goal: start - 2 * size + 2, walls: [], stars: [] };
  const solution: Dir[] = ["N", "N", "E", "E"];
  const buggy: Dir[] = ["N", "N", start % size === 0 ? "W" : "S", "E"];
  return debugQuestion(grid, solution, buggy);
}

export function buildDebug(env: CodeEnv): Question {
  return buildWithFallback("debug", env, { attempt: debugAttempt, floor: debugFloor });
}
