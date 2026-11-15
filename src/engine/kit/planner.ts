// Course Kit lesson planner — the entry point the course registry calls
// (engine/courses/planners.ts). A whole lesson is planned at once
// (lessonPlan.ts); a single question replaces a missed one (replacement.ts).
// Everything is deterministic from the seed; sampling lives in sample.ts.
import { mulberry32, type RNG } from "../rng";
import type { GenContext, GeneratorParams, Question } from "../generators/types";
import { planLesson } from "./lessonPlan";
import { planReplacement, type KitReplace } from "./replacement";
import { kitPayload, type KitParams, type KitTemplate } from "./types";

export type { KitReplace } from "./replacement";
export { templateVariety } from "./variety";

/** Stage params plus the miss flow's pin. */
export type KitSessionParams = KitParams & { replace?: KitReplace };

const listOf = (value: unknown): KitTemplate[] => (Array.isArray(value) ? (value as KitTemplate[]) : []);

/** The miss flow's pin, when it is well-formed. */
function replaceOf(params: KitSessionParams): KitReplace | undefined {
  const replace = params.replace;
  return replace && typeof replace.template === "string" ? replace : undefined;
}

/**
 * Plan a whole lesson: `count` questions drawn from the lesson's templates
 * (and some review). With `count = 1` it replaces a missed question: same
 * template (`params.replace`), a different sample, and no key in `excluded`.
 * A whole lesson ignores `excluded`: kit questions are repeatable and never
 * enter the seen history (and a replay must plan the same lesson).
 */
export function planKitLesson(
  params: KitParams, count: number, seed: number, ctx: GenContext, excluded: Iterable<string> = [],
): Question[] {
  if (count < 1) return [];
  const session = params as KitSessionParams;
  let main = listOf(session.templates);
  let review = listOf(session.review);
  if (!main.length) [main, review] = [review, []];
  if (!main.length) throw new Error("Course Kit: this lesson has no templates (neither `templates` nor `review`)");
  const rng = mulberry32(seed);
  const questions = count === 1
    ? [planReplacement(main, review, rng, ctx, new Set(excluded), replaceOf(session))]
    : planLesson(main, review, count, rng, ctx);
  return questions.map((question, index) => ({ ...question, id: `kit-${seed}-${index}` }));
}

/** Single-question form required by the generator registry. */
export function generateKit(params: KitParams, rng: RNG, ctx: GenContext): Question {
  return planKitLesson(params, 1, Math.floor(rng() * 0x7fffffff), ctx)[0];
}

/** Pin a replacement to the template that was just missed ("new values, same skill"). */
export function kitSessionParams(question: Question | undefined, params: GeneratorParams): GeneratorParams {
  const payload = kitPayload(question);
  if (!payload || !question) return params;
  const replace: KitReplace = { template: payload.template, answer: question.answer };
  return { ...params, replace };
}
