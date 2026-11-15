// Answer-integrity rule 1 for Code Lab: a missed question is thrown away and
// replaced by a fresh one — the same task (or the same kit template) on a
// DIFFERENT puzzle, never one the session has already shown.
import type { GenContext, Question } from "../generators/types";
import { pick, type RNG } from "../rng";
import { freshPuzzle } from "./lessonPlan";
import { kitQuestion } from "./kitSlots";
import { CODE_TASKS, lessonSources, type LessonSpec, type Source } from "./puzzles";
import type { CodeTask } from "./types";

/** Builds tried at the asked difficulty, then at any difficulty. */
const SAME_LEVEL = 12;
const ANY_LEVEL = 40;
const KIT_TRIES = 30;

/** The miss flow's pin: the missed question's task, or its kit template id. */
export interface CodeReplace {
  task?: CodeTask;
  template?: string;
  /** A missed kit question's answer — its replacement prefers a different one. */
  answer?: string;
}

/** The pinned source when it is well-formed, else any source of the lesson. */
function replacedSource(spec: LessonSpec, rng: RNG, replace: CodeReplace | undefined): Source {
  const template = replace?.template ? spec.kit.find((entry) => entry.id === replace.template) : undefined;
  if (template) return { kind: "kit", template };
  if (replace?.task && CODE_TASKS.includes(replace.task)) return { kind: "task", task: replace.task };
  return pick(rng, lessonSources(spec));
}

/** One question whose keys are not in `seen`, of the pinned task / template when there is one. */
export function planReplacement(
  spec: LessonSpec, rng: RNG, ctx: GenContext, seen: ReadonlySet<string>, replace?: CodeReplace,
): Question {
  const source = replacedSource(spec, rng, replace);
  if (source.kind === "kit") return kitQuestion(source.template, rng, ctx, seen, KIT_TRIES, replace?.answer);
  return freshPuzzle({ spec, rng, seen: new Set(seen) }, source.task, ctx, SAME_LEVEL, ANY_LEVEL);
}
