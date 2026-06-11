import { useState } from "react";
import type { Question } from "../../engine/generators/types";
import { sfx } from "../../engine/feedback/audio";

const ROWS = ["ABCDEFG", "HIJKLMN", "OPQRSTU", "VWXYZ"];

interface Props {
  question: Question;
  disabled: boolean;
  onSubmit: (value: string) => void;
}

export function LetterPad({ question, disabled, onSubmit }: Props) {
  const [typed, setTyped] = useState("");
  const length = (question.payload?.length as number) ?? 6;
  const legend = question.payload?.legend as string | undefined;

  const slots = Array.from({ length }, (_, i) => typed[i] ?? "▁").join(" ");

  return (
    <div className="letterpad-input">
      {legend && <div className="cipher-legend">{legend}</div>}
      <div className="typed-display">{slots}</div>
      <div className="letter-grid">
        {ROWS.map((row) => (
          <div key={row} className="letter-row">
            {[...row].map((ch) => (
              <button
                key={ch}
                className="btn letter-key"
                disabled={disabled || typed.length >= length}
                onClick={() => {
                  sfx.tap();
                  setTyped((t) => t + ch);
                }}
              >
                {ch}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="input-actions">
        <button className="btn btn-secondary" disabled={disabled || !typed} onClick={() => setTyped((t) => t.slice(0, -1))}>
          ⌫
        </button>
        <button
          className="btn btn-primary"
          disabled={disabled || typed.length !== length}
          onClick={() => {
            onSubmit(typed);
            setTyped("");
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
