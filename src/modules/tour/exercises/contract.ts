// Contract between the lesson screen (shell) and the exercise widgets.
import type { Question } from "../../../engine/generators/types";

/** Kinds that submit by themselves (no CHECK button). */
const SELF_SUBMITTING = new Set(["pairs", "kit-pairs", "chess-mission", "code-run", "code-debug"]);

export function selfSubmitting(question: Question): boolean {
  const kind = (question.payload as { tour?: unknown } | undefined)?.tour;
  return question.inputMode === "tour" && typeof kind === "string" && SELF_SUBMITTING.has(kind);
}

export interface ExerciseProps {
  /** A tour question (`tourPayload(question)` is non-null). */
  question: Question;
  /** True while feedback shows or the input is locked — ignore all taps. */
  disabled: boolean;
  /**
   * Report the answer the child has built so far, serialised with the helpers
   * in engine/tour/answers.ts. `null` = not ready (the CHECK button stays off).
   * The shell submits the latest draft when CHECK is pressed.
   */
  onDraft: (value: string | null) => void;
  /**
   * Submit right now, bypassing CHECK. Only `pairs` uses this: once for the
   * full board (pairsAnswer) or immediately on a mismatch (pairsMiss).
   */
  onSubmit: (value: string) => void;
}

export interface TeachProps {
  /** The question that was just missed (already replaced in the session). */
  question: Question;
  /** What the child submitted, if useful for the explanation. */
  submitted?: string;
}
