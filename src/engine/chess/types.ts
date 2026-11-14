// Chess Camp — CONTRACT shared by the puzzle planner (engine), the chess
// widgets (UI) and the lesson screen. Every chess question is a normal engine
// `Question` with `inputMode: "tour"` (the lesson-player mode), `repeatable:
// true` and one of the payloads below; the store judges it with plain
// `typed === question.answer`, using the serialisers in ./judge.ts.
import type { Question } from "../generators/types";

export type PieceType = "K" | "Q" | "R" | "B" | "N" | "P";
export type Side = "w" | "b";

export interface Piece {
  type: PieceType;
  side: Side;
  /** Square index = row * size + col. Row 0 is the TOP of the board (the far
   * side); the child plays White from the bottom, so white pawns move toward row 0. */
  sq: number;
}

/** A square mini-board (4–6 squares wide — big enough to tap on a phone). */
export interface Position {
  size: number;
  pieces: Piece[];
}

export interface Move {
  from: number;
  to: number;
}

export type ChessKind = "chess-spot" | "chess-mission" | "chess-count" | "chess-place";

/** What a lesson may ask. The planner maps each task to a kind + variant. */
export type ChessTask =
  | "spot-moves" // tap every square the piece can move to
  | "spot-captures" // tap every enemy piece it can capture
  | "spot-attackers" // tap every enemy piece attacking your piece
  | "spot-safe" // tap every square the king can safely step to
  | "stars" // collect all stars within the move budget
  | "capture" // capture all marked enemy pieces within the move budget
  | "promote" // get a pawn to the far row within the move budget
  | "check" // give check in one move
  | "escape" // get your king out of check in one move
  | "mate" // checkmate in one move
  | "count" // add up piece values
  | "place"; // put pieces on their home squares

/** What the lesson's opening demo teaches (content/chess/intros.ts). */
export type ChessIntroKey = PieceType | "values" | "home" | "check" | "mate";

/** Stage params for a chess lesson (StageDef.params). */
export interface ChessParams {
  /** Pieces this lesson centres on. */
  pieces: PieceType[];
  /** Earlier pieces mixed in for spaced review. */
  review: PieceType[];
  tasks: ChessTask[];
  /** Largest board the lesson uses (4–6). */
  size: number;
  /** Opening demo shown before the first question of a fresh session. */
  intro?: ChessIntroKey;
}

interface ChessBase {
  tour: ChessKind;
  /** The task this question came from (a replacement keeps the same task). */
  task: ChessTask;
  /** The piece the question is mainly about. */
  piece: PieceType;
  /** Few possible answers: demand a second correct answer after a miss. */
  guessable?: boolean;
}

/** Tap a set of squares, then CHECK. answer = spotAnswer(squares). */
export interface SpotPayload extends ChessBase {
  tour: "chess-spot";
  ask: "moves" | "captures" | "attackers" | "safe";
  position: Position;
  /** Square of the piece the question is about (drawn highlighted). */
  focus: number;
}

export type MissionGoal = "stars" | "capture" | "promote" | "check" | "escape" | "mate";

/**
 * Move White's pieces to reach a goal within `budget` moves. Black never moves.
 * Self-submitting: the widget reports missionVerdict(payload, moves) the moment
 * the goal is reached or the moves run out. answer = MISSION_DONE.
 */
export interface MissionPayload extends ChessBase {
  tour: "chess-mission";
  goal: MissionGoal;
  position: Position;
  /** Squares holding a star to collect (goal "stars"); otherwise empty. */
  stars: number[];
  /** Squares of the black pieces that must be captured (goal "capture"); otherwise empty. */
  targets: number[];
  /** Moves allowed — always the fewest that can do it. */
  budget: number;
  /** One shortest solution, for the teach card. */
  solution: Move[];
}

/** Add up the points of the pieces shown; typed on a number pad. answer = countAnswer(pieces). */
export interface CountPayload extends ChessBase {
  tour: "chess-count";
  pieces: PieceType[];
}

/**
 * Put pieces on their home squares of White's back row (a1…h1, left to right).
 * `row` holds what is already there (null = empty); the child places every
 * piece in `tray`. answer = placeAnswer(final row).
 */
export interface PlacePayload extends ChessBase {
  tour: "chess-place";
  row: Array<PieceType | null>;
  tray: PieceType[];
}

export type ChessPayload = SpotPayload | MissionPayload | CountPayload | PlacePayload;

/** Narrow a generic question to its chess payload (null for everything else). */
export function chessPayload(q: Question | null | undefined): ChessPayload | null {
  const p = q?.payload as { tour?: unknown } | undefined;
  return q?.inputMode === "tour" && typeof p?.tour === "string" && p.tour.startsWith("chess-")
    ? (q.payload as unknown as ChessPayload)
    : null;
}
