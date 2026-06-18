import { useEffect } from "react";
import type { Question } from "../../engine/generators/types";
import { playPitch } from "../../engine/feedback/audio";
import { freq } from "../../engine/music/theory";
import { StaffNote } from "./StaffNote";

interface Props {
  question: Question;
  disabled: boolean;
  onSubmit: (value: string) => void;
}

/** Play a melody (sequential) or a chord (together) from note names. */
function playNotes(notes: string[], chord: boolean): void {
  notes.forEach((n, i) => playPitch(freq(n), chord ? 0.9 : 0.4, chord ? 0 : i * 0.5));
}

/** True matching / theory questions (anti-guessing rule 2) — one tap submits,
 * and a wrong tap regenerates the whole question (rule 1). Optionally shows a
 * staff and/or plays an ear-training prompt. */
export function ChoiceButtons({ question, disabled, onSubmit }: Props) {
  const big = Boolean(question.payload?.bigChoices);
  const staff = question.payload?.staff as string | string[] | undefined;
  const clef = (question.payload?.clef as string | undefined) ?? "treble";
  const play = question.payload?.play as string[] | undefined;
  const chord = Boolean(question.payload?.chord);
  const listenFirst = Boolean(question.payload?.listenFirst);

  useEffect(() => {
    if (listenFirst && play?.length) {
      const t = setTimeout(() => playNotes(play, chord), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  return (
    <div className="choice-input">
      {staff && <StaffNote note={staff} clef={clef} />}
      {play && (
        <button className="btn btn-secondary hear-btn" disabled={disabled} onClick={() => playNotes(play, chord)}>
          🔊 Hear it
        </button>
      )}
      <div className="choices">
        {question.choices.map((c) => (
          <button key={c} className={`btn choice ${big ? "choice-big" : ""}`} disabled={disabled} onClick={() => onSubmit(c)}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
