// Answer-integrity rule 1 for Tick Tock: a missed question is thrown away and
// replaced by a fresh one — the same task (or the same kit template) at a
// DIFFERENT time, preferably with another answer, never one the session has shown.
import type { GenContext, Question } from "../generators/types";
import { pick, type RNG } from "../rng";
import { kitQuestion } from "./kitSlots";
import { freshPuzzle, newFill } from "./lessonPlan";
import { lessonSources, type LessonSpec, type Source } from "./sources";
import { TICK_TASKS } from "./times";
import type { TickTask } from "./types";

/** Builds tried at the asked difficulty, then at any difficulty. */
const SAME_LEVEL = 16;
const ANY_LEVEL = 48;
const KIT_TRIES = 30;

/** The miss flow's pin (set by tickSessionParams). */
export interface TickReplace {
  /** The missed question's task. */
  task?: TickTask;
  /** The missed kit question's template id (a bank template of the lesson). */
  template?: string;
  /** The missed question's answer — the replacement prefers a different one. */
  answer?: string;
}

/** The pinned source when it is well-formed, else any source of the lesson. */
function replacedSource(spec: LessonSpec, rng: RNG, replace: TickReplace | undefined): Source {
  const id = replace?.template ?? replace?.task;
  const template = id ? spec.kit.find((entry) => entry.id === id) : undefined;
  if (template) return { kind: "kit", template };
  if (replace?.task && TICK_TASKS.includes(replace.task)) return { kind: "task", task: replace.task };
  return pick(rng, lessonSources(spec));
}

/** One question whose keys are not in `seen`, of the pinned task / template when there is one. */
export function planReplacement(
  spec: LessonSpec, rng: RNG, ctx: GenContext, seen: ReadonlySet<string>, replace?: TickReplace,
): Question {
  const source = replacedSource(spec, rng, replace);
  if (source.kind === "kit") return kitQuestion(source.template, rng, ctx, seen, KIT_TRIES, replace?.answer);
  return freshPuzzle(newFill(spec, rng, seen), source.task, ctx, SAME_LEVEL, ANY_LEVEL, replace?.answer).question;
}
