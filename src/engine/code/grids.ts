// Shared pieces of the Code Lab puzzle generators: the build environment,
// grid geometry, the question factory, the sample-then-fall-back loop and the
// question-identity keys.
import type { Question } from "../generators/types";
import { randInt, shuffle, type RNG } from "../rng";
import { recordBuild } from "./genStats";
import { programKey, stepFrom } from "./judge";
import type { CodeBlock, CodeGrid, CodePayload, CodeTask, Dir } from "./types";

/** Everything one puzzle generator needs. */
export interface CodeEnv {
  rng: RNG;
  /** 0..1 — more walls, longer programs and tighter block limits as it grows. */
  difficulty: number;
  /** Set after repeated misses: the smallest grid, short programs, path preview on. */
  easier: boolean;
  /** Largest grid the lesson allows (4–6). */
  size: number;
}

export const DIRS: Dir[] = ["N", "E", "S", "W"];
export const OPPOSITE: Record<Dir, Dir> = { N: "S", E: "W", S: "N", W: "E" };

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function rowOf(sq: number, size: number): number {
  return Math.floor(sq / size);
}

export function colOf(sq: number, size: number): number {
  return sq % size;
}

export function distance(a: number, b: number, size: number): number {
  return Math.abs(rowOf(a, size) - rowOf(b, size)) + Math.abs(colOf(a, size) - colOf(b, size));
}

export function allSquares(size: number): number[] {
  return Array.from({ length: size * size }, (_, sq) => sq);
}

/** Grid width for this puzzle: 4 when gentle, sometimes one smaller early on, never above the lesson's size. */
export function gridSize(env: CodeEnv): number {
  const max = clamp(Math.round(env.size), 4, 6);
  if (env.easier) return 4;
  return env.difficulty < 0.35 && env.rng() < 0.5 ? Math.max(4, max - 1) : max;
}

/** How many rocks a puzzle gets: none at the very start, up to about one per row when hard. */
export function wallCount(env: CodeEnv, size: number): number {
  if (env.difficulty < 0.2) return 0;
  if (env.easier) return randInt(env.rng, 0, 1);
  return randInt(env.rng, 1, Math.max(1, Math.round(size * env.difficulty)));
}

/** Longest program a trace / run puzzle may need at this difficulty. */
export function longest(env: CodeEnv): number {
  return env.easier ? 4 : 4 + Math.round(4 * env.difficulty);
}

/** `amount` random squares that are not in `taken`. */
export function freeSample(rng: RNG, size: number, taken: Iterable<number>, amount: number): number[] {
  const busy = new Set(taken);
  return shuffle(rng, allSquares(size).filter((sq) => !busy.has(sq))).slice(0, Math.max(0, amount));
}

/** How many times the walk changes direction. */
export function turns(dirs: Dir[]): number {
  return dirs.filter((dir, i) => i > 0 && dir !== dirs[i - 1]).length;
}

/** Squares visited by plain steps from `start` (start first), or null on a bump. */
export function walk(grid: CodeGrid, dirs: Dir[]): number[] | null {
  const path = [grid.start];
  for (const dir of dirs) {
    const next = stepFrom(grid, path[path.length - 1], dir);
    if (next === null) return null;
    path.push(next);
  }
  return path;
}

export function selfAvoiding(path: number[]): boolean {
  return new Set(path).size === path.length;
}

/** Compact identity of a puzzle: size, start, flag, rocks, stars, then the program shown (if any). */
export function fingerprint(grid: CodeGrid, program: CodeBlock[] = []): string {
  const list = (squares: number[]) => [...squares].sort((a, b) => a - b).join(",");
  const base = `${grid.size}s${grid.start}g${grid.goal}w${list(grid.walls)}t${list(grid.stars)}`;
  return program.length ? `${base}p${programKey(program)}` : base;
}

export function codeQuestion(prompt: string, answer: string, hint: string, payload: CodePayload, print: string): Question {
  return {
    id: "",
    prompt,
    answer,
    choices: [],
    hint,
    inputMode: "tour",
    repeatable: true,
    dedupeKey: `code:${payload.task}:${print}`,
    payload: payload as unknown as Record<string, unknown>,
  };
}

const TRIES = 60;

/** How one task's puzzles are made. */
export interface Recipe {
  /** Sample one puzzle; null when it does not pass the task's checks. */
  attempt: (env: CodeEnv) => Question | null;
  /** A hand-built puzzle that is always valid — the last resort. */
  floor: (env: CodeEnv) => Question;
}

/**
 * Sample puzzles until one passes its checks. When the asked difficulty keeps
 * missing, the gentle variant is sampled; after that the recipe's floor is
 * used — so a generator never comes back empty.
 */
export function buildWithFallback(task: CodeTask, env: CodeEnv, recipe: Recipe): Question {
  for (let i = 0; i < TRIES; i++) {
    const question = recipe.attempt(env);
    if (question) {
      recordBuild(task, i + 1, "main");
      return question;
    }
  }
  const gentle: CodeEnv = { ...env, difficulty: Math.min(env.difficulty, 0.2), easier: true };
  for (let i = 0; i < TRIES; i++) {
    const question = recipe.attempt(gentle);
    if (question) {
      recordBuild(task, TRIES + i + 1, "gentle");
      return question;
    }
  }
  recordBuild(task, TRIES * 2, "floor");
  return recipe.floor(env);
}

// ---------- question identity ----------

export function subjectKey(dedupeKey: string): string {
  return `subject:${dedupeKey}`;
}

/**
 * Same identity keys as `questionKeys` in generators/index (which imports the
 * planner, so it cannot be imported back here). scripts/audit-code.ts checks
 * the two never drift apart.
 */
export function codeKeys(q: Question): string[] {
  const visible = `visible:${JSON.stringify([q.prompt, q.answer, q.payload ?? null])}`;
  return q.dedupeKey ? [subjectKey(q.dedupeKey), visible] : [visible];
}

export function isFresh(q: Question, seen: ReadonlySet<string>): boolean {
  return !codeKeys(q).some((key) => seen.has(key));
}

/** The same puzzle under a numbered subject, for a session that has truly seen everything. */
export function asVariant(q: Question, seen: ReadonlySet<string>): Question {
  let n = 2;
  while (seen.has(subjectKey(`${q.dedupeKey}#${n}`))) n++;
  return { ...q, dedupeKey: `${q.dedupeKey}#${n}` };
}
