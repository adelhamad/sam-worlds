import { useEffect, useState } from "react";
import { KEYBOARD, NOTE_FREQ, semitone } from "../../engine/music/notes";
import { playPitch } from "../../engine/feedback/audio";
import type { Question } from "../../engine/generators/types";
import { StaffNote } from "./StaffNote";

const BLACK_AFTER: Record<string, string> = {
  C4: "C#4", D4: "D#4", F4: "F#4", G4: "G#4", A4: "A#4",
};
const WHITES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];

interface Props {
  question: Question;
  disabled: boolean;
  onSubmit: (value: string) => void;
}

export function PianoKeys({ question, disabled, onSubmit }: Props) {
  const [seq, setSeq] = useState<string[]>([]);
  const payload = question.payload ?? {};
  const demo = (payload.play as string[] | undefined) ?? [];
  const sorted = Boolean(payload.sorted);
  const staff = payload.staff as string | undefined;

  function hearIt() {
    demo.forEach((n, i) => playPitch(NOTE_FREQ[n], 0.4, i * 0.5));
  }

  // Ear questions start by playing the target phrase.
  useEffect(() => {
    if (payload.listenFirst && demo.length) {
      const t = setTimeout(hearIt, 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  function tap(note: string) {
    if (disabled) return;
    playPitch(NOTE_FREQ[note]);
    setSeq((s) => (s.length >= 8 ? s : [...s, note]));
  }

  function submit() {
    if (!seq.length) return;
    const finalSeq = sorted ? [...seq].sort((a, b) => semitone(a) - semitone(b)) : seq;
    onSubmit(finalSeq.join(" "));
    setSeq([]);
  }

  return (
    <div className="piano-input">
      {staff && <StaffNote note={staff} />}
      <div className="piano-seq">{seq.length ? seq.join(" · ") : "—"}</div>
      <div className="piano">
        {WHITES.map((w) => (
          <div key={w} className="white-wrap">
            <button className="white-key" disabled={disabled} onClick={() => tap(w)}>
              {w.replace("4", "").replace("5", "")}
            </button>
            {BLACK_AFTER[w] && KEYBOARD.includes(BLACK_AFTER[w]) && (
              <button
                className="black-key"
                disabled={disabled}
                aria-label={BLACK_AFTER[w]}
                onClick={(e) => {
                  e.stopPropagation();
                  tap(BLACK_AFTER[w]);
                }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="input-actions">
        {demo.length > 0 && (
          <button className="btn btn-secondary" disabled={disabled} onClick={hearIt}>
            🔊 Hear it
          </button>
        )}
        <button className="btn btn-secondary" disabled={disabled || !seq.length} onClick={() => setSeq((s) => s.slice(0, -1))}>
          ⌫
        </button>
        <button className="btn btn-primary" disabled={disabled || !seq.length} onClick={submit}>
          OK
        </button>
      </div>
    </div>
  );
}
