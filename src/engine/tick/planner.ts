// Tick Tock lesson planner — the entry point the course registry calls
// (engine/courses/planners.ts). A whole lesson is planned at once
// (lessonPlan.ts); a single question replaces a missed one (replacement.ts).
// Everything is deterministic from the seed.
import { mulberry32, type RNG } from "../rng";
import type { GenContext, GeneratorParams, Question } from "../generators/types";
import { kitPayload } from "../kit/types";
import { planLesson } from "./lessonPlan";
import { planReplacement, type TickReplace } from "./replacement";
import { makeSpec } from "./sources";
import { TICK_TASKS } from "./times";
import { tickPayload, type TickParams, type TickTask } from "./types";

export type { TickReplace } from "./replacement";

/** Stage params plus the optional pin the miss flow adds for a replacement. */
export type TickSessionParams = TickParams & { replace?: TickReplace };

/**
 * Plan a whole lesson: `count` puzzles balanced across the lesson's tasks (and
 * its kit templates). With `count = 1` it replaces a missed puzzle — same task
 * (`params.replace`), a different time, and no key in `excluded`. A whole
 * lesson ignores `excluded` (repeatable questions; a replay plans the same lesson).
 */
export function planTickLesson(
  params: TickParams, count: number, seed: number, ctx: GenContext, excluded: Iterable<string> = [],
): Question[] {
  if (count < 1) return [];
  const rng = mulberry32(seed);
  const spec = makeSpec(params);
  const replace = (params as TickSessionParams).replace;
  const questions = count === 1
    ? [planReplacement(spec, rng, ctx, new Set(excluded), replace)]
    : planLesson(spec, count, rng, ctx);
  return questions.map((question, index) => ({ ...question, id: `tick-${seed}-${index}` }));
}

/** Single-question form required by the generator registry. */
export function generateTick(params: TickParams, rng: RNG, ctx: GenContext): Question {
  return planTickLesson(params, 1, Math.floor(rng() * 0x7fffffff), ctx)[0];
}

/** Pin a replacement to the task (or kit template) that was just missed ("new values, same skill"). */
export function tickSessionParams(question: Question | undefined, params: GeneratorParams): GeneratorParams {
  const tick = tickPayload(question);
  if (tick && question) return { ...params, replace: { task: tick.task, answer: question.answer } satisfies TickReplace };
  const kit = kitPayload(question);
  if (!kit || !question) return params;
  const replace: TickReplace = TICK_TASKS.includes(kit.template as TickTask)
    ? { task: kit.template as TickTask, answer: question.answer }
    : { template: kit.template, answer: question.answer };
  return { ...params, replace };
}
