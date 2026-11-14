// chess-spot — tap every square (or piece) that answers the question, then
// CHECK. Draft = spotAnswer(marks) once at least one square is marked.
import { useState } from "react";
import { spotAnswer } from "../../../engine/chess/judge";
import { pieceAt } from "../../../engine/chess/rules";
import type { SpotPayload } from "../../../engine/chess/types";
import { CHESS } from "../../../strings/chess";
import type { MarkTone } from "../../../ui/chess/boardTypes";
import { ChessBoard } from "../../../ui/chess/ChessBoard";
import { useDraft, type WidgetProps } from "../exercises/shared";
import { chessSound } from "./chessSound";

const S = CHESS.exercise;

export function SpotExercise({ payload, disabled, onDraft }: WidgetProps<SpotPayload>) {
  const { position, focus, ask } = payload;
  const [marks, setMarks] = useState<number[]>([]);
  const [wobble, setWobble] = useState({ sq: focus, n: 0 });
  useDraft(onDraft, marks.length > 0 ? spotAnswer(marks) : null);

  /** "captures" and "attackers" are about pieces: an empty square is not an answer. */
  const piecesOnly = ask === "captures" || ask === "attackers";

  const tap = (sq: number) => {
    if (disabled) return;
    if (sq === focus || (piecesOnly && !pieceAt(position, sq))) {
      setWobble((now) => ({ sq: focus, n: now.n + 1 }));
      return;
    }
    chessSound.pick();
    setMarks((now) => (now.includes(sq) ? now.filter((other) => other !== sq) : [...now, sq]));
  };

  const tones: Record<number, MarkTone> = {};
  for (const sq of marks) tones[sq] = "plain";

  return (
    <div className="cx cx-spot" data-testid="chess-spot">
      <div className="cx-bar">
        <p className="cx-help">{S.spotHelp[ask]}</p>
        <span className={`cx-chip ${marks.length === 0 ? "is-empty" : ""}`} key={marks.length} data-testid="spot-count">
          {S.picked(marks.length)}
        </span>
      </div>
      <ChessBoard position={position} focus={focus} marks={tones} wobble={wobble} onSquare={tap} disabled={disabled} />
    </div>
  );
}
