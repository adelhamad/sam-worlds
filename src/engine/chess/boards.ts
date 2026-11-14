// Shared pieces of the Chess Camp puzzle generators: the build environment,
// board helpers, the question factory and the question-identity keys.
import type { Question } from "../generators/types";
import { pick, type RNG } from "../rng";
import { CHESS } from "../../strings/chess";
import { recordBuild } from "./genStats";
import { attacks, rowOf } from "./rules";
import type { ChessPayload, ChessTask, Piece, PieceType, Position } from "./types";

/** Everything one puzzle generator needs. */
export interface PuzzleEnv {
  rng: RNG;
  /** 0..1 — more pieces, bigger boards and longer plans as it grows. */
  difficulty: number;
  /** Set after repeated misses: smallest board, fewest pieces, one move. */
  easier: boolean;
  /** Largest board the lesson allows (4–6). */
  size: number;
  /** The piece the puzzle is about. */
  piece: PieceType;
  /** The lesson's own pieces. */
  pieces: PieceType[];
  /** Every piece the child has met so far (lesson + review). */
  known: PieceType[];
  /** The lesson teaches piece values ("Capture the best piece!"). */
  values: boolean;
}

export const ALL_PIECES: PieceType[] = ["K", "Q", "R", "B", "N", "P"];
const ENEMY_GENTLE: PieceType[] = ["P", "P", "P", "N", "B"];
const ENEMY_MIXED: PieceType[] = ["P", "P", "N", "B", "R", "Q"];
const THREATS: PieceType[] = ["Q", "R", "B", "N"];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function pieceName(type: PieceType): string {
  return CHESS.piece[type];
}

export function white(type: PieceType, sq: number): Piece {
  return { type, side: "w", sq };
}

export function black(type: PieceType, sq: number): Piece {
  return { type, side: "b", sq };
}

export function withPiece(position: Position, piece: Piece): Position {
  return { size: position.size, pieces: [...position.pieces, piece] };
}

/** Board width for this puzzle: small when gentle, never above the lesson's size. */
export function boardSize(env: PuzzleEnv, min = 4): number {
  const max = clamp(Math.round(env.size), min, 6);
  if (env.easier) return min;
  return env.difficulty < 0.35 && env.rng() < 0.5 ? Math.max(min, max - 1) : max;
}

export function allSquares(size: number): number[] {
  return Array.from({ length: size * size }, (_, sq) => sq);
}

export function freeSquares(position: Position): number[] {
  const taken = new Set(position.pieces.map((piece) => piece.sq));
  return allSquares(position.size).filter((sq) => !taken.has(sq));
}

/** Pawns never stand on the first or last row. */
export function pawnCanStand(sq: number, size: number): boolean {
  const row = rowOf(sq, size);
  return row > 0 && row < size - 1;
}

/** A black piece for this square: mostly pawns in gentle puzzles. */
export function enemyType(env: PuzzleEnv, sq: number, size: number): PieceType {
  const type = pick(env.rng, env.easier || env.difficulty < 0.4 ? ENEMY_GENTLE : ENEMY_MIXED);
  return type === "P" && !pawnCanStand(sq, size) ? "N" : type;
}

/** Black pieces whose moves the child already knows — used when their attacks matter. */
export function threatTypes(env: PuzzleEnv): PieceType[] {
  const known = THREATS.filter((type) => env.known.includes(type));
  return known.length ? known : ["R"];
}

/** Free squares from which a black piece of this type attacks `target`. */
export function aimSquares(position: Position, type: PieceType, target: number): number[] {
  return freeSquares(position).filter((sq) => attacks(position, black(type, sq)).includes(target));
}

/** Compact identity of a board: size, then every piece (black in lower case) with its square. */
export function fingerprint(position: Position): string {
  const marks = position.pieces.map((piece) => `${piece.side === "w" ? piece.type : piece.type.toLowerCase()}${piece.sq}`);
  return `${position.size}${marks.sort((a, b) => a.localeCompare(b)).join("")}`;
}

export function chessQuestion(prompt: string, answer: string, hint: string, payload: ChessPayload, print: string): Question {
  return {
    id: "",
    prompt,
    answer,
    choices: [],
    hint,
    inputMode: "tour",
    repeatable: true,
    dedupeKey: `chess:${payload.task}:${payload.piece}:${print}`,
    payload: payload as unknown as Record<string, unknown>,
  };
}

const TRIES = 60;

/** How one task's puzzles are made. */
export interface Recipe {
  /** Sample one board; null when it does not pass the task's checks. */
  attempt: (env: PuzzleEnv) => Question | null;
  /** A hand-built puzzle that is always valid — the last resort. */
  floor: (env: PuzzleEnv) => Question;
  /** Boards sampled before falling back (rare positions need more). */
  tries?: number;
}

/**
 * Sample boards until one passes its checks. When the asked difficulty keeps
 * missing, the gentle variant is sampled; after that the recipe's floor is
 * used — so a generator never comes back empty.
 */
export function buildWithFallback(task: ChessTask, env: PuzzleEnv, recipe: Recipe): Question {
  const tries = recipe.tries ?? TRIES;
  for (let i = 0; i < tries; i++) {
    const question = recipe.attempt(env);
    if (question) {
      recordBuild(task, i + 1, "main");
      return question;
    }
  }
  const gentle: PuzzleEnv = { ...env, difficulty: Math.min(env.difficulty, 0.2), easier: true };
  for (let i = 0; i < tries; i++) {
    const question = recipe.attempt(gentle);
    if (question) {
      recordBuild(task, tries + i + 1, "gentle");
      return question;
    }
  }
  recordBuild(task, tries * 2, "floor");
  return recipe.floor(env);
}

// ---------- question identity ----------

export function subjectKey(dedupeKey: string): string {
  return `subject:${dedupeKey}`;
}

function visibleKey(q: Question): string {
  return `visible:${JSON.stringify([q.prompt, q.answer, q.payload ?? null])}`;
}

/**
 * Same identity keys as `questionKeys` in generators/index (which imports the
 * planner, so it cannot be imported back here). scripts/audit-chess.ts checks
 * the two never drift apart.
 */
export function chessKeys(q: Question): string[] {
  return q.dedupeKey ? [subjectKey(q.dedupeKey), visibleKey(q)] : [visibleKey(q)];
}

export function isFresh(q: Question, seen: ReadonlySet<string>): boolean {
  return !chessKeys(q).some((key) => seen.has(key));
}

/** The same puzzle under a numbered subject, for a session that has truly seen everything. */
export function asVariant(q: Question, seen: ReadonlySet<string>): Question {
  let n = 2;
  while (seen.has(subjectKey(`${q.dedupeKey}#${n}`))) n++;
  return { ...q, dedupeKey: `${q.dedupeKey}#${n}` };
}
