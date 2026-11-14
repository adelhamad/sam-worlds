// What a mission board should SHOW for a given state — pure, so the widget,
// the teach card's replay and the demos all light the board the same way.
import type { MissionState } from "../../../engine/chess/judge";
import { attackersOf, inCheck, kingSquare, pieceAt, pseudoMoves, isAttacked } from "../../../engine/chess/rules";
import type { MissionGoal, Move, Position, Side } from "../../../engine/chess/types";
import { lineBetween, type MarkTone, type SquareTint } from "../../../ui/chess/boardTypes";

export interface MissionLook {
  tints: Record<number, SquareTint>;
  /** Pieces to ring: capture targets, or the king to attack. */
  targets: number[];
}

/** The squares on each attacker's line to the king of `side` (empty for knights and neighbours). */
export function fireLines(position: Position, side: Side): number[] {
  const king = kingSquare(position, side);
  if (king === null) return [];
  return attackersOf(position, king, side === "w" ? "b" : "w").flatMap((piece) => lineBetween(piece.sq, king, position.size));
}

/** "Cannot step here" crosses on every square next to a checked king that is covered. */
export function trappedMarks(position: Position, side: Side): Record<number, MarkTone> {
  const marks: Record<number, MarkTone> = {};
  const king = kingSquare(position, side);
  const piece = king === null ? undefined : pieceAt(position, king);
  if (!piece || !inCheck(position, side)) return marks;
  const rest: Position = { size: position.size, pieces: position.pieces.filter((other) => other !== piece) };
  for (const sq of pseudoMoves(position, piece)) {
    if (isAttacked(rest, sq, side === "w" ? "b" : "w")) marks[sq] = "no";
  }
  return marks;
}

export function missionLook(goal: MissionGoal, state: MissionState, last: Move | null): MissionLook {
  const { position } = state;
  const tints: Record<number, SquareTint> = {};
  let targets = state.targetsLeft;
  if (last) tints[last.from] = "trail";

  if (goal === "promote" && !state.won) {
    for (let col = 0; col < position.size; col++) if (!pieceAt(position, col)) tints[col] = "goal";
  }
  if (goal === "check" || goal === "mate") {
    const king = kingSquare(position, "b");
    if (king !== null && state.won) {
      for (const sq of fireLines(position, "b")) tints[sq] = "hit";
      tints[king] = "danger";
    } else if (king !== null) {
      targets = [king];
    }
  }
  if (goal === "escape") {
    const king = kingSquare(position, "w");
    if (king !== null && inCheck(position, "w")) {
      for (const sq of fireLines(position, "w")) tints[sq] = "fire";
      tints[king] = "danger";
    }
  }
  return { tints, targets };
}
