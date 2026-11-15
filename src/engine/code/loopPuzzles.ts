// Loops. "Use a loop to reach the flag" (loop) is built BACKWARDS: choose a
// repeat block (and maybe a plain arrow before / after), walk it from a start
// that keeps it on the grid, put the flag where it ends, then add rocks off
// the path. The block limit is the program's own block count, and the search
// proves no loop-free program that short can win. "loop-trace" reads such a
// program instead and asks where Pogo stops.
import type { Question } from "../generators/types";
import { pick, randInt, shuffle } from "../rng";
import { CODE } from "../../strings/code";
import { CODE_DONE, flatten } from "./judge";
import { DIRS, OPPOSITE, buildWithFallback, codeQuestion, fingerprint, gridSize, selfAvoiding, type CodeEnv } from "./grids";
import { shortestLength } from "./solver";
import { rocksAround, traceQuestion, traceable } from "./tracePuzzles";
import type { CodeBlock, CodeGrid, Dir, LoopBlock, RunPayload } from "./types";

const E = CODE.engine;
const STEP: Record<Dir, readonly [number, number]> = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };

/** Repeat counts on offer: the right one and its neighbours, never below 2. */
export function loopOffers(times: number): number[] {
  const low = Math.max(2, times - 1);
  return [low, low + 1, low + 2];
}

/** A body that never doubles back (at most two perpendicular directions), so repeating it never revisits a square. */
function sampleBody(env: CodeEnv, length: number): Dir[] {
  const first = pick(env.rng, DIRS);
  const turn = pick(env.rng, DIRS.filter((dir) => dir !== first && dir !== OPPOSITE[first]));
  if (length === 1) return [first];
  if (length === 2) return [first, turn];
  return shuffle(env.rng, [first, first, turn]);
}

/** One arrow at first ("3 times →"), two from the middle on, up to three when hard. */
function bodyLength(env: CodeEnv): number {
  if (env.easier || env.difficulty < 0.3) return 1;
  return env.difficulty > 0.7 ? randInt(env.rng, 2, 3) : randInt(env.rng, 1, 2);
}

/** A program around one loop: `extras` (0–2) plain arrows, one before and / or one after it. */
export function sampleLoopProgram(env: CodeEnv, extras: number): CodeBlock[] {
  const loop: LoopBlock = { times: randInt(env.rng, 2, env.easier ? 3 : 4), body: sampleBody(env, bodyLength(env)) };
  const before = extras >= 2 || (extras === 1 && env.rng() < 0.5) ? 1 : 0;
  const plain = () => pick(env.rng, DIRS);
  return [
    ...Array.from({ length: before }, plain),
    loop,
    ...Array.from({ length: extras - before }, plain),
  ];
}

/** Every start square from which the steps stay on an empty grid, without revisiting. */
export function placeWalk(env: CodeEnv, size: number, dirs: Dir[]): { start: number; path: number[] } | null {
  const offsets: Array<[number, number]> = [[0, 0]];
  for (const dir of dirs) {
    const [r, c] = offsets[offsets.length - 1];
    offsets.push([r + STEP[dir][0], c + STEP[dir][1]]);
  }
  const rows = offsets.map(([r]) => r);
  const cols = offsets.map(([, c]) => c);
  const rowLow = -Math.min(...rows);
  const rowHigh = size - 1 - Math.max(...rows);
  const colLow = -Math.min(...cols);
  const colHigh = size - 1 - Math.max(...cols);
  if (rowLow > rowHigh || colLow > colHigh) return null;
  const row = randInt(env.rng, rowLow, rowHigh);
  const col = randInt(env.rng, colLow, colHigh);
  const path = offsets.map(([r, c]) => (row + r) * size + col + c);
  return selfAvoiding(path) ? { start: path[0], path } : null;
}

function loopQuestion(grid: CodeGrid, program: CodeBlock[]): Question {
  const loop = program.find((block): block is LoopBlock => typeof block !== "string") as LoopBlock;
  const payload: RunPayload = {
    tour: "code-run", task: "loop", grid, solution: program, maxBlocks: program.length,
    loops: loopOffers(loop.times), preview: false,
  };
  return codeQuestion(E.loop, CODE_DONE, E.hint.loop, payload, fingerprint(grid));
}

function loopAttempt(env: CodeEnv): Question | null {
  const size = gridSize(env);
  const extras = env.difficulty > 0.5 && !env.easier ? randInt(env.rng, 0, 2) : 0;
  const program = sampleLoopProgram(env, extras);
  const dirs = flatten(program);
  if (!env.easier && dirs.length < 3) return null;
  const placed = placeWalk(env, size, dirs);
  if (!placed) return null;
  const grid: CodeGrid = {
    size, start: placed.start, goal: placed.path[placed.path.length - 1], walls: rocksAround(env, size, placed.path), stars: [],
  };
  // The loop must be NEEDED: no plain-arrow program within the block limit wins.
  return shortestLength(grid) > program.length ? loopQuestion(grid, program) : null;
}

function loopTraceAttempt(env: CodeEnv): Question | null {
  const size = gridSize(env);
  const most = env.difficulty > 0.4 ? 2 : 1;
  const extras = env.easier ? 0 : randInt(env.rng, 0, most);
  const program = sampleLoopProgram(env, extras);
  const placed = placeWalk(env, size, flatten(program));
  if (!placed) return null;
  const grid: CodeGrid = { size, start: placed.start, goal: -1, walls: rocksAround(env, size, placed.path), stars: [] };
  return traceable(grid, program) ? traceQuestion(grid, program, "loop-trace") : null;
}

/** Three steps right from the left edge, with a "3 times →" loop. */
export function loopFloor(env: CodeEnv): Question {
  const size = 4;
  const start = randInt(env.rng, 0, size - 1) * size;
  const grid: CodeGrid = { size, start, goal: start + 3, walls: [], stars: [] };
  return loopQuestion(grid, [{ times: 3, body: ["E"] }]);
}

/** "2 times →" from the left edge. */
export function loopTraceFloor(env: CodeEnv): Question {
  const size = 4;
  const start = randInt(env.rng, 0, size - 1) * size;
  return traceQuestion({ size, start, goal: -1, walls: [], stars: [] }, [{ times: 2, body: ["E"] }], "loop-trace");
}

export function buildLoop(env: CodeEnv): Question {
  return buildWithFallback("loop", env, { attempt: loopAttempt, floor: loopFloor });
}

export function buildLoopTrace(env: CodeEnv): Question {
  return buildWithFallback("loop-trace", env, { attempt: loopTraceAttempt, floor: loopTraceFloor });
}
