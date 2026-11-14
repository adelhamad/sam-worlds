// Chess Camp lesson planner — the entry point the generator registry calls.
// A whole lesson is planned at once (lessonPlan.ts); a single puzzle replaces a
// missed one (replacement.ts). Everything is deterministic from the seed.
import { mulberry32, type RNG } from "../rng";
import type { GenContext, Question } from "../generators/types";
import { ALL_PIECES } from "./boards";
import { planLesson } from "./lessonPlan";
import { CHESS_TASKS, makeSpec } from "./puzzles";
import { planReplacement } from "./replacement";
import type { ChessReplace, ChessSessionParams } from "./sessionParams";
import type { ChessParams } from "./types";

/** The miss flow's pin, when it is well-formed. */
function replaceOf(params: ChessSessionParams): ChessReplace | undefined {
  const replace = params.replace;
  if (!replace || !CHESS_TASKS.includes(replace.task) || !ALL_PIECES.includes(replace.piece)) return undefined;
  return replace;
}

/**
 * Plan a whole lesson: `count` puzzles balanced across the lesson's tasks and
 * pieces. Also used with `count = 1` to replace a missed puzzle — then it
 * avoids every key in `excluded` (the session's seen keys), so the child gets a
 * different board. A whole lesson ignores `excluded`: chess puzzles are
 * repeatable and never enter the seen history.
 */
export function planChessLesson(
  params: ChessSessionParams, count: number, seed: number, ctx: GenContext, excluded: Iterable<string> = [],
): Question[] {
  if (count < 1) return [];
  const rng = mulberry32(seed);
  const spec = makeSpec(params);
  const questions = count === 1
    ? [planReplacement(spec, rng, ctx, new Set(excluded), replaceOf(params))]
    : planLesson(spec, count, rng, ctx);
  return questions.map((question, index) => ({ ...question, id: `chess-${seed}-${index}` }));
}

/** Single-question form required by the generator registry. */
export function generateChess(params: ChessParams, rng: RNG, ctx: GenContext): Question {
  return planChessLesson(params, 1, Math.floor(rng() * 0x7fffffff), ctx)[0];
}
