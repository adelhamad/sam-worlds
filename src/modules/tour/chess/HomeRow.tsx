// White's back row (a1 … h1) as an 8-square strip with the pawn row behind it
// as decoration. Shared by the place widget, its teach card and the "home"
// demo. A view: it draws a row and reports taps and presses (the widget owns
// the drag; squares are drop targets named `data-drop="home-<i>"`).
import type { CSSProperties } from "react";
import type { PieceType } from "../../../engine/chess/types";
import { CHESS } from "../../../strings/chess";
import { ChessPiece } from "../../../ui/chess/ChessPiece";

const FILES = "abcdefgh";

export interface HomeRowProps {
  /** The eight squares, a1 → h1 (null = empty). */
  row: Array<PieceType | null>;
  /** True for squares that were filled from the start: dimmer and not tappable. */
  fixed?: boolean[];
  /** True for squares to highlight (the pieces the lesson is about). */
  lit?: boolean[];
  /** A piece is in hand: the free squares invite a tap. */
  ready?: boolean;
  /** Demo: square index → the order its piece drops in (staggered). */
  dropOrder?: number[];
  onSquare?: (index: number) => void;
  /** Pointer went down on a square (to start carrying the piece on it). */
  onPress?: (event: React.PointerEvent<HTMLButtonElement>, index: number) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function HomeRow({
  row, fixed, lit, ready = false, dropOrder, onSquare, onPress, disabled = false, compact = false,
}: HomeRowProps) {
  const locked = disabled || !onSquare;
  return (
    <div className={`cx-home ${compact ? "is-compact" : ""} ${ready ? "is-ready" : ""} ${dropOrder ? "is-demo" : ""}`}>
      <div className="cx-home-pawns" aria-hidden="true">
        {row.map((_, i) => (
          <span key={i} className={`cx-home-sq ${i % 2 === 0 ? "is-light" : "is-dark"}`}>
            <ChessPiece type="P" fit />
          </span>
        ))}
      </div>
      <div className="cx-home-row">
        {row.map((type, i) => {
          const cls = [
            "cx-home-sq",
            i % 2 === 0 ? "is-dark" : "is-light",
            type ? "is-filled" : "is-free",
            fixed?.[i] ? "is-fixed" : "",
            type && !fixed?.[i] ? "is-mine" : "",
            lit?.[i] ? "is-lit" : "",
          ].filter(Boolean).join(" ");
          return (
            <button
              key={i} type="button" className={cls} disabled={locked} data-testid={`home-${i}`}
              data-drop={`home-${i}`} data-free={type ? undefined : ""} onPointerDown={(event) => onPress?.(event, i)}
              aria-label={CHESS.exercise.homeSquare(`${FILES[i]}1`, type ? CHESS.piece[type] : null)}
              onClick={() => onSquare?.(i)}
            >
              {type && (
                <span className="cx-home-piece" key={type} style={dropOrder ? ({ "--i": dropOrder[i] ?? 0 } as CSSProperties) : undefined}>
                  <ChessPiece type={type} fit />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
