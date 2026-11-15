// Runs Code Lab programs. Pure: the planner uses it to validate puzzles, the
// widgets use it to animate a run and to serialise the result, so the shared
// answer engine can judge with plain equality. A component never decides.
import type { CodeBlock, CodeGrid, DebugPayload, Dir, RunPayload } from "./types";

/** What a winning run reports — `question.answer` of every run / debug puzzle. */
export const CODE_DONE = "goal";

/** Longest run we simulate (programs are tiny; this only guards bad input). */
const MAX_STEPS = 60;

const STEP: Record<Dir, readonly [number, number]> = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };

/** The square one step away, or null when that is off the grid or a wall. */
export function stepFrom(grid: CodeGrid, sq: number, dir: Dir): number | null {
  const [dr, dc] = STEP[dir];
  const row = Math.floor(sq / grid.size) + dr;
  const col = (sq % grid.size) + dc;
  if (row < 0 || col < 0 || row >= grid.size || col >= grid.size) return null;
  const next = row * grid.size + col;
  return grid.walls.includes(next) ? null : next;
}

/** The program as plain steps, loops unrolled. */
export function flatten(program: CodeBlock[]): Dir[] {
  return program.flatMap((block) =>
    typeof block === "string" ? [block] : Array.from({ length: block.times }, () => block.body).flat());
}

/** Top-level blocks (a loop counts as one). */
export function blockCount(program: CodeBlock[]): number {
  return program.length;
}

export interface CodeRun {
  /** Every square Pogo stood on, the start first. */
  path: number[];
  /** Stars picked up, in order. */
  collected: number[];
  /** He walked into a wall or off the grid: the run stopped there. */
  bumped: boolean;
  /** He reached the flag holding every star. */
  won: boolean;
  /** Where he ended up. */
  end: number;
}

/** Play the program. The run stops at a bump, at a win, or when the steps run out. */
export function runProgram(grid: CodeGrid, program: CodeBlock[]): CodeRun {
  const path = [grid.start];
  const collected: number[] = [];
  let at = grid.start;
  for (const dir of flatten(program).slice(0, MAX_STEPS)) {
    const next = stepFrom(grid, at, dir);
    if (next === null) return { path, collected, bumped: true, won: false, end: at };
    at = next;
    path.push(at);
    if (grid.stars.includes(at) && !collected.includes(at)) collected.push(at);
    if (at === grid.goal && collected.length === grid.stars.length) {
      return { path, collected, bumped: false, won: true, end: at };
    }
  }
  return { path, collected, bumped: false, won: false, end: at };
}

/** Compact text form of a program, e.g. "N 3xEN E" (miss tokens, puzzle fingerprints). */
export function programKey(program: CodeBlock[]): string {
  return program.map((block) => (typeof block === "string" ? block : `${block.times}x${block.body.join("")}`)).join(" ");
}

/** How many arrows differ between two programs of the same shape (Infinity when the shape differs). */
export function arrowsChanged(before: CodeBlock[], after: CodeBlock[]): number {
  if (before.length !== after.length) return Infinity;
  let changed = 0;
  for (let i = 0; i < before.length; i++) {
    const a = before[i];
    const b = after[i];
    if (typeof a === "string" || typeof b === "string") {
      if (typeof a !== "string" || typeof b !== "string") return Infinity;
      if (a !== b) changed++;
    } else {
      if (a.times !== b.times || a.body.length !== b.body.length) return Infinity;
      changed += a.body.filter((dir, j) => dir !== b.body[j]).length;
    }
  }
  return changed;
}

/** run: CODE_DONE when the program wins within the block limit and uses only blocks on offer. */
export function codeVerdict(payload: RunPayload, program: CodeBlock[]): string {
  const loopsOk = program.every((block) => typeof block === "string" || payload.loops.includes(block.times));
  const fits = blockCount(program) <= payload.maxBlocks && loopsOk;
  return fits && runProgram(payload.grid, program).won ? CODE_DONE : `miss:${programKey(program)}`;
}

/** debug: CODE_DONE when the edited program wins and changed at most `edits` arrows. */
export function debugVerdict(payload: DebugPayload, program: CodeBlock[]): string {
  const allowed = arrowsChanged(payload.program, program) <= payload.edits;
  return allowed && runProgram(payload.grid, program).won ? CODE_DONE : `miss:${programKey(program)}`;
}

/** trace: the square where the program leaves Pogo. */
export function traceAnswer(grid: CodeGrid, program: CodeBlock[]): string {
  return String(runProgram(grid, program).end);
}
