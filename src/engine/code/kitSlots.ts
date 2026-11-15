// Course Kit questions inside a Code Lab lesson (ordering steps, rules,
// patterns). The kit planner builds them; this only pins the template (and,
// for a replacement, the missed answer to avoid) and keeps asking until the
// question is one the session has not shown.
import type { GenContext, Question } from "../generators/types";
import type { RNG } from "../rng";
import { planKitLesson, type KitSessionParams } from "../kit/planner";
import type { KitTemplate } from "../kit/types";
import { asVariant, isFresh } from "./grids";

/** One kit question of `template` only (pinned, so the kit planner never wanders to another template). */
function sample(template: KitTemplate, rng: RNG, ctx: GenContext, seen: ReadonlySet<string>, avoidAnswer?: string): Question {
  const params: KitSessionParams = { templates: [template], review: [], replace: { template: template.id, answer: avoidAnswer } };
  return planKitLesson(params, 1, Math.floor(rng() * 0x7fffffff), ctx, seen)[0];
}

/** A question of `template` whose keys are not in `seen` (and, when possible, another answer than `avoidAnswer`). */
function freshKit(
  template: KitTemplate, rng: RNG, ctx: GenContext, seen: ReadonlySet<string>, tries: number, avoidAnswer?: string,
): Question | null {
  let fallback: Question | null = null;
  for (let i = 0; i < tries; i++) {
    const question = sample(template, rng, ctx, seen, avoidAnswer);
    if (!question || !isFresh(question, seen)) continue;
    if (question.answer !== avoidAnswer) return question;
    fallback ??= question;
  }
  return fallback;
}

/** Always a question of `template`: fresh when possible, else under a numbered subject. */
export function kitQuestion(
  template: KitTemplate, rng: RNG, ctx: GenContext, seen: ReadonlySet<string>, tries: number, avoidAnswer?: string,
): Question {
  return freshKit(template, rng, ctx, seen, tries, avoidAnswer) ?? asVariant(sample(template, rng, ctx, seen, avoidAnswer), seen);
}
