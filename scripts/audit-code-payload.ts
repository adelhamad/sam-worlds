// Code Lab audit, part 1: checks ONE question against the contract in
// src/engine/code/types.ts. The search used to prove "shortest" and "a loop is
// needed" is written here from scratch (it does not reuse the engine solver).
import { CODE_DONE, arrowsChanged, codeVerdict, debugVerdict, flatten, runProgram, traceAnswer } from "../src/engine/code/judge";
import {
  codePayload, type CodeBlock, type CodeGrid, type CodePayload, type CodeTask, type DebugPayload, type Dir, type RunPayload,
  type TracePayload,
} from "../src/engine/code/types";
import type { Question } from "../src/engine/generators/types";
import { kitPayload } from "../src/engine/kit/types";

const KIND: Record<CodeTask, CodePayload["tour"]> = {
  run: "code-run", stars: "code-run", loop: "code-run", debug: "code-debug", trace: "code-trace", "loop-trace": "code-trace",
};
const MOVE: Record<Dir, [number, number]> = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };

/** What the audit knows about the slot that produced a question. */
export interface Expect {
  tasks: CodeTask[];
  templates: string[];
  /** Largest grid allowed (4 when easier). */
  size: number;
  /** Below 0.6 a debug bug must have exactly one single-arrow fix. */
  strictDebug: boolean;
}

export interface Tally {
  debugAmbiguous: number;
}

export const tally: Tally = { debugAmbiguous: 0 };

/** Independent BFS: fewest plain arrows that win (Infinity when none). */
export function bfsLength(grid: CodeGrid): number {
  const full = (1 << grid.stars.length) - 1;
  const wall = new Set(grid.walls);
  const key = (sq: number, mask: number) => sq * 16 + mask;
  let frontier = [[grid.start, 0]];
  const seen = new Set([key(grid.start, 0)]);
  for (let length = 1; frontier.length && length <= 64; length++) {
    const next: number[][] = [];
    for (const [sq, mask] of frontier) {
      for (const [dr, dc] of Object.values(MOVE)) {
        const row = Math.floor(sq / grid.size) + dr;
        const col = (sq % grid.size) + dc;
        if (row < 0 || col < 0 || row >= grid.size || col >= grid.size || wall.has(row * grid.size + col)) continue;
        const to = row * grid.size + col;
        const star = grid.stars.indexOf(to);
        const got = star < 0 ? mask : mask | (1 << star);
        if (to === grid.goal && got === full) return length;
        if (seen.has(key(to, got))) continue;
        seen.add(key(to, got));
        next.push([to, got]);
      }
    }
    frontier = next;
  }
  return Infinity;
}

const words = (text: string) => text.trim().split(/\s+/).length;
const plain = (program: CodeBlock[]) => program.every((block) => typeof block === "string");
const loopsIn = (program: CodeBlock[]) => program.filter((block) => typeof block !== "string");

function checkText(q: Question, label: string, failures: string[]): void {
  if (!q.prompt.trim() || !q.answer.trim() || !q.hint.trim()) failures.push(`${label}: blank prompt, answer or hint`);
  if (/wrong|fail/i.test(`${q.prompt} ${q.hint}`)) failures.push(`${label}: forbidden word in "${q.prompt}" / "${q.hint}"`);
  if (q.inputMode !== "tour" || q.repeatable !== true || q.choices.length) failures.push(`${label}: not a repeatable tour question`);
}

function checkGrid(grid: CodeGrid, expect: Expect, trace: boolean, label: string, failures: string[]): void {
  const cells = grid.size * grid.size;
  const inside = (sq: number) => Number.isInteger(sq) && sq >= 0 && sq < cells;
  if (grid.size < 4 || grid.size > 6 || grid.size > expect.size) failures.push(`${label}: grid size ${grid.size} (max ${expect.size})`);
  const marks = [grid.start, ...grid.walls, ...grid.stars, ...(trace ? [] : [grid.goal])];
  if (!marks.every(inside)) failures.push(`${label}: a square is off the grid`);
  if (new Set(marks).size !== marks.length) failures.push(`${label}: start / flag / rocks / stars overlap`);
  if (trace && (grid.goal !== -1 || grid.stars.length)) failures.push(`${label}: a trace grid has a flag or stars`);
  if (!trace && grid.start === grid.goal) failures.push(`${label}: start is the flag`);
}

function checkRun(p: RunPayload, q: Question, label: string, failures: string[]): void {
  if (codeVerdict(p, p.solution) !== CODE_DONE) failures.push(`${label}: the solution does not win`);
  if (p.solution.length > p.maxBlocks) failures.push(`${label}: solution does not fit maxBlocks`);
  const shortest = bfsLength(p.grid);
  if (p.task === "loop") {
    const loops = loopsIn(p.solution);
    if (loops.length !== 1 || !p.loops.includes((loops[0] as { times: number }).times)) failures.push(`${label}: loop count not on offer`);
    if (p.maxBlocks !== p.solution.length) failures.push(`${label}: loop maxBlocks ${p.maxBlocks} ≠ ${p.solution.length}`);
    if (shortest <= p.maxBlocks) failures.push(`${label}: plain arrows (${shortest}) win within ${p.maxBlocks} blocks`);
    if (p.preview || p.grid.stars.length) failures.push(`${label}: loop puzzle with preview or stars`);
    return;
  }
  if (!plain(p.solution) || p.loops.length) failures.push(`${label}: ${p.task} puzzle with a loop`);
  if (shortest !== p.solution.length) failures.push(`${label}: solution ${p.solution.length} arrows, shortest is ${shortest}`);
  if (p.solution.length < 2 || p.solution.length > 9) failures.push(`${label}: solution length ${p.solution.length}`);
  const stars = p.grid.stars.length;
  if (p.task === "stars" ? stars < 1 || stars > 3 : stars !== 0) failures.push(`${label}: ${stars} stars in a ${p.task} puzzle`);
  const slack = p.maxBlocks - p.solution.length;
  if (slack < 0 || slack > 2) failures.push(`${label}: slack ${slack}`);
  if (p.task === "run" && (slack === 0) !== /shortest/i.test(q.prompt)) failures.push(`${label}: prompt does not match slack ${slack}`);
}

function checkDebug(p: DebugPayload, expect: Expect, label: string, failures: string[]): void {
  if (p.edits !== 1) failures.push(`${label}: edits ${p.edits}`);
  if (runProgram(p.grid, p.program).won) failures.push(`${label}: the buggy program already wins`);
  if (debugVerdict(p, p.solution) !== CODE_DONE) failures.push(`${label}: the fix does not win`);
  if (arrowsChanged(p.program, p.solution) !== 1) failures.push(`${label}: fix changes ${arrowsChanged(p.program, p.solution)} arrows`);
  if (p.program.length < 4 || p.program.length > 7 || !plain(p.program)) failures.push(`${label}: debug program shape`);
  if (p.grid.stars.length) failures.push(`${label}: debug puzzle with stars`);
  let fixes = 0;
  p.program.forEach((_, i) => {
    for (const dir of Object.keys(MOVE) as Dir[]) {
      const edited = [...p.program];
      edited[i] = dir;
      if (dir !== p.program[i] && runProgram(p.grid, edited).won) fixes++;
    }
  });
  if (fixes < 1) failures.push(`${label}: no single-arrow fix`);
  if (fixes > 1) tally.debugAmbiguous++;
  if (fixes > 1 && expect.strictDebug) failures.push(`${label}: ${fixes} single-arrow fixes at low difficulty`);
}

function checkTrace(p: TracePayload, q: Question, label: string, failures: string[]): void {
  const run = runProgram(p.grid, p.program);
  if (run.bumped) failures.push(`${label}: the program bumps`);
  if (q.answer !== traceAnswer(p.grid, p.program)) failures.push(`${label}: answer ${q.answer} ≠ ${traceAnswer(p.grid, p.program)}`);
  if (run.end === p.grid.start) failures.push(`${label}: ends on the start`);
  if (new Set(run.path).size !== run.path.length) failures.push(`${label}: the program revisits a square`);
  if (JSON.stringify(p.solution) !== JSON.stringify(p.program)) failures.push(`${label}: solution ≠ program`);
  const steps = flatten(p.program).length;
  if (p.task === "trace" && (!plain(p.program) || steps < 3 || steps > 8)) failures.push(`${label}: trace program of ${steps} arrows`);
  if (p.task === "loop-trace") {
    const extras = p.program.length - 1;
    if (loopsIn(p.program).length !== 1 || extras > 2) failures.push(`${label}: loop-trace shape ${JSON.stringify(p.program)}`);
  }
}

function checkKit(q: Question, expect: Expect, label: string, failures: string[]): void {
  const kit = kitPayload(q);
  if (!kit) {
    failures.push(`${label}: neither a code nor a kit payload`);
    return;
  }
  if (!expect.templates.includes(kit.template)) failures.push(`${label}: kit template ${kit.template} not in the lesson`);
}

/** All contract checks; returns the code payload (null for kit questions or a broken payload). */
export function checkCodeQuestion(q: Question, expect: Expect, label: string, failures: string[]): CodePayload | null {
  checkText(q, label, failures);
  const p = codePayload(q);
  if (!p) {
    checkKit(q, expect, label, failures);
    return null;
  }
  if (!expect.tasks.includes(p.task)) failures.push(`${label}: task ${p.task} not in the lesson`);
  if (KIND[p.task] !== p.tour) failures.push(`${label}: ${p.task} puzzle with payload ${p.tour}`);
  if (words(q.prompt) > 8) failures.push(`${label}: prompt over 8 words`);
  if (!q.dedupeKey?.startsWith(`code:${p.task}:`)) failures.push(`${label}: dedupeKey ${q.dedupeKey}`);
  const trace = p.tour === "code-trace";
  checkGrid(p.grid, expect, trace, label, failures);
  if (p.tour === "code-run") checkRun(p, q, label, failures);
  else if (p.tour === "code-debug") checkDebug(p, expect, label, failures);
  else checkTrace(p, q, label, failures);
  if (p.tour !== "code-trace" && q.answer !== CODE_DONE) failures.push(`${label}: answer ${q.answer}`);
  return p;
}
