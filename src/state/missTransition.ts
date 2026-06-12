// Rule 1+3+5 miss transition (docs/ANSWER_INTEGRITY.md): discard the missed
// question, regenerate a fresh same-difficulty one, scaffold, detect guessing.
import { db, logEvent } from "../engine/save/db";
import { generateQuestionSet } from "../engine/generators";
import { DEFAULT_RATING, difficultyFromRating } from "../engine/difficulty/skillRating";
import { isRapidGuessing, workedExample } from "../engine/answers/answerEngine";
import { STR } from "../strings/en";
import { newSeed } from "../engine/rng";
import type { stageById } from "../content/worlds";
import type { Session } from "./store";

export function withReplacedQuestion(
  s: Session,
  generator: Parameters<typeof generateQuestionSet>[0],
  params: Parameters<typeof generateQuestionSet>[1],
  difficulty: number,
  easier: boolean,
): Session["questions"] {
  const [replacement] = generateQuestionSet(generator, params, 1, newSeed(), { difficulty, easier });
  const questions = [...s.questions];
  questions[s.index] = replacement;
  return questions;
}

export function missTransition(
  s: Session,
  stage: NonNullable<ReturnType<typeof stageById>>,
  skill: string,
  ratings: Record<string, number>,
  q: Session["questions"][number],
  firstAttemptInSlot: boolean,
): Session {
  const wrongStamps = [...s.wrongStamps, Date.now()];
  const rapid = isRapidGuessing(wrongStamps);
  const missStreak = firstAttemptInSlot ? s.missStreak + 1 : s.missStreak;
  const easier = rapid || missStreak >= 2;
  if (rapid) {
    // Rule 5: a signal, not misbehavior — adapt difficulty, log, one warm line.
    ratings[skill] = Math.max(0, (ratings[skill] ?? DEFAULT_RATING) - 8);
    void db.skillRatings.put({ skill, rating: ratings[skill] });
    logEvent("guess.rapid", { stageId: s.stageId, skill });
  }
  const difficulty = easier ? 0 : difficultyFromRating(ratings[skill] ?? DEFAULT_RATING);
  return {
    ...s,
    questions: withReplacedQuestion(s, stage.generator, stage.params, difficulty, easier),
    wrongStamps,
    lastAnswer: "wrong",
    // Choice questions are tap-guessable: demand 2 correct in a row.
    proveLeft: q.inputMode === "choices" ? 2 : 0,
    attemptMissed: true,
    firstTryMisses: firstAttemptInSlot ? s.firstTryMisses + 1 : s.firstTryMisses,
    missStreak: easier ? 0 : missStreak,
    showHint: true,
    // Rule 3: second miss in the slot → show the discarded question solved.
    workedExample: firstAttemptInSlot ? null : workedExample(q) || null,
    companionLine: rapid ? STR.companionSlow : s.companionLine,
  };
}
