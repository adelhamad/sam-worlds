// The opening demo of a chess lesson ("Meet the Rook"), shown before the first
// question: teach by showing. Pogo introduces the idea, a small stage plays it
// on a loop (and lets the child try), and a big button skips ahead at once.
import { useState, type CSSProperties } from "react";
import { CHESS_INTROS, type HomeIntro, type ValuesIntro } from "../../../content/chess/intros";
import { PIECE_VALUE } from "../../../engine/chess/judge";
import type { ChessIntroKey } from "../../../engine/chess/types";
import { CHESS } from "../../../strings/chess";
import { ChessPiece } from "../../../ui/chess/ChessPiece";
import { StarGlyph } from "../../../ui/chess/Glyphs";
import { PogoSay } from "../../../ui/tour/Pogo";
import { useCompact } from "../lesson/useCompact";
import { BoardDemo } from "./BoardDemo";
import { chessSound } from "./chessSound";
import { HomeRow } from "./HomeRow";
import "../../../ui/tour/tour-base.css";
import "./chess.css";
import "./chessMeet.css";

const M = CHESS.meet;

export interface ChessMeetProps {
  /** What to demonstrate (ChessParams.intro). */
  intro: ChessIntroKey;
  /** Called when the child taps the start button. */
  onStart: () => void;
}

/** The pieces lined up; their points pop in one by one. */
function ValuesDemo({ intro }: { intro: ValuesIntro }) {
  return (
    <div className="cm-values">
      {intro.order.map((type, i) => {
        const points = PIECE_VALUE[type];
        return (
          <div key={type} className="cm-value" style={{ "--i": i } as CSSProperties} data-testid={`meet-value-${type}`}>
            <span className="cm-value-piece"><ChessPiece type={type} fit /></span>
            <span className={`cm-value-coin ${type === "K" ? "is-king" : ""}`} aria-label={type === "K" ? M.priceless : M.points(points)}>
              {type === "K" ? <StarGlyph size={22} /> : points}
            </span>
            <span className="cm-value-name">{CHESS.piece[type]}</span>
          </div>
        );
      })}
    </div>
  );
}

/** White's back row filling in piece by piece; tap to watch again. */
function HomeDemo({ intro }: { intro: HomeIntro }) {
  const [run, setRun] = useState(0);
  const order = intro.row.map((_, square) => intro.order.indexOf(square));
  return (
    <div className="cm-home">
      <HomeRow key={run} row={intro.row} dropOrder={order} />
      <button type="button" className="tbtn tbtn-ghost cm-again" onClick={() => { chessSound.pick(); setRun(run + 1); }}>
        {M.again}
      </button>
    </div>
  );
}

export function ChessMeet({ intro, onStart }: ChessMeetProps) {
  const data = CHESS_INTROS[intro];
  const compact = useCompact();
  const [cheers, setCheers] = useState(0);
  let stage: React.ReactNode;
  if (data.kind === "values") stage = <ValuesDemo intro={data} />;
  else if (data.kind === "home") stage = <HomeDemo intro={data} />;
  else stage = <BoardDemo intro={data} onPlay={() => setCheers((n) => n + 1)} />;

  return (
    <div className={`tl-meet cm is-${data.kind}`} data-testid="chess-meet" data-intro={intro}>
      <PogoSay mood={cheers > 0 ? "happy" : "wave"} replayKey={cheers} size={compact ? 84 : 116} text={data.title} />
      <div className="cm-stage">{stage}</div>
      <ul className="cm-lines">
        {data.lines.map((line, i) => (
          <li key={line} style={{ "--i": i } as CSSProperties}>{line}</li>
        ))}
      </ul>
      <button type="button" className="tbtn tbtn-go tbtn-wide cm-start" onClick={onStart} data-testid="chess-meet-start">
        {M.letsGo}
      </button>
    </div>
  );
}
