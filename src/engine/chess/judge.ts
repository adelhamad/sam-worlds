// Canonical answers for Chess Camp. The planner uses these to set
// `question.answer`; the widgets use the SAME helpers to serialise what the
// child did, so the shared answer engine judges with plain equality. A mission
// has many right move orders, so its verdict is computed here (pure), never in
// a component.
import { attackersOf, inCheck, isCheckmate, legalMoves, movePiece, pieceAt, pseudoMoves, rowOf, kingSquare } from "./rules";
import type { MissionPayload, Move, Piece, PieceType, Position, SpotPayload } from "./types";

/** What a finished mission reports — `question.answer` of every mission. */
export const MISSION_DONE = "goal";

export const PIECE_VALUE: Record<PieceType, number> = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };

/** White's back row, a1 → h1. */
export const HOME_ROW: PieceType[] = ["R", "N", "B", "Q", "K", "B", "N", "R"];

// ---------- spot ----------

/** The squares the child marked, order-independent. */
export function spotAnswer(squares: number[]): string {
  return [...new Set(squares)].sort((a, b) => a - b).join(",");
}

/** The right squares for a spot question (used by the planner and the teach card). */
export function spotSolution(payload: Pick<SpotPayload, "ask" | "position" | "focus">): number[] {
  const { position, focus } = payload;
  const piece = pieceAt(position, focus);
  if (!piece) return [];
  if (payload.ask === "attackers") {
    return attackersOf(position, focus, piece.side === "w" ? "b" : "w").map((attacker) => attacker.sq);
  }
  if (payload.ask === "captures") return pseudoMoves(position, piece).filter((sq) => pieceAt(position, sq));
  if (payload.ask === "safe") return legalMoves(position, piece);
  return pseudoMoves(position, piece);
}

// ---------- count / place ----------

export function countAnswer(pieces: PieceType[]): string {
  return String(pieces.reduce((sum, type) => sum + PIECE_VALUE[type], 0));
}

/** The back row as the child left it: "RNBQKBNR", "." for an empty square. */
export function placeAnswer(row: Array<PieceType | null>): string {
  return row.map((type) => type ?? ".").join("");
}

// ---------- mission ----------

export interface MissionState {
  position: Position;
  starsLeft: number[];
  targetsLeft: number[];
  /** Moves made so far. */
  used: number;
  won: boolean;
}

export function missionStart(payload: MissionPayload): MissionState {
  return { position: payload.position, starsLeft: [...payload.stars], targetsLeft: [...payload.targets], used: 0, won: false };
}

/** White pieces the child may pick up right now. */
export function missionMovers(payload: MissionPayload, state: MissionState): Piece[] {
  if (!missionOpen(payload, state)) return [];
  return state.position.pieces.filter((piece) => piece.side === "w" && missionDestinations(payload, state, piece.sq).length > 0);
}

/**
 * Where the piece on `from` may go. Real chess legality applies whenever White
 * has a king — except in "escape", where stepping onto an attacked square is
 * allowed so the child can discover why it does not work.
 */
export function missionDestinations(payload: MissionPayload, state: MissionState, from: number): number[] {
  const piece = pieceAt(state.position, from);
  if (!piece || piece.side !== "w" || !missionOpen(payload, state)) return [];
  const strict = payload.goal !== "escape" && kingSquare(state.position, "w") !== null;
  return strict ? legalMoves(state.position, piece) : pseudoMoves(state.position, piece);
}

function goalReached(payload: MissionPayload, next: MissionState, mover: Piece, to: number): boolean {
  switch (payload.goal) {
    case "stars":
      return next.starsLeft.length === 0;
    case "capture":
      return next.targetsLeft.length === 0;
    case "promote":
      return mover.type === "P" && rowOf(to, next.position.size) === 0;
    case "check":
      return inCheck(next.position, "b");
    case "mate":
      return isCheckmate(next.position, "b");
    default: // escape
      return !inCheck(next.position, "w");
  }
}

/** Apply one move. Illegal moves leave the state untouched. */
export function missionApply(payload: MissionPayload, state: MissionState, move: Move): MissionState {
  const mover = pieceAt(state.position, move.from);
  if (!mover || !missionDestinations(payload, state, move.from).includes(move.to)) return state;
  const next: MissionState = {
    position: movePiece(state.position, move),
    starsLeft: state.starsLeft.filter((sq) => sq !== move.to),
    targetsLeft: state.targetsLeft.filter((sq) => sq !== move.to),
    used: state.used + 1,
    won: false,
  };
  return { ...next, won: goalReached(payload, next, mover, move.to) };
}

/** The child can still move: the goal is not reached and moves remain. */
export function missionOpen(payload: MissionPayload, state: MissionState): boolean {
  return !state.won && state.used < payload.budget;
}

/** Replay the child's moves: MISSION_DONE when the goal was reached in budget. */
export function missionVerdict(payload: MissionPayload, moves: Move[]): string {
  let state = missionStart(payload);
  for (const move of moves) state = missionApply(payload, state, move);
  if (state.won) return MISSION_DONE;
  const trail = moves.map((move) => [move.from, move.to].join("-")).join(" ");
  return `miss:${trail}`;
}
