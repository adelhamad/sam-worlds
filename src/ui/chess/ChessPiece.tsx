// A chess piece as original inline SVG art (see PieceArt.tsx for the drawings).
// Decorative: boards and buttons carry their own labels.
import { useId } from "react";
import type { PieceType, Side } from "../../engine/chess/types";
import { PieceArt } from "./PieceArt";
import "./pieces.css";

export interface ChessPieceProps {
  type: PieceType;
  /** Defaults to White (the child's pieces). */
  side?: Side;
  /** Rendered height in px (the box is square). */
  size?: number;
  /** Fill the parent box instead of using `size` (board squares). */
  fit?: boolean;
  className?: string;
}

export function ChessPiece({ type, side = "w", size = 48, fit = false, className = "" }: ChessPieceProps) {
  const clip = `pc${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const box = fit ? undefined : { width: size, height: size };
  return (
    <svg
      className={`chess-piece chess-piece-${side} ${fit ? "chess-piece-fit" : ""} ${className}`}
      viewBox="0 0 100 100" style={box} aria-hidden="true" focusable="false" data-piece-type={type}
    >
      <PieceArt type={type} clip={clip} />
    </svg>
  );
}
