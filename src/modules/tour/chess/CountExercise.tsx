// chess-count — add up the points of the pieces shown and type the total on
// the number pad. Draft = the typed digits (compared as a string: no leading
// zeros, at most two digits).
import { useState, type CSSProperties } from "react";
import type { CountPayload } from "../../../engine/chess/types";
import { CHESS } from "../../../strings/chess";
import { ChessPiece } from "../../../ui/chess/ChessPiece";
import { EraseGlyph } from "../../../ui/chess/Glyphs";
import { useDraft, type WidgetProps } from "../exercises/shared";
import { chessSound } from "./chessSound";

const S = CHESS.exercise;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const MAX_DIGITS = 2;

export function CountExercise({ payload, disabled, onDraft }: WidgetProps<CountPayload>) {
  const [typed, setTyped] = useState("");
  const [full, setFull] = useState(0);
  useDraft(onDraft, typed === "" ? null : typed);

  const press = (digit: string) => {
    if (disabled) return;
    const next = typed === "0" ? digit : typed + digit;
    if (next.length > MAX_DIGITS) {
      setFull((n) => n + 1); // the display gives a tiny wobble: it is full
      return;
    }
    chessSound.pick();
    setTyped(next);
  };
  const erase = () => {
    if (disabled || typed === "") return;
    chessSound.pick();
    setTyped(typed.slice(0, -1));
  };

  return (
    <div className="cx cx-count" data-testid="chess-count">
      <p className="cx-help">{S.countHelp}</p>
      <div className="cx-count-pieces" style={{ "--count": payload.pieces.length } as CSSProperties} aria-hidden="true">
        {payload.pieces.map((type, i) => (
          <span key={i} className="cx-count-piece" style={{ "--i": i } as CSSProperties}>
            <ChessPiece type={type} fit />
          </span>
        ))}
      </div>
      <span className="cx-sr">{payload.pieces.map((type) => CHESS.piece[type]).join(", ")}</span>
      <div className="cx-count-entry">
        <output
          key={full} className={`cx-count-display ${typed === "" ? "is-empty" : ""} ${full > 0 ? "is-full" : ""}`}
          aria-label={S.countDisplay} data-testid="count-display"
        >
          {typed === "" ? "?" : typed}
        </output>
        <button
          type="button" className="tbtn cx-count-erase" disabled={disabled || typed === ""} onClick={erase}
          aria-label={S.erase} data-testid="num-back"
        >
          <EraseGlyph size={30} />
        </button>
      </div>
      <div className="cx-pad">
        {KEYS.map((digit) => (
          <button key={digit} type="button" className="tbtn cx-pad-key" disabled={disabled} onClick={() => press(digit)} data-testid={`num-${digit}`}>
            {digit}
          </button>
        ))}
      </div>
    </div>
  );
}
