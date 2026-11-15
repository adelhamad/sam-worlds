// Answer-integrity rule 1 for kit questions: a missed question is thrown away
// and replaced by a fresh one — the SAME template (same skill) with a different
// sample, preferably with a different answer, never one the session has shown.
// Only when that template is truly used up does it move to another template of
// the lesson, and only then to a numbered variant (it never comes back empty).
import type { GenContext, Question } from "../generators/types";
import { shuffle, type RNG } from "../rng";
import { freshSample, variantSample } from "./fresh";
import type { KitTemplate } from "./types";

/** Set by `kitSessionParams` after a miss. */
export interface KitReplace {
  /** Template of the missed question. */
  template: string;
  /** The missed question's answer — the replacement prefers a different one. */
  answer?: string;
}

/**
 * One question whose keys are not in `seen`. Pinned (`replace`) → that template
 * first, looked up in the lesson's own AND review templates. Unpinned (Code
 * Lab's kit slots, the registry's single form) → a seed-chosen template.
 */
export function planReplacement(
  main: KitTemplate[], review: KitTemplate[], rng: RNG, ctx: GenContext, seen: ReadonlySet<string>, replace?: KitReplace,
): Question {
  const all = [...main, ...review];
  const pinned = replace ? all.find((template) => template.id === replace.template) : undefined;
  if (pinned) {
    const own = freshSample(pinned, rng, ctx, seen, { anySize: true, avoidAnswer: replace?.answer });
    if (own) return own;
  }
  // Mostly the lesson's own templates; review ones after them.
  const others = [...shuffle(rng, main), ...shuffle(rng, review)].filter((template) => template !== pinned);
  for (const template of others) {
    const question = freshSample(template, rng, ctx, seen, { anySize: true });
    if (question) return question;
  }
  return variantSample(pinned ?? others[0], rng, ctx, seen);
}
