// One question on screen: Pogo asks, the exercise widget answers, CHECK submits.
import { useCallback, useState } from "react";
import type { Question } from "../../../engine/generators/types";
import { speak } from "../../../engine/feedback/speech";
import { PogoSay, type PogoMood } from "../../../ui/tour/Pogo";
import { TourExercise } from "../exercises/TourExercise";
import { selfSubmitting } from "../exercises/contract";
import { TOUR } from "../../../strings/tour";
import { useCompact } from "./useCompact";

interface QuestionViewProps {
  question: Question;
  /** A feedback sheet is open: the widget ignores taps and CHECK is off. */
  locked: boolean;
  /** Pogo's reaction to the last answer; null while the child is working
      (PogoSay then talks while a new prompt pops in and settles to idle). */
  reaction: PogoMood | null;
  /** Changes with every answer so one-shot moods replay. */
  reactionKey: number | undefined;
  /** Replaces the prompt in Pogo's bubble (the warm slow-down line). */
  aside: string | null;
  /** The miss sheet is open: the board steps back so the teach card leads. */
  dimmed: boolean;
  onSubmit: (value: string) => void;
}

export function QuestionView({ question, locked, reaction, reactionKey, aside, dimmed, onSubmit }: QuestionViewProps) {
  const compact = useCompact();
  const [draft, setDraft] = useState<{ id: string; value: string | null }>({ id: "", value: null });
  const value = draft.id === question.id ? draft.value : null;
  const questionId = question.id;
  const onDraft = useCallback((next: string | null) => setDraft({ id: questionId, value: next }), [questionId]);
  const text = aside ?? question.prompt;

  return (
    <>
      <div className="tl-ask">
        <PogoSay mood={reaction ?? undefined} replayKey={reactionKey} size={compact ? 84 : 116} text={text}>
          {!aside && (
            <button className="tl-hear" aria-label={TOUR.lesson.readAloud} onClick={() => speak(question.prompt)}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" />
                <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.6 7.6 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </PogoSay>
      </div>
      <main className={`tl-exercise ${dimmed ? "is-dimmed" : ""}`}>
        <TourExercise key={question.id} question={question} disabled={locked} onDraft={onDraft} onSubmit={onSubmit} />
      </main>
      <footer className="tl-footer">
        {!selfSubmitting(question) && (
          <button
            className="tbtn tbtn-go tbtn-wide tl-check"
            disabled={locked || value === null}
            onClick={() => { if (value !== null) onSubmit(value); }}
          >
            {TOUR.lesson.check}
          </button>
        )}
      </footer>
    </>
  );
}
