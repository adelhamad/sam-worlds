// Code Lab widgets — pure helpers (no React). A program is expanded into the
// steps a run actually plays, each tagged with the block that produced it, so
// the track highlight, the star counter, Pogo's hops and the bonk all read
// from one list. The engine's runProgram stays the single source of truth.
import { runProgram } from "../../../engine/code/judge";
import type { CodeBlock, CodeGrid, Dir, LoopBlock } from "../../../engine/code/types";

export const DIRS: Dir[] = ["N", "E", "S", "W"];

/** Body arrows a loop block holds at most. */
export const LOOP_SLOTS = 3;

/** Where a step comes from: top-level block `i`, body arrow `j` (−1 = the block itself), loop pass `iter`. */
export interface BlockRef {
  i: number;
  j: number;
  iter: number;
}

export interface RunStep {
  dir: Dir;
  ref: BlockRef;
  from: number;
  /** The square stepped onto; null = a bump (the run stops there). */
  to: number | null;
  /** Stars held after this step. */
  collected: number[];
  /** This step reached the flag holding every star. */
  won: boolean;
}

export function isLoop(block: CodeBlock): block is LoopBlock {
  return typeof block !== "string";
}

export const rowOf = (sq: number, size: number): number => Math.floor(sq / size);
export const colOf = (sq: number, size: number): number => sq % size;

/** Every arrow of the program in run order, with its block. */
export function expand(program: CodeBlock[]): { dir: Dir; ref: BlockRef }[] {
  const out: { dir: Dir; ref: BlockRef }[] = [];
  program.forEach((block, i) => {
    if (!isLoop(block)) {
      out.push({ dir: block, ref: { i, j: -1, iter: 0 } });
      return;
    }
    for (let iter = 0; iter < block.times; iter++) {
      block.body.forEach((dir, j) => out.push({ dir, ref: { i, j, iter } }));
    }
  });
  return out;
}

/** The steps a run plays — cut where the engine's run stops (bump, win, or the end). */
export function runSteps(grid: CodeGrid, program: CodeBlock[]): RunStep[] {
  const run = runProgram(grid, program);
  const moves = run.path.length - 1;
  const played = expand(program).slice(0, moves + (run.bumped ? 1 : 0));
  const collected: number[] = [];
  return played.map((step, k) => {
    const from = run.path[k];
    const to = k < moves ? run.path[k + 1] : null;
    if (to !== null && run.collected.includes(to) && !collected.includes(to)) collected.push(to);
    return { ...step, from, to, collected: [...collected], won: run.won && k === moves - 1 };
  });
}

/** True when the program has at least one arrow to play. */
export function hasSteps(program: CodeBlock[]): boolean {
  return program.some((block) => !isLoop(block) || block.body.length > 0);
}

/** Key of an arrow in a program: "i" for a top-level arrow, "i-j" inside loop i. */
export function arrowKey(i: number, j = -1): string {
  return j < 0 ? String(i) : `${i}-${j}`;
}

export function arrowAt(program: CodeBlock[], key: string): Dir | null {
  const [i, j] = key.split("-").map(Number);
  const block = program[i];
  if (block === undefined) return null;
  if (!isLoop(block)) return j === undefined ? block : null;
  return j === undefined ? null : (block.body[j] ?? null);
}

/** The same program with one arrow turned to `dir` (the shape never changes). */
export function withArrow(program: CodeBlock[], key: string, dir: Dir): CodeBlock[] {
  const [i, j] = key.split("-").map(Number);
  return program.map((block, at) => {
    if (at !== i) return block;
    if (!isLoop(block)) return dir;
    return { ...block, body: block.body.map((old, k) => (k === j ? dir : old)) };
  });
}

/** Keys of the arrows that differ between two programs of the same shape. */
export function changedKeys(before: CodeBlock[], after: CodeBlock[]): string[] {
  const keys: string[] = [];
  before.forEach((block, i) => {
    const other = after[i];
    if (other === undefined) return;
    if (!isLoop(block) || !isLoop(other)) {
      if (block !== other) keys.push(arrowKey(i));
      return;
    }
    block.body.forEach((dir, j) => {
      if (other.body[j] !== dir) keys.push(arrowKey(i, j));
    });
  });
  return keys;
}

/** Milliseconds before step `k` (0-based): calm at first, a little faster on long runs. */
export function stepDelay(k: number, total: number): number {
  if (k === 0) return 260;
  return total > 8 && k >= 6 ? 250 : 380;
}
