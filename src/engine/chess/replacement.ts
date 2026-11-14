// Answer-integrity rule 1 for Chess Camp: a missed puzzle is thrown away and
// replaced by a fresh one — the same task (and the same piece when possible)
// on a DIFFERENT board, never one the session has already shown.
import type { GenContext, Question } from "../generators/types";
import { pick, shuffle, type RNG } from "../rng";
import { asVariant, isFresh } from "./boards";
import { buildPuzzle, heroesFor, supports, type LessonSpec } from "./puzzles";
import type { ChessReplace } from "./sessionParams";
import type { ChessTask, PieceType } from "./types";

/** Builds tried at the asked difficulty before the search looks at every level. */
const SAME_LEVEL = 12;
const ANY_LEVEL = 30;

interface Search {
  spec: LessonSpec;
  rng: RNG;
  ctx: GenContext;
  seen: ReadonlySet<string>;
}

/** A board the session has not met: first at the asked difficulty, then at any. */
function freshBoard(search: Search, task: ChessTask, pieces: PieceType[]): Question | null {
  const { spec, rng, ctx, seen } = search;
  for (let i = 0; i < SAME_LEVEL + ANY_LEVEL; i++) {
    const level = i < SAME_LEVEL ? ctx : { difficulty: rng(), easier: i % 2 === 0 };
    const question = buildPuzzle(task, pick(rng, pieces), spec, rng, level);
    if (isFresh(question, seen)) return question;
  }
  return null;
}

/**
 * One puzzle whose keys are not in `seen`. With `replace` (set after a miss) it
 * keeps the missed puzzle's task and piece; when that piece has no board left
 * it moves to the lesson's other pieces, and only then to another task.
 */
export function planReplacement(
  spec: LessonSpec, rng: RNG, ctx: GenContext, seen: ReadonlySet<string>, replace?: ChessReplace,
): Question {
  const search: Search = { spec, rng, ctx, seen };
  const task = replace?.task ?? pick(rng, spec.tasks);
  const heroes = heroesFor(task, spec);
  const pinned = replace && supports(task, replace.piece) ? [replace.piece] : heroes;
  const own = freshBoard(search, task, pinned) ?? freshBoard(search, task, heroes);
  if (own) return own;
  for (const other of shuffle(rng, spec.tasks.filter((name) => name !== task))) {
    const question = freshBoard(search, other, heroesFor(other, spec));
    if (question) return question;
  }
  // Truly everything has been shown: the same task again, under a numbered subject.
  return asVariant(buildPuzzle(task, pinned[0], spec, rng, { difficulty: rng(), easier: false }), seen);
}
