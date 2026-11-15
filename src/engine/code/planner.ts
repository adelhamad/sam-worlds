// Code Lab lesson planner — the entry point the generator registry calls.
// A whole lesson is planned at once (lessonPlan.ts); a single question
// replaces a missed one (replacement.ts). Everything is deterministic from the seed.
import { mulberry32, type RNG } from "../rng";
import type { GenContext, GeneratorParams, Question } from "../generators/types";
import { kitPayload } from "../kit/types";
import { planLesson } from "./lessonPlan";
import { makeSpec } from "./puzzles";
import { planReplacement, type CodeReplace } from "./replacement";
import { codePayload, type CodeParams } from "./types";

/** Stage params plus the optional pin the miss flow adds for a replacement. */
export type CodeSessionParams = CodeParams & { replace?: CodeReplace };

/**
 * Plan a whole lesson: `count` puzzles balanced across the lesson's tasks and
 * kit templates. With `count = 1` it replaces a missed puzzle — same task
 * (`params.replace`), a different grid, and no key in `excluded`. A whole
 * lesson ignores `excluded` (repeatable questions; a replay plans the same lesson).
 */
export function planCodeLesson(
  params: CodeSessionParams, count: number, seed: number, ctx: GenContext, excluded: Iterable<string> = [],
): Question[] {
  if (count < 1) return [];
  const rng = mulberry32(seed);
  const spec = makeSpec(params);
  const questions = count === 1
    ? [planReplacement(spec, rng, ctx, new Set(excluded), params.replace)]
    : planLesson(spec, count, rng, ctx);
  return questions.map((question, index) => ({ ...question, id: `code-${seed}-${index}` }));
}

/** Single-question form required by the generator registry. */
export function generateCode(params: CodeParams, rng: RNG, ctx: GenContext): Question {
  return planCodeLesson(params, 1, Math.floor(rng() * 0x7fffffff), ctx)[0];
}

/** Pin a replacement to the task (or kit template) that was just missed ("new values, same skill"). */
export function codeSessionParams(question: Question | undefined, params: GeneratorParams): GeneratorParams {
  const code = codePayload(question);
  if (code) return { ...params, replace: { task: code.task } satisfies CodeReplace };
  const kit = kitPayload(question);
  if (!kit || !question) return params;
  return { ...params, replace: { template: kit.template, answer: question.answer } satisfies CodeReplace };
}
