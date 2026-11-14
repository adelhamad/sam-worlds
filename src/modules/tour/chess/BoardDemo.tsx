// The demo board of a lesson intro: a piece showing how it moves — and the
// first thing a child does with a new piece is carry it along its lines.
import type { BoardIntro } from "../../../content/chess/intros";
import { CHESS } from "../../../strings/chess";
import { ChessBoard } from "../../../ui/chess/ChessBoard";
import { useBoardDemo } from "./useBoardDemo";

export function BoardDemo({ intro, onPlay }: { intro: BoardIntro; onPlay: () => void }) {
  const demo = useBoardDemo(intro);
  const tap = (sq: number) => {
    if (demo.dots.includes(sq)) onPlay();
    demo.tap(sq);
  };
  return (
    <>
      <ChessBoard
        position={demo.position} pieceKeys={demo.keys} dots={demo.dots} tints={demo.tints} marks={demo.marks}
        bursts={demo.bursts} onSquare={tap} className="cm-board"
        draggable={demo.hero === null ? [] : [demo.hero]} onGrab={demo.grab} onDrop={(_, to) => tap(to)}
      />
      {intro.kind === "piece" && (
        <p className={`cm-try ${demo.played ? "is-done" : ""}`}>
          <span className="cm-try-dot" aria-hidden="true" />
          {CHESS.meet.tryIt}
        </p>
      )}
    </>
  );
}
