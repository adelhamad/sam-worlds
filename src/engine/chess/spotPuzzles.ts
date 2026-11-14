// "Spot" puzzles: tap every square a piece can go to, every piece it can
// capture, every piece attacking the king, or every safe square for the king.
import type { Question } from "../generators/types";
import { pick, randInt, shuffle } from "../rng";
import { CHESS } from "../../strings/chess";
import {
  aimSquares, black, boardSize, chessQuestion, clamp, enemyType, fingerprint, freeSquares,
  pawnCanStand, pieceName, threatTypes, white, withPiece, type PuzzleEnv, type Recipe,
} from "./boards";
import { spotAnswer, spotSolution } from "./judge";
import { attacks, colOf, inCheck, rowOf, squareAt } from "./rules";
import type { ChessTask, Piece, PieceType, Position, SpotPayload } from "./types";

const S = CHESS.engine;
const FRIENDS: PieceType[] = ["P", "N", "B", "R"];

interface SpotDraft {
  task: ChessTask;
  ask: SpotPayload["ask"];
  piece: PieceType;
  position: Position;
  focus: number;
  prompt: string;
  hint: string;
  guessable?: boolean;
}

function payloadOf(draft: SpotDraft): SpotPayload {
  const { task, ask, piece, position, focus } = draft;
  const payload: SpotPayload = { tour: "chess-spot", task, piece, ask, position, focus };
  return draft.guessable === undefined ? payload : { ...payload, guessable: draft.guessable };
}

function spotQuestion(draft: SpotDraft): Question {
  const payload = payloadOf(draft);
  const print = `${fingerprint(draft.position)}@${draft.focus}`;
  return chessQuestion(draft.prompt, spotAnswer(spotSolution(payload)), draft.hint, payload, print);
}

/** The question, when it has between `min` and `max` right squares. */
function spotWithin(draft: SpotDraft, min: number, max: number): Question | null {
  const amount = spotSolution(payloadOf(draft)).length;
  return amount >= min && amount <= max ? spotQuestion(draft) : null;
}

function movesDraft(piece: PieceType, position: Position, focus: number): SpotDraft {
  return { task: "spot-moves", ask: "moves", piece, position, focus, prompt: S.spotMoves(pieceName(piece)), hint: S.hintMove[piece] };
}

function capturesDraft(piece: PieceType, position: Position, focus: number): SpotDraft {
  return {
    task: "spot-captures", ask: "captures", piece, position, focus,
    prompt: S.spotCaptures(pieceName(piece)), hint: S.hintCapture[piece],
  };
}

function kingDraft(task: "spot-attackers" | "spot-safe", position: Position, focus: number): SpotDraft {
  return task === "spot-attackers"
    ? { task, ask: "attackers", piece: "K", position, focus, prompt: S.spotAttackers, hint: S.hintAttackers, guessable: false }
    : { task, ask: "safe", piece: "K", position, focus, prompt: S.spotSafe, hint: S.hintSafe };
}

function friendAt(env: PuzzleEnv, sq: number, size: number): Piece {
  const type = pick(env.rng, FRIENDS);
  return white(type === "P" && !pawnCanStand(sq, size) ? "N" : type, sq);
}

function enemyAt(env: PuzzleEnv, sq: number, size: number): Piece {
  return black(enemyType(env, sq, size), sq);
}

// ---------- spot-moves ----------

function distance(a: number, b: number, size: number): number {
  return Math.max(Math.abs(rowOf(a, size) - rowOf(b, size)), Math.abs(colOf(a, size) - colOf(b, size)));
}

/** How many pieces stand in the way: none when gentle, up to three later. The queen always needs some. */
function blockerCount(env: PuzzleEnv, size: number): number {
  const base = env.easier ? randInt(env.rng, 0, 1) : Math.round(env.difficulty * 3 + env.rng() - 0.5);
  const least = env.piece === "Q" ? size - 3 : 0;
  return clamp(Math.max(base, least), 0, 3);
}

function tryPieceMoves(env: PuzzleEnv): Question | null {
  const { rng } = env;
  const size = boardSize(env);
  const focus = randInt(rng, 0, size * size - 1);
  const hero = white(env.piece, focus);
  let position: Position = { size, pieces: [hero] };
  const lines = shuffle(rng, attacks(position, hero));
  // The queen reaches too many squares to tap: her blockers stand close, cutting whole lines.
  const reach = env.piece === "Q" ? lines.sort((a, b) => distance(a, focus, size) - distance(b, focus, size)) : lines;
  for (let i = blockerCount(env, size); i > 0; i--) {
    const open = freeSquares(position);
    const onLine = reach.filter((sq) => open.includes(sq));
    const sq = onLine.length && rng() < 0.8 ? onLine[0] : pick(rng, open);
    // A king only meets friends here: stepping next to enemies is a later lesson.
    const friendly = env.piece === "K" || rng() < 0.5;
    position = withPiece(position, friendly ? friendAt(env, sq, size) : enemyAt(env, sq, size));
  }
  return spotWithin(movesDraft(env.piece, position, focus), 2, 9);
}

/** A pawn with at least two moves: the double step from home, or a step plus a capture. */
function tryPawnMoves(env: PuzzleEnv): Question | null {
  const { rng } = env;
  const size = boardSize(env);
  const home = size - 2;
  const gentle = env.easier || env.difficulty < 0.4;
  const row = gentle || rng() < 0.5 ? home : randInt(rng, 1, home);
  const col = randInt(rng, 0, size - 1);
  const focus = row * size + col;
  let position: Position = { size, pieces: [white("P", focus)] };
  const diagonals = shuffle(rng, attacks(position, position.pieces[0]));
  // Away from home a pawn has one step, so it needs something to capture as well.
  const least = row === home ? 0 : 1;
  const captures = gentle ? 0 : randInt(rng, least, diagonals.length);
  for (const sq of diagonals.slice(0, captures)) position = withPiece(position, enemyAt(env, sq, size));
  const ahead = [squareAt(row - 1, col, size), squareAt(row - 2, col, size)];
  // A piece two squares ahead takes the double step away.
  if (captures > 0 && row === home && ahead[1] !== null && rng() < 0.3) position = withPiece(position, enemyAt(env, ahead[1], size));
  const idle = freeSquares(position).filter((sq) => !ahead.includes(sq) && !diagonals.includes(sq));
  if (idle.length && position.pieces.length < 4 && rng() < 0.5) position = withPiece(position, enemyAt(env, pick(rng, idle), size));
  return spotWithin(movesDraft("P", position, focus), 2, 9);
}

function tryMoves(env: PuzzleEnv): Question | null {
  return env.piece === "P" ? tryPawnMoves(env) : tryPieceMoves(env);
}

/** A lone piece in the corner of the smallest board (a pawn on its home row). */
function floorMoves(env: PuzzleEnv): Question {
  const focus = env.piece === "P" ? 8 + randInt(env.rng, 0, 3) : pick(env.rng, [0, 3, 12, 15]);
  return spotQuestion(movesDraft(env.piece, { size: 4, pieces: [white(env.piece, focus)] }, focus));
}

// ---------- spot-captures ----------

/** A king's captures depend on who guards what — that belongs to the capture missions. */
function captureHero(env: PuzzleEnv): PieceType {
  return env.piece === "K" ? "R" : env.piece;
}

/** Where a piece that can NOT be captured goes — hidden behind another piece when it should tempt. */
function decoySquare(env: PuzzleEnv, position: Position, hero: Piece, reach: number[]): number | null {
  const live = new Set(attacks(position, hero));
  const quiet = freeSquares(position).filter((sq) => !live.has(sq));
  const { size } = position;
  const front = hero.type === "P" ? squareAt(rowOf(hero.sq, size) - 1, colOf(hero.sq, size), size) : null;
  if (front !== null && quiet.includes(front) && env.rng() < 0.6) return front;
  const hidden = quiet.filter((sq) => reach.includes(sq));
  if (hidden.length && env.difficulty >= 0.5 && env.rng() < 0.7) return pick(env.rng, hidden);
  return quiet.length ? pick(env.rng, quiet) : null;
}

function tryCaptures(env: PuzzleEnv): Question | null {
  const { rng } = env;
  const size = boardSize(env);
  const type = captureHero(env);
  const focus = type === "P" ? randInt(rng, 1, size - 2) * size + randInt(rng, 0, size - 1) : randInt(rng, 0, size * size - 1);
  const hero = white(type, focus);
  let position: Position = { size, pieces: [hero] };
  const reach = shuffle(rng, attacks(position, hero));
  const total = env.easier ? 3 : clamp(3 + Math.round(env.difficulty * 2 + rng() - 0.5), 3, 5);
  const wanted = randInt(rng, 1, Math.min(3, total - 1, reach.length));
  for (const sq of reach.slice(0, wanted)) position = withPiece(position, enemyAt(env, sq, size));
  for (let i = wanted; i < total; i++) {
    const sq = decoySquare(env, position, hero, reach);
    if (sq === null) return null;
    position = withPiece(position, enemyAt(env, sq, size));
  }
  return spotWithin(capturesDraft(type, position, focus), 1, 3);
}

/** One knight to capture and two out of reach, on the smallest board. */
function floorCaptures(env: PuzzleEnv): Question {
  const type = captureHero(env);
  const focus = type === "P" ? 9 : 12;
  const hero = white(type, focus);
  const bare: Position = { size: 4, pieces: [hero] };
  const reach = attacks(bare, hero);
  const away = freeSquares(bare).filter((sq) => !reach.includes(sq));
  const pieces = [hero, black("N", reach[0]), black("N", away[0]), black("N", away[1])];
  return spotQuestion(capturesDraft(type, { size: 4, pieces }, focus));
}

// ---------- spot-attackers ----------

/** Squares where this black piece does not attack the king — lined up with it when it should tempt. */
function quietSquares(env: PuzzleEnv, position: Position, type: PieceType, king: number): number[] {
  const quiet = freeSquares(position).filter((sq) => !attacks(position, black(type, sq)).includes(king));
  const lines = attacks({ size: position.size, pieces: [] }, white("Q", king));
  const lined = quiet.filter((sq) => lines.includes(sq));
  return lined.length && env.difficulty >= 0.5 && env.rng() < 0.6 ? lined : quiet;
}

function tryAttackers(env: PuzzleEnv): Question | null {
  const { rng } = env;
  const size = boardSize(env);
  const king = randInt(rng, 0, size * size - 1);
  let position: Position = { size, pieces: [white("K", king)] };
  const types = threatTypes(env);
  const total = env.easier ? 2 : clamp(2 + Math.round(env.difficulty * 2 + rng() - 0.5), 2, 4);
  const hits = total > 2 && env.difficulty > 0.5 && rng() < 0.5 ? 2 : 1;
  for (let i = 0; i < total; i++) {
    const type = pick(rng, types);
    const pool = i < hits ? aimSquares(position, type, king) : quietSquares(env, position, type, king);
    if (!pool.length) return null;
    position = withPiece(position, black(type, pick(rng, pool)));
  }
  const draft = kingDraft("spot-attackers", position, king);
  const amount = spotSolution(payloadOf(draft)).length;
  // A later piece may have stepped into an attacker's line: recount.
  return amount >= 1 && amount <= 2 && amount < total ? spotQuestion(draft) : null;
}

/** A rook down the king's file and a knight that only looks dangerous. */
function floorAttackers(): Question {
  const pieces = [white("K", 12), black("R", 0), black("N", 3)];
  return spotQuestion(kingDraft("spot-attackers", { size: 4, pieces }, 12));
}

// ---------- spot-safe ----------

function trySafe(env: PuzzleEnv): Question | null {
  const { rng } = env;
  const size = boardSize(env);
  const king = randInt(rng, 0, size * size - 1);
  const hero = white("K", king);
  let position: Position = { size, pieces: [hero] };
  const around = attacks(position, hero);
  const calm = env.easier || env.difficulty < 0.5;
  const total = env.easier ? 1 : clamp(1 + Math.round(env.difficulty * 2 + rng() - 0.5), 1, 3);
  for (let i = 0; i < total; i++) {
    // Every black piece watches at least one square next to the king.
    const type = pick(rng, threatTypes(env));
    const pool = aimSquares(position, type, pick(rng, around)).filter((sq) => !calm || !around.includes(sq));
    if (!pool.length) return null;
    position = withPiece(position, black(type, pick(rng, pool)));
  }
  if (calm && inCheck(position, "w")) return null;
  const draft = kingDraft("spot-safe", position, king);
  const safe = spotSolution(payloadOf(draft));
  if (!around.some((sq) => !safe.includes(sq))) return null;
  return spotWithin(draft, 1, 6);
}

/** A rook guarding the next file: the cornered king has one safe step. */
function floorSafe(): Question {
  return spotQuestion(kingDraft("spot-safe", { size: 4, pieces: [white("K", 12), black("R", 1)] }, 12));
}

export const SPOT_RECIPES = {
  "spot-moves": { attempt: tryMoves, floor: floorMoves },
  "spot-captures": { attempt: tryCaptures, floor: floorCaptures },
  "spot-attackers": { attempt: tryAttackers, floor: floorAttackers },
  "spot-safe": { attempt: trySafe, floor: floorSafe },
} satisfies Record<string, Recipe>;
