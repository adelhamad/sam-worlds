// Chess Camp — the opening demo of a lesson ("Meet the Rook") as DATA: what
// Pogo says, the demo position and what to animate. The screen that plays it
// is modules/tour/chess/ChessMeet.tsx; the words live in strings/chess.ts.
import { HOME_ROW } from "../../engine/chess/judge";
import type { ChessIntroKey, PieceType, Position } from "../../engine/chess/types";
import { CHESS } from "../../strings/chess";

interface IntroText {
  /** Pogo's line. */
  title: string;
  /** 2–3 rule lines, ≤ 8 simple words each. */
  lines: string[];
}

/**
 * A piece on a small board. Its moves show as dots; it glides through
 * `script` on a loop, and the child can tap any dot to move it (free play).
 */
export interface BoardIntro extends IntroText {
  kind: "piece" | "check" | "mate";
  position: Position;
  /** Start square of the piece that moves. */
  hero: number;
  /** Squares the hero visits, in order. */
  script: number[];
  /** "ring": the script ends where it began · "reset": start over from the first position. */
  loop: "ring" | "reset";
}

/** The pieces lined up, their points appearing one by one. */
export interface ValuesIntro extends IntroText {
  kind: "values";
  order: PieceType[];
}

/** White's back row filling in piece by piece. */
export interface HomeIntro extends IntroText {
  kind: "home";
  row: PieceType[];
  /** Squares (a1 = 0 … h1 = 7) in the order they fill. */
  order: number[];
}

export type ChessIntro = BoardIntro | ValuesIntro | HomeIntro;

const T = CHESS.meet.intro;

// 5×5 boards: square = row * 5 + col, row 0 at the top (a5 = 0, e1 = 24).
function board(pieces: Position["pieces"]): Position {
  return { size: 5, pieces };
}

export const CHESS_INTROS: Record<ChessIntroKey, ChessIntro> = {
  // Around the edge: up, across, down, back.
  R: { ...T.R, kind: "piece", hero: 20, script: [0, 4, 24, 20], loop: "ring", position: board([{ type: "R", side: "w", sq: 20 }]) },
  // A diamond of diagonals.
  B: { ...T.B, kind: "piece", hero: 22, script: [10, 2, 14, 22], loop: "ring", position: board([{ type: "B", side: "w", sq: 22 }]) },
  // Straight, diagonal, straight, diagonal…
  Q: { ...T.Q, kind: "piece", hero: 12, script: [2, 14, 10, 22, 12], loop: "ring", position: board([{ type: "Q", side: "w", sq: 12 }]) },
  // One step at a time, every direction.
  K: { ...T.K, kind: "piece", hero: 12, script: [7, 13, 17, 11, 12], loop: "ring", position: board([{ type: "K", side: "w", sq: 12 }]) },
  // Two L-shaped loops, jumping over the pawns beside it.
  N: {
    ...T.N, kind: "piece", hero: 12, script: [1, 10, 21, 12, 3, 14, 23, 12], loop: "ring",
    position: board([
      { type: "N", side: "w", sq: 12 }, { type: "P", side: "w", sq: 7 }, { type: "P", side: "w", sq: 11 }, { type: "P", side: "w", sq: 13 },
    ]),
  },
  // A double first step, then a diagonal capture that lands on the top row (a new queen!).
  P: {
    ...T.P, kind: "piece", hero: 16, script: [6, 2], loop: "reset",
    position: board([{ type: "P", side: "w", sq: 16 }, { type: "N", side: "b", sq: 2 }]),
  },
  values: { ...T.values, kind: "values", order: ["P", "N", "B", "R", "Q", "K"] },
  home: { ...T.home, kind: "home", row: HOME_ROW, order: [0, 7, 1, 6, 2, 5, 3, 4] },
  // The rook steps onto the king's line.
  check: {
    ...T.check, kind: "check", hero: 15, script: [17], loop: "reset",
    position: board([{ type: "K", side: "b", sq: 2 }, { type: "R", side: "w", sq: 15 }, { type: "K", side: "w", sq: 24 }]),
  },
  // The rook checks along the top row; the white king covers every way out.
  mate: {
    ...T.mate, kind: "mate", hero: 24, script: [4], loop: "reset",
    position: board([{ type: "K", side: "b", sq: 0 }, { type: "K", side: "w", sq: 11 }, { type: "R", side: "w", sq: 24 }]),
  },
};
