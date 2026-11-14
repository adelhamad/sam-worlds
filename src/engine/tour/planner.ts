// World Tour lesson planner — the entry point the generator registry calls.
// A whole lesson is planned at once (lesson.ts); a single question replaces a
// missed one (replacement.ts). Everything is deterministic from the seed.
import { mulberry32, type RNG } from "../rng";
import type { GenContext, Question } from "../generators/types";
import { planLesson } from "./lesson";
import { TOUR_KINDS, makePool } from "./pool";
import { planReplacement } from "./replacement";
import type { TourReplace, TourSessionParams } from "./sessionParams";
import type { TourKind, TourParams } from "./types";

function lessonKinds(kinds: unknown): TourKind[] {
  const asked = Array.isArray(kinds) ? TOUR_KINDS.filter((kind) => kinds.includes(kind)) : [];
  return asked.length ? asked : TOUR_KINDS;
}

/** The miss flow's pin, when it is well-formed. */
function replaceOf(params: TourSessionParams): TourReplace | undefined {
  const replace = params.replace;
  if (!replace || !TOUR_KINDS.includes(replace.kind) || !Array.isArray(replace.avoid)) return undefined;
  return replace;
}

/**
 * Plan a whole lesson: `count` questions, balanced across the lesson's focus
 * countries and exercise kinds. Also used with `count = 1` to replace a missed
 * question — then it avoids every key in `excluded` (the session's seen keys)
 * so the child gets a genuinely fresh question. A whole lesson ignores
 * `excluded`: tour questions are repeatable and never enter the seen history.
 */
export function planTourLesson(
  params: TourSessionParams, count: number, seed: number, ctx: GenContext, excluded: Iterable<string> = [],
): Question[] {
  if (count < 1) return [];
  const rng = mulberry32(seed);
  const pool = makePool(params);
  const kinds = lessonKinds(params.kinds);
  const questions = count === 1
    ? [planReplacement(pool, kinds, rng, ctx, new Set(excluded), replaceOf(params))]
    : planLesson(pool, kinds, count, rng, ctx);
  return questions.map((question, index) => ({ ...question, id: `tour-${seed}-${index}` }));
}

/** Single-question form required by the generator registry. */
export function generateTour(params: TourParams, rng: RNG, ctx: GenContext): Question {
  return planTourLesson(params, 1, Math.floor(rng() * 0x7fffffff), ctx)[0];
}
