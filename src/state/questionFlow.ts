import { db } from "../engine/save/db";
import { DEFAULT_RATING, updateRating } from "../engine/difficulty/skillRating";
import { stageIndexInWorld, worldOfStage } from "../content/worlds";
import type { StageDef } from "../content/types";
import { questionKeys } from "../engine/generators";
import { missTransition, replacementDifficulty, withReplacedQuestion } from "./missTransition";
import type { Session } from "./store";

export type AnswerVerdict = "correct" | "wrong" | "again" | "exhausted";

function stageProgress(stage: StageDef): number {
  const world = worldOfStage(stage.id);
  return world ? stageIndexInWorld(stage.id) / Math.max(1, world.stages.length - 1) : 0.5;
}

function skipExhausted(s: Session, wrong: boolean): Session {
  const questions = [...s.questions];
  questions.splice(s.index, 1);
  return {
    ...s,
    questions,
    seenQuestionKeys: s.seenQuestionKeys ?? s.questions.flatMap(questionKeys),
    firstTryMisses: Math.min(questions.length, s.firstTryMisses + (wrong && !s.attemptMissed ? 1 : 0)),
    attemptMissed: false,
    proveLeft: 0,
    lastAnswer: null,
    showHint: false,
    workedExample: null,
  };
}

export function answerTransition(
  s: Session,
  stage: StageDef,
  typed: string,
  ratings: Record<string, number>,
  globalSeen: Iterable<string> = [],
): { next: Session; verdict: AnswerVerdict } {
  const skill = stage.skill ?? stage.generator;
  const q = s.questions[s.index];
  const correct = typed === q.answer;
  const firstAttemptInSlot = !s.attemptMissed;
  if (firstAttemptInSlot) {
    ratings[skill] = updateRating(ratings[skill] ?? DEFAULT_RATING, correct);
    void db.skillRatings.put({ skill, rating: ratings[skill] });
  }

  if (correct && (s.proveLeft ?? 0) > 1) {
    const difficulty = replacementDifficulty(stageProgress(stage), ratings[skill] ?? DEFAULT_RATING, false);
    const replaced = withReplacedQuestion(s, stage.generator, stage.params, difficulty, false, globalSeen);
    if (!replaced) return { next: skipExhausted(s, false), verdict: "exhausted" };
    return {
      next: { ...replaced, proveLeft: (s.proveLeft ?? 0) - 1, lastAnswer: null, showHint: false, workedExample: null, missStreak: 0 },
      verdict: "again",
    };
  }
  if (correct) {
    return {
      next: { ...s, lastAnswer: "correct", correctCount: s.correctCount + 1, missStreak: 0, showHint: false, workedExample: null, proveLeft: 0 },
      verdict: "correct",
    };
  }

  const replaced = missTransition(s, stage, skill, ratings, q, firstAttemptInSlot, stageProgress(stage), globalSeen);
  return replaced ? { next: replaced, verdict: "wrong" } : { next: skipExhausted(s, true), verdict: "exhausted" };
}
