// Code Lab — CONTRACT shared by the puzzle planner (engine), the coding
// widgets (UI) and the lesson screen. Pogo walks a small square grid by
// following a PROGRAM the child builds from blocks. Every code question is a
// normal engine `Question` with `inputMode: "tour"`, `repeatable: true` and a
// `code-*` payload; the store judges with plain `typed === question.answer`
// using the helpers in ./judge.ts.
import type { Question } from "../generators/types";
import type { KitTemplate } from "../kit/types";

/** One step on the grid. N is up the screen (row − 1). */
export type Dir = "N" | "E" | "S" | "W";

/** A loop block: do `body` `times` times. Loops never nest. */
export interface LoopBlock {
  times: number;
  body: Dir[];
}

/** A program is a list of blocks, run top to bottom. */
export type CodeBlock = Dir | LoopBlock;

export interface CodeGrid {
  /** Squares per side (4–6). Square index = row * size + col, row 0 at the top. */
  size: number;
  start: number;
  /** The flag. Pogo wins when he steps on it holding every star. */
  goal: number;
  walls: number[];
  stars: number[];
}

/** What a lesson may ask. */
export type CodeTask =
  | "run" // build a program that reaches the flag
  | "stars" // …collecting every star on the way
  | "trace" // read a program, tap where Pogo stops
  | "debug" // one block of the program is off: fix it
  | "loop" // reach the flag with a repeat block (too few blocks otherwise)
  | "loop-trace"; // read a program that has a loop, tap where Pogo stops

/** What the lesson's opening demo teaches (content/code/intros.ts). */
export type CodeIntroKey = "sequence" | "stars" | "trace" | "bug" | "loop";

/** Stage params for a Code Lab lesson (StageDef.params). */
export interface CodeParams {
  tasks: CodeTask[];
  /** Largest grid the lesson uses (4–6). */
  size: number;
  /** Course Kit templates mixed in (ordering steps, rules, patterns…). */
  kit?: KitTemplate[];
  intro?: CodeIntroKey;
}

export type CodeKind = "code-run" | "code-debug" | "code-trace";

interface CodeBase {
  tour: CodeKind;
  /** The task this question came from (a replacement keeps the same task). */
  task: CodeTask;
  grid: CodeGrid;
  /** A correct program, for the teach card. */
  solution: CodeBlock[];
}

/**
 * Build a program, then RUN. Self-submitting: the widget plays the run and
 * reports codeVerdict(payload, program). answer = CODE_DONE.
 */
export interface RunPayload extends CodeBase {
  tour: "code-run";
  /** Top-level blocks allowed (a loop counts as one). */
  maxBlocks: number;
  /** Repeat counts on offer, e.g. [2, 3, 4]; empty = no loop block. */
  loops: number[];
  /** Easy mode: the path the program would take is drawn while building. */
  preview: boolean;
}

/**
 * A program with a bug. The child may change the direction of up to `edits`
 * arrows, then RUN. Self-submitting. answer = CODE_DONE.
 */
export interface DebugPayload extends CodeBase {
  tour: "code-debug";
  /** The buggy program as given (same shape as the fix: only arrows differ). */
  program: CodeBlock[];
  edits: number;
}

/** Read the program, tap the square where Pogo stops, CHECK. answer = traceAnswer(...). */
export interface TracePayload extends CodeBase {
  tour: "code-trace";
  /** The program to read (it never bumps into anything). */
  program: CodeBlock[];
}

export type CodePayload = RunPayload | DebugPayload | TracePayload;

/** Narrow a generic question to its code payload (null for everything else). */
export function codePayload(q: Question | null | undefined): CodePayload | null {
  const p = q?.payload as { tour?: unknown } | undefined;
  return q?.inputMode === "tour" && typeof p?.tour === "string" && p.tour.startsWith("code-")
    ? (q.payload as unknown as CodePayload)
    : null;
}
