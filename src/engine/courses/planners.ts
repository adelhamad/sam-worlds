// Every course's lesson planner, in one place. A course plans a whole lesson
// at once (balanced, with spaced review) instead of drawing questions one by
// one, and pins the replacement for a missed question to the same skill.
// ADDING A COURSE WITH ITS OWN MECHANIC = one entry here (kit-only courses
// reuse "kit" and need nothing). See docs/COURSE_KIT.md.
import type { GenContext, GeneratorParams, Question } from "../generators/types";
import type { RNG } from "../rng";
import { generateChess, planChessLesson } from "../chess/planner";
import { chessSessionParams } from "../chess/sessionParams";
import { codeSessionParams, generateCode, planCodeLesson } from "../code/planner";
import { generateKit, kitSessionParams, planKitLesson } from "../kit/planner";
import { generateTick, planTickLesson, tickSessionParams } from "../tick/planner";
import { generateTour, planTourLesson } from "../tour/planner";
import { tourSessionParams } from "../tour/sessionParams";

export interface CoursePlanner {
  /** `count` questions for a lesson; with count = 1, a replacement that avoids `excluded`. */
  plan: (params: GeneratorParams, count: number, seed: number, ctx: GenContext, excluded: Iterable<string>) => Question[];
  /** One random question (generator-registry form). */
  single: (params: GeneratorParams, rng: RNG, ctx: GenContext) => Question;
  /** Params for the replacement of `question` ("new values, same skill"). */
  sessionParams: (question: Question | undefined, params: GeneratorParams) => GeneratorParams;
}

type Plan<P> = (params: P, count: number, seed: number, ctx: GenContext, excluded: Iterable<string>) => Question[];
type Single<P> = (params: P, rng: RNG, ctx: GenContext) => Question;

function planner<P>(plan: Plan<P>, single: Single<P>, sessionParams: CoursePlanner["sessionParams"]): CoursePlanner {
  return {
    plan: (params, count, seed, ctx, excluded) => plan(params as unknown as P, count, seed, ctx, excluded),
    single: (params, rng, ctx) => single(params as unknown as P, rng, ctx),
    sessionParams,
  };
}

export const COURSE_PLANNERS = {
  tour: planner(planTourLesson, generateTour, tourSessionParams),
  chess: planner(planChessLesson, generateChess, chessSessionParams),
  kit: planner(planKitLesson, generateKit, kitSessionParams),
  code: planner(planCodeLesson, generateCode, codeSessionParams),
  tick: planner(planTickLesson, generateTick, tickSessionParams),
} satisfies Record<string, CoursePlanner>;

export type CourseGeneratorId = keyof typeof COURSE_PLANNERS;

export function coursePlanner(id: string): CoursePlanner | undefined {
  return (COURSE_PLANNERS as Record<string, CoursePlanner>)[id];
}
