// Hands-on missions with a move budget: collect the stars, capture the marked
// pieces, walk a pawn to the top. The budget is always the fewest moves that
// can do it (solver.ts).
import type { Question } from "../generators/types";
import { pick, randInt, shuffle } from "../rng";
import { CHESS } from "../../strings/chess";
import {
  allSquares, black, boardSize, clamp, enemyType, freeSquares, pawnCanStand, pieceName, threatTypes,
  white, withPiece, type PuzzleEnv, type Recipe,
} from "./boards";
import { PIECE_VALUE } from "./judge";
import { attacks, colOf, inCheck, pieceAt, pseudoMoves, rowOf, squareAt } from "./rules";
import { missionQuestion, solveMission, type MissionBase, type MoveFilter } from "./solver";
import type { ChessTask, MissionGoal, Piece, PieceType, Position } from "./types";

const S = CHESS.engine;
const VALUE_ORDER: PieceType[] = ["Q", "R", "B", "N", "P"];

function baseOf(task: ChessTask & MissionGoal, piece: PieceType, position: Position, stars: number[], targets: number[]): MissionBase {
  return { tour: "chess-mission", task, piece, goal: task, position, stars, targets };
}

const ascending = (a: number, b: number) => a - b;

function enemyAt(env: PuzzleEnv, sq: number, size: number): Piece {
  return black(enemyType(env, sq, size), sq);
}

/** Fewest and most moves a mission of this difficulty may take. */
function budgetRange(env: PuzzleEnv, top: number): [number, number] {
  if (env.easier) return [1, 1];
  if (env.difficulty < 0.35) return [1, 2];
  return [2, env.difficulty > 0.8 ? top : Math.min(top, 3)];
}

// ---------- stars ----------

/** A pawn cannot roam, so it never leads a star hunt. */
function starHero(env: PuzzleEnv): PieceType {
  return env.piece === "P" ? "R" : env.piece;
}

/** Black pieces in the way. None for the king (he may not walk into attacks) or in gentle puzzles. */
function rocks(env: PuzzleEnv, size: number, start: number, hero: PieceType): Piece[] {
  if (hero === "K" || env.easier || env.difficulty < 0.35) return [];
  const amount = randInt(env.rng, 0, env.difficulty > 0.7 ? 3 : 2);
  const squares = shuffle(env.rng, allSquares(size).filter((sq) => sq !== start)).slice(0, amount);
  return squares.map((sq) => enemyAt(env, sq, size));
}

/** Walk the hero over empty squares; the squares it lands on become star candidates. */
function wander(env: PuzzleEnv, size: number, hero: Piece, others: Piece[], steps: number): number[] {
  const landings: number[] = [];
  let at = hero.sq;
  for (let i = 0; i < steps; i++) {
    const walker = white(hero.type, at);
    const position: Position = { size, pieces: [walker, ...others] };
    const options = pseudoMoves(position, walker)
      .filter((sq) => sq !== hero.sq && !landings.includes(sq) && !pieceAt(position, sq));
    if (!options.length) break;
    at = pick(env.rng, options);
    landings.push(at);
  }
  return landings;
}

function starsQuestion(hero: Piece, position: Position, stars: number[], low: number, high: number): Question | null {
  const base = baseOf("stars", hero.type, position, stars, []);
  const solution = solveMission(base, high);
  if (!solution || solution.length < low) return null;
  return missionQuestion(S.stars(stars.length, solution.length), S.hintMove[hero.type], base, solution);
}

function tryStars(env: PuzzleEnv): Question | null {
  const { rng } = env;
  const size = boardSize(env);
  const [low, high] = budgetRange(env, 4);
  const hero = white(starHero(env), randInt(rng, 0, size * size - 1));
  const others = rocks(env, size, hero.sq, hero.type);
  const landings = wander(env, size, hero, others, randInt(rng, low, high));
  if (landings.length < low) return null;
  const last = landings[landings.length - 1];
  const extra = shuffle(rng, landings.slice(0, -1)).filter(() => rng() < 0.6).slice(0, 2);
  const stars = [last, ...extra].sort(ascending);
  return starsQuestion(hero, { size, pieces: [hero, ...others] }, stars, low, high);
}

/** One star, one move, on the smallest board. */
function floorStars(env: PuzzleEnv): Question {
  const hero = white(starHero(env), pick(env.rng, [0, 3, 12, 15]));
  const position: Position = { size: 4, pieces: [hero] };
  const star = pick(env.rng, pseudoMoves(position, hero));
  const base = baseOf("stars", hero.type, position, [star], []);
  return missionQuestion(S.stars(1, 1), S.hintMove[hero.type], base, [{ from: hero.sq, to: star }]);
}

// ---------- capture ----------

function capturePrompt(position: Position, targets: number[], moves: number): string {
  const only = targets.length === 1 ? pieceAt(position, targets[0]) : undefined;
  return only ? S.captureOne(pieceName(only.type), moves) : S.captureAll(moves);
}

function captureQuestion(hero: PieceType, position: Position, low: number, high: number, plain?: MoveFilter): Question | null {
  const targets = position.pieces.filter((piece) => piece.side === "b").map((piece) => piece.sq).sort(ascending);
  const base = baseOf("capture", hero, position, [], targets);
  const solution = solveMission(base, high);
  if (!solution || solution.length < low) return null;
  // With a filter, a line that respects it must be just as short.
  const shown = plain ? solveMission(base, solution.length, plain) : solution;
  if (!shown) return null;
  return missionQuestion(capturePrompt(position, targets, shown.length), S.hintCapture[hero], base, shown);
}

/** A target the king may meet: only pieces whose attacks the child can read. */
function targetAt(env: PuzzleEnv, sq: number, size: number): Piece {
  return env.piece === "K" ? black(pick(env.rng, threatTypes(env)), sq) : enemyAt(env, sq, size);
}

function tryPieceCapture(env: PuzzleEnv): Question | null {
  const { rng } = env;
  const size = boardSize(env);
  const [low, high] = budgetRange(env, 3);
  const start = randInt(rng, 0, size * size - 1);
  let position: Position = { size, pieces: [white(env.piece, start)] };
  let at = start;
  for (let i = randInt(rng, 1, high); i > 0; i--) {
    const open = freeSquares(position);
    // Mostly a chain: each target can be taken from the one before it.
    const chain = attacks(position, white(env.piece, at)).filter((sq) => open.includes(sq));
    const loose = env.difficulty >= 0.35 && rng() < 0.3;
    const pool = loose || !chain.length ? open : chain;
    if (!pool.length) return null;
    at = pick(rng, pool);
    position = withPiece(position, targetAt(env, at, size));
  }
  if (inCheck(position, "w")) return null;
  return captureQuestion(env.piece, position, low, high);
}

const noPromotion: MoveFilter = (state, move) =>
  pieceAt(state.position, move.from)?.type !== "P" || rowOf(move.to, state.position.size) > 0;

/** One to three white pawns; every capture is a diagonal step forward. */
function tryPawnCapture(env: PuzzleEnv): Question | null {
  const { rng } = env;
  const size = boardSize(env);
  const [low, high] = budgetRange(env, 3);
  const most = env.difficulty > 0.5 ? 3 : 2;
  const at = shuffle(rng, allSquares(size).filter((sq) => sq < size)).slice(0, randInt(rng, 1, env.easier ? 2 : most))
    .map((col) => randInt(rng, 2, size - 2) * size + col);
  let position: Position = { size, pieces: at.map((sq) => white("P", sq)) };
  for (let i = randInt(rng, 1, high); i > 0; i--) {
    const index = randInt(rng, 0, at.length - 1);
    // Sometimes the pawn has to step forward before it can capture.
    const stepFirst = env.difficulty >= 0.35 && rng() < 0.3;
    const row = rowOf(at[index], size) - (stepFirst ? 2 : 1);
    const col = colOf(at[index], size);
    const spots = [squareAt(row, col - 1, size), squareAt(row, col + 1, size)]
      .filter((sq): sq is number => sq !== null && row >= 1 && !pieceAt(position, sq));
    if (!spots.length) return null;
    at[index] = pick(rng, spots);
    position = withPiece(position, enemyAt(env, at[index], size));
  }
  return captureQuestion("P", position, low, high, noPromotion);
}

/** "Queen 9, rook 5, pawn 1." for the black pieces on the board. */
function valuesHint(position: Position): string {
  const kinds = VALUE_ORDER.filter((type) => position.pieces.some((piece) => piece.side === "b" && piece.type === type));
  return S.hintCount(kinds.map((type) => `${pieceName(type)} ${PIECE_VALUE[type]}`));
}

/** Piece Points: several pieces can be taken — pick the one worth the most. */
function tryBestCapture(env: PuzzleEnv): Question | null {
  const { rng } = env;
  const size = boardSize(env);
  const hero = white(env.piece, randInt(rng, 0, size * size - 1));
  let position: Position = { size, pieces: [hero] };
  const reach = shuffle(rng, attacks(position, hero));
  const types = shuffle(rng, ["P", pick(rng, ["N", "B"] as const), "R", "Q"] as PieceType[]).slice(0, env.difficulty > 0.5 ? 3 : 2);
  if (reach.length < types.length) return null;
  for (const [index, type] of types.entries()) {
    if (type === "P" && !pawnCanStand(reach[index], size)) return null;
    position = withPiece(position, black(type, reach[index]));
  }
  const idle = freeSquares(position).filter((sq) => !attacks(position, hero).includes(sq));
  // A big piece out of reach: tempting, but not on offer.
  if (idle.length && env.difficulty > 0.6 && rng() < 0.5) position = withPiece(position, black(pick(rng, ["R", "Q"] as const), pick(rng, idle)));
  const takeable = pseudoMoves(position, hero).map((sq) => pieceAt(position, sq)).filter((piece): piece is Piece => !!piece);
  const best = Math.max(...takeable.map((piece) => PIECE_VALUE[piece.type]));
  const top = takeable.filter((piece) => PIECE_VALUE[piece.type] === best);
  if (takeable.length < 2 || top.length !== 1) return null;
  const base = baseOf("capture", hero.type, position, [], [top[0].sq]);
  return missionQuestion(S.captureBest, valuesHint(position), base, [{ from: hero.sq, to: top[0].sq }]);
}

function tryCapture(env: PuzzleEnv): Question | null {
  if (env.piece === "P") return tryPawnCapture(env);
  if (env.values && env.piece !== "K" && env.rng() < 0.4) return tryBestCapture(env);
  return tryPieceCapture(env);
}

/** One lone knight, one move away, on the smallest board. */
function floorCapture(env: PuzzleEnv): Question {
  const hero = white(env.piece, env.piece === "P" ? 9 : pick(env.rng, [0, 3, 12, 15]));
  const bare: Position = { size: 4, pieces: [hero] };
  const target = pick(env.rng, attacks(bare, hero));
  const position = withPiece(bare, black("N", target));
  const base = baseOf("capture", hero.type, position, [], [target]);
  return missionQuestion(capturePrompt(position, [target], 1), S.hintCapture[hero.type], base, [{ from: hero.sq, to: target }]);
}

// ---------- promote ----------

function promoteQuestion(position: Position, top: number): Question | null {
  const base = baseOf("promote", "P", position, [], []);
  const solution = solveMission(base, top);
  if (!solution || solution.length < 2) return null;
  return missionQuestion(S.promote(solution.length), S.hintMove.P, base, solution);
}

function tryPromote(env: PuzzleEnv): Question | null {
  const { rng } = env;
  const size = clamp(boardSize(env, 5), 5, 6);
  const gentle = env.easier || env.difficulty < 0.4;
  const pawns = shuffle(rng, allSquares(size).filter((sq) => sq < size)).slice(0, gentle ? 1 : randInt(rng, 1, 2))
    .map((col) => white("P", randInt(rng, 2, size - 2) * size + col));
  let position: Position = { size, pieces: pawns };
  for (let amount = gentle ? randInt(rng, 0, 1) : randInt(rng, 1, 3); amount > 0; amount--) {
    const open = freeSquares(position);
    // In a pawn's way: straight ahead (a wall) or one file over (a snack).
    const ahead = open.filter((sq) => pawns.some((pawn) =>
      rowOf(sq, size) < rowOf(pawn.sq, size) && Math.abs(colOf(sq, size) - colOf(pawn.sq, size)) <= 1));
    const sq = pick(rng, ahead.length && rng() < 0.8 ? ahead : open);
    position = withPiece(position, enemyAt(env, sq, size));
  }
  if (env.easier) return promoteQuestion(position, 2);
  return promoteQuestion(position, env.difficulty > 0.6 ? 4 : 3);
}

/** A lone pawn two steps from the top. */
function floorPromote(env: PuzzleEnv): Question {
  const from = 10 + randInt(env.rng, 0, 4);
  const base = baseOf("promote", "P", { size: 5, pieces: [white("P", from)] }, [], []);
  return missionQuestion(S.promote(2), S.hintMove.P, base, [{ from, to: from - 5 }, { from: from - 5, to: from - 10 }]);
}

export const MISSION_RECIPES = {
  stars: { attempt: tryStars, floor: floorStars },
  // A king's captures must all be legal, so fewer sampled boards pass.
  capture: { attempt: tryCapture, floor: floorCapture, tries: 150 },
  promote: { attempt: tryPromote, floor: floorPromote },
} satisfies Record<string, Recipe>;
