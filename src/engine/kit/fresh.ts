// The freshness search shared by the lesson planner and the miss replacement:
// draw samples of one template until one is unseen. A template's pools are
// small, so the search is generous (a few hundred tiny draws) before it calls a
// template "used up", and it tries the template's other sizes before giving up.
import type { GenContext, Question } from "../generators/types";
import type { RNG } from "../rng";
import { isFresh, sampleTemplate, subjectKey } from "./sample";
import type { KitTemplate } from "./types";

/** Draws at the asked sizes, then at each alternative size. */
const DRAWS = 240;
const ALT_DRAWS = 80;

export interface FreshOptions {
  /** Prefer a sample whose answer differs from this one (the missed question's). */
  avoidAnswer?: string;
  /** Also try the template's other sizes (gentler / harder) before giving up. */
  anySize?: boolean;
}

/** Other sizes the same template can be asked at. */
function alternatives(ctx: GenContext): GenContext[] {
  return [ctx.difficulty, 0.1, 0.5, 0.9]
    .flatMap((difficulty) => [false, true].map((easier) => ({ difficulty, easier })))
    .filter((level) => level.difficulty !== ctx.difficulty || level.easier !== ctx.easier);
}

function draw(
  template: KitTemplate, rng: RNG, ctx: GenContext, seen: ReadonlySet<string>, tries: number, avoid?: string,
): Question | null {
  for (let i = 0; i < tries; i++) {
    const { question } = sampleTemplate(template, rng, ctx);
    if (isFresh(question, seen) && question.answer !== avoid) return question;
  }
  return null;
}

/** An unseen sample of `template`, or null when it has none left (that we could find). */
export function freshSample(
  template: KitTemplate, rng: RNG, ctx: GenContext, seen: ReadonlySet<string>, options: FreshOptions = {},
): Question | null {
  const contexts = options.anySize ? [ctx, ...alternatives(ctx)] : [ctx];
  // A different answer first (rule 1: the child must not just copy the worked example), then any unseen one.
  const passes = options.avoidAnswer === undefined ? [undefined] : [options.avoidAnswer, undefined];
  for (const avoid of passes) {
    for (const [index, level] of contexts.entries()) {
      const question = draw(template, rng, level, seen, index ? ALT_DRAWS : DRAWS, avoid);
      if (question) return question;
    }
  }
  return null;
}

/**
 * Truly everything has been shown: the same template again under a numbered
 * subject, so a question never comes back empty. A reshuffled card order is
 * preferred so even the visible question differs.
 */
export function variantSample(template: KitTemplate, rng: RNG, ctx: GenContext, seen: ReadonlySet<string>): Question {
  let best: Question | null = null;
  for (let i = 0; i < 40; i++) {
    const { question } = sampleTemplate(template, rng, i % 2 ? { ...ctx, easier: !ctx.easier } : ctx);
    const variant = numbered(question, seen);
    if (isFresh(variant, seen)) return variant;
    best ??= variant;
  }
  return best as Question;
}

function numbered(q: Question, seen: ReadonlySet<string>): Question {
  let n = 2;
  while (seen.has(subjectKey(`${q.dedupeKey}#${n}`))) n++;
  return { ...q, dedupeKey: `${q.dedupeKey}#${n}` };
}
