// Chess rules on a square mini-board. Pure and small: movement, attacks,
// check and checkmate. No castling or en passant (not taught yet); a pawn that
// reaches the far row becomes a queen.
import type { Move, Piece, PieceType, Position, Side } from "./types";

type Step = readonly [number, number];

const STRAIGHT: Step[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAGONAL: Step[] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const AROUND: Step[] = [...STRAIGHT, ...DIAGONAL];
const JUMPS: Step[] = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];

const SLIDES: Partial<Record<PieceType, Step[]>> = { R: STRAIGHT, B: DIAGONAL, Q: AROUND };
const HOPS: Partial<Record<PieceType, Step[]>> = { K: AROUND, N: JUMPS };

export function rowOf(sq: number, size: number): number {
  return Math.floor(sq / size);
}

export function colOf(sq: number, size: number): number {
  return sq % size;
}

export function squareAt(row: number, col: number, size: number): number | null {
  return row >= 0 && col >= 0 && row < size && col < size ? row * size + col : null;
}

/** "a1"-style name; rank 1 is the bottom row. */
export function squareName(sq: number, size: number): string {
  return `${String.fromCharCode(97 + colOf(sq, size))}${size - rowOf(sq, size)}`;
}

/** True for a light square (bottom-left corner is dark, as on a real board). */
export function isLightSquare(sq: number, size: number): boolean {
  return (colOf(sq, size) + (size - 1 - rowOf(sq, size))) % 2 === 1;
}

export function pieceAt(pos: Position, sq: number): Piece | undefined {
  return pos.pieces.find((piece) => piece.sq === sq);
}

export function other(side: Side): Side {
  return side === "w" ? "b" : "w";
}

/** Row direction a pawn of this side walks in (White goes up the screen). */
function pawnStep(side: Side): number {
  return side === "w" ? -1 : 1;
}

function pawnHomeRow(side: Side, size: number): number {
  return side === "w" ? size - 2 : 1;
}

function slide(pos: Position, piece: Piece, steps: Step[]): number[] {
  const out: number[] = [];
  for (const [dr, dc] of steps) {
    let row = rowOf(piece.sq, pos.size) + dr;
    let col = colOf(piece.sq, pos.size) + dc;
    let sq = squareAt(row, col, pos.size);
    while (sq !== null) {
      out.push(sq);
      if (pieceAt(pos, sq)) break; // the first piece in the way ends the ray
      row += dr;
      col += dc;
      sq = squareAt(row, col, pos.size);
    }
  }
  return out;
}

function hop(pos: Position, piece: Piece, steps: Step[]): number[] {
  const row = rowOf(piece.sq, pos.size);
  const col = colOf(piece.sq, pos.size);
  return steps
    .map(([dr, dc]) => squareAt(row + dr, col + dc, pos.size))
    .filter((sq): sq is number => sq !== null);
}

function pawnDiagonals(pos: Position, piece: Piece): number[] {
  const row = rowOf(piece.sq, pos.size) + pawnStep(piece.side);
  const col = colOf(piece.sq, pos.size);
  return [squareAt(row, col - 1, pos.size), squareAt(row, col + 1, pos.size)].filter((sq): sq is number => sq !== null);
}

/** Every square this piece attacks — including ones holding its own pieces. */
export function attacks(pos: Position, piece: Piece): number[] {
  if (piece.type === "P") return pawnDiagonals(pos, piece);
  const slides = SLIDES[piece.type];
  return slides ? slide(pos, piece, slides) : hop(pos, piece, HOPS[piece.type] ?? []);
}

function pawnMoves(pos: Position, piece: Piece): number[] {
  const out: number[] = [];
  const step = pawnStep(piece.side);
  const row = rowOf(piece.sq, pos.size);
  const col = colOf(piece.sq, pos.size);
  const one = squareAt(row + step, col, pos.size);
  if (one !== null && !pieceAt(pos, one)) {
    out.push(one);
    const two = squareAt(row + 2 * step, col, pos.size);
    if (row === pawnHomeRow(piece.side, pos.size) && two !== null && !pieceAt(pos, two)) out.push(two);
  }
  for (const sq of pawnDiagonals(pos, piece)) {
    const target = pieceAt(pos, sq);
    if (target && target.side !== piece.side) out.push(sq);
  }
  return out;
}

/** Where the piece may go if king safety is ignored. */
export function pseudoMoves(pos: Position, piece: Piece): number[] {
  if (piece.type === "P") return pawnMoves(pos, piece);
  return attacks(pos, piece).filter((sq) => pieceAt(pos, sq)?.side !== piece.side);
}

export function isAttacked(pos: Position, sq: number, by: Side): boolean {
  return pos.pieces.some((piece) => piece.side === by && attacks(pos, piece).includes(sq));
}

/** The pieces of `by` that attack the square. */
export function attackersOf(pos: Position, sq: number, by: Side): Piece[] {
  return pos.pieces.filter((piece) => piece.side === by && attacks(pos, piece).includes(sq));
}

export function kingSquare(pos: Position, side: Side): number | null {
  return pos.pieces.find((piece) => piece.side === side && piece.type === "K")?.sq ?? null;
}

/** False when the side has no king on the board (movement drills). */
export function inCheck(pos: Position, side: Side): boolean {
  const king = kingSquare(pos, side);
  return king !== null && isAttacked(pos, king, other(side));
}

/** The position after a move: captures what stands on `to`; pawns promote to a queen. */
export function movePiece(pos: Position, move: Move): Position {
  const mover = pieceAt(pos, move.from);
  if (!mover) return pos;
  const lastRow = mover.side === "w" ? 0 : pos.size - 1;
  const promoted = mover.type === "P" && rowOf(move.to, pos.size) === lastRow;
  const moved: Piece = { ...mover, sq: move.to, type: promoted ? "Q" : mover.type };
  return {
    size: pos.size,
    pieces: pos.pieces.filter((piece) => piece.sq !== move.from && piece.sq !== move.to).concat(moved),
  };
}

/** Real chess moves: pseudo moves that do not leave the mover's own king attacked. */
export function legalMoves(pos: Position, piece: Piece): number[] {
  return pseudoMoves(pos, piece).filter((to) => !inCheck(movePiece(pos, { from: piece.sq, to }), piece.side));
}

export function allLegalMoves(pos: Position, side: Side): Move[] {
  return pos.pieces
    .filter((piece) => piece.side === side)
    .flatMap((piece) => legalMoves(pos, piece).map((to) => ({ from: piece.sq, to })));
}

/** `side` is to move, in check, and has no way out. */
export function isCheckmate(pos: Position, side: Side): boolean {
  return inCheck(pos, side) && allLegalMoves(pos, side).length === 0;
}

/** `side` is to move, NOT in check, and has no legal move. */
export function isStalemate(pos: Position, side: Side): boolean {
  return !inCheck(pos, side) && allLegalMoves(pos, side).length === 0;
}

/** A playable diagram: kings (if any) apart, no pawn on an end row, Black not already in check. */
export function isSanePosition(pos: Position): boolean {
  const squares = new Set(pos.pieces.map((piece) => piece.sq));
  if (squares.size !== pos.pieces.length) return false;
  const lastRows = [0, pos.size - 1];
  if (pos.pieces.some((piece) => piece.type === "P" && lastRows.includes(rowOf(piece.sq, pos.size)))) return false;
  for (const side of ["w", "b"] as const) {
    if (pos.pieces.filter((piece) => piece.side === side && piece.type === "K").length > 1) return false;
  }
  return !inCheck(pos, "b");
}
