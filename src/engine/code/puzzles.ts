// The Code Lab lesson's building blocks: its spec (tasks, kit templates, grid
// size), the SOURCES a slot can draw from (a code task or a kit template), and
// one puzzle of a task at a given difficulty.
import type { GenContext, Question } from "../generators/types";
import type { RNG } from "../rng";
import type { KitTemplate } from "../kit/types";
import { buildDebug, debugFloor } from "./debugPuzzles";
import { clamp, type CodeEnv } from "./grids";
import { buildLoop, buildLoopTrace, loopFloor, loopTraceFloor } from "./loopPuzzles";
import { buildRun, buildStars, runFloor, starsFloor } from "./runPuzzles";
import { buildTrace, traceFloor } from "./tracePuzzles";
import type { CodeParams, CodeTask } from "./types";

/** Every task, gentlest first. */
export const CODE_TASKS: CodeTask[] = ["trace", "run", "stars", "loop-trace", "loop", "debug"];
/** Tasks where the child builds or fixes a program and presses RUN — a lesson finishes on one. */
export const RUN_TASKS: CodeTask[] = ["run", "stars", "loop", "debug"];

export interface LessonSpec {
  tasks: CodeTask[];
  kit: KitTemplate[];
  /** Largest grid (4–6). */
  size: number;
}

/** A slot's source: a code task, or a kit template by id. */
export type Source = { kind: "task"; task: CodeTask } | { kind: "kit"; template: KitTemplate };

export function sourceKey(source: Source): string {
  return source.kind === "task" ? source.task : `kit:${source.template.id}`;
}

/** Well-formed lesson spec from stage params (unknown tasks dropped; never empty). */
export function makeSpec(params: Partial<CodeParams>): LessonSpec {
  const tasks = [...new Set((params.tasks ?? []).filter((task) => CODE_TASKS.includes(task)))];
  const kit = (params.kit ?? []).filter((template, i, all) => all.findIndex((other) => other.id === template.id) === i);
  const size = clamp(Math.round(Number(params.size) || 5), 4, 6);
  return { tasks: tasks.length || kit.length ? tasks : ["run"], kit, size };
}

export function lessonSources(spec: LessonSpec): Source[] {
  return [
    ...spec.tasks.map((task): Source => ({ kind: "task", task })),
    ...spec.kit.map((template): Source => ({ kind: "kit", template })),
  ];
}

/** Lower = gentler: reading code first, then cards, then building. */
export function gentleness(source: Source): number {
  if (source.kind === "kit") return 0.5;
  return CODE_TASKS.indexOf(source.task) + (source.task === "trace" ? 0 : 1);
}

export function isRunStyle(source: Source): boolean {
  return source.kind === "task" && RUN_TASKS.includes(source.task);
}

/** One puzzle of `task` at this difficulty (never fails: the generators fall back). */
export function buildPuzzle(task: CodeTask, spec: LessonSpec, rng: RNG, ctx: GenContext): Question {
  const env: CodeEnv = { rng, difficulty: clamp(ctx.difficulty, 0, 1), easier: ctx.easier, size: spec.size };
  switch (task) {
    case "trace": return buildTrace(env);
    case "stars": return buildStars(env);
    case "debug": return buildDebug(env);
    case "loop": return buildLoop(env);
    case "loop-trace": return buildLoopTrace(env);
    default: return buildRun(env);
  }
}

/** The hand-built last-resort puzzle of `task` (the audit checks every one is valid). */
export function floorPuzzle(task: CodeTask, spec: LessonSpec, rng: RNG, ctx: GenContext): Question {
  const env: CodeEnv = { rng, difficulty: clamp(ctx.difficulty, 0, 1), easier: ctx.easier, size: spec.size };
  switch (task) {
    case "trace": return traceFloor(env);
    case "stars": return starsFloor(env);
    case "debug": return debugFloor(env);
    case "loop": return loopFloor(env);
    case "loop-trace": return loopTraceFloor(env);
    default: return runFloor(env);
  }
}
