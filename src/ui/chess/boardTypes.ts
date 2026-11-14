// Types and small pure helpers for <ChessBoard> (kept out of the .tsx so the
// component file exports components only).
import { colOf, rowOf } from "../../engine/chess/rules";
import type { Move, PieceType, Position, Side } from "../../engine/chess/types";

/**
 * How a marked square is drawn:
 * plain = the child's own pick · good = picked and right · missed = right but
 * not picked · extra = picked but not right · no = "cannot go here" cross.
 */
export type MarkTone = "plain" | "good" | "missed" | "extra" | "no";

/**
 * A wash of colour over a square:
 * danger = amber halo (a king in check) · fire = an attacker's line of fire ·
 * goal = a square to reach (the far row) · hit = a one-shot golden flash ·
 * trail = where the last move started.
 */
export type SquareTint = "danger" | "fire" | "goal" | "hit" | "trail";

/** A numbered arrow from square to square (knights get an L-shaped one). */
export interface BoardArrow {
  from: number;
  to: number;
  label?: string;
  /** Draw the arrow as an L (two squares, then one). */
  bent?: boolean;
}

/** A one-shot effect on a square. Give each a fresh `id`; it plays once. */
export interface BoardBurst {
  id: number;
  sq: number;
  /** puff = a captured piece pops away · sparkle = a star collected · crown = a pawn is crowned. */
  kind: "puff" | "sparkle" | "crown";
  /** The captured piece (puff): drawn shrinking away. */
  piece?: { type: PieceType; side: Side };
}

/** Square → a stable identity, so a piece slides when it moves instead of teleporting. */
export type PieceKeys = Record<number, string>;

export function startKeys(position: Position): PieceKeys {
  const keys: PieceKeys = {};
  position.pieces.forEach((piece, index) => {
    keys[piece.sq] = `p${index}`;
  });
  return keys;
}

/** The keys after a move: the mover keeps its key, whatever stood on `to` is gone. */
export function moveKeys(keys: PieceKeys, move: Move): PieceKeys {
  const next: PieceKeys = { ...keys };
  const mover = next[move.from];
  delete next[move.from];
  if (mover) next[move.to] = mover;
  return next;
}

/** Squares strictly between two squares on one straight or diagonal line ([] otherwise). */
export function lineBetween(a: number, b: number, size: number): number[] {
  const dr = rowOf(b, size) - rowOf(a, size);
  const dc = colOf(b, size) - colOf(a, size);
  const aligned = dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  if (!aligned || steps < 2) return [];
  const out: number[] = [];
  for (let i = 1; i < steps; i++) {
    out.push((rowOf(a, size) + Math.sign(dr) * i) * size + colOf(a, size) + Math.sign(dc) * i);
  }
  return out;
}

/** Merge tint maps; later maps win. */
export function mergeTints(...maps: Array<Record<number, SquareTint> | undefined>): Record<number, SquareTint> {
  return Object.assign({}, ...maps) as Record<number, SquareTint>;
}

export function tintAll(squares: number[], tint: SquareTint): Record<number, SquareTint> {
  const out: Record<number, SquareTint> = {};
  for (const sq of squares) out[sq] = tint;
  return out;
}
