import type { CourseUnit } from "../../../content/courses";
import type { PieceType } from "../../../engine/chess/types";
import { ChessPiece } from "../../../ui/chess/ChessPiece";
import "./chess-set.css";

interface GoldPieceProps {
  type: PieceType;
  /** Rendered height in px. */
  size: number;
  className?: string;
}

/** A chess piece as a golden figurine — the prize inside a Chess Camp chest. */
export function GoldPiece({ type, size, className = "" }: GoldPieceProps) {
  return (
    <span className={`tp-gold ${className}`} style={{ height: size }} aria-hidden="true">
      <ChessPiece type={type} size={size} />
    </span>
  );
}

interface KeepsakeProps {
  unit: CourseUnit;
  /** Height of the figure in px (emoji keepsakes are sized to match). */
  size: number;
}

/** A unit's keepsake: a golden chess piece, or its emoji. */
export function Keepsake({ unit, size }: KeepsakeProps) {
  const { piece, icon } = unit.souvenir;
  if (piece) return <GoldPiece type={piece} size={size} />;
  return <span className="tp-keepsake-emoji" style={{ fontSize: Math.round(size * 0.88) }} aria-hidden="true">{icon}</span>;
}
