// One-move missions about the king: give check, get out of check, checkmate.
// Boards are sampled and then filtered with the real rules, so every puzzle
// is a position that could happen in a game.
import type { Question } from "../generators/types";
import { pick, shuffle } from "../rng";
import { CHESS } from "../../strings/chess";
import {
  aimSquares, allSquares, black, boardSize, enemyType, freeSquares, pawnCanStand, threatTypes, white,
  withPiece, type PuzzleEnv, type Recipe,
} from "./boards";
import { attackersOf, attacks, colOf, inCheck, isSanePosition, isStalemate, pieceAt, rowOf } from "./rules";
import { firstMoves, missionQuestion, type FirstMove, type MissionBase } from "./solver";
import type { ChessTask, MissionGoal, PieceType, Position } from "./types";

const S = CHESS.engine;
const CHECKERS: PieceType[] = ["Q", "R", "B", "N"];
const MATERS: PieceType[] = ["Q", "R"];
/** Check and mate boards are rare among random ones, so they get more samples. */
const CHECK_TRIES = 200;
const MATE_TRIES = 400;

function baseOf(task: ChessTask & MissionGoal, piece: PieceType, position: Position): MissionBase {
  return { tour: "chess-mission", task, piece, goal: task, position, stars: [], targets: [] };
}

function distance(a: number, b: number, size: number): number {
  return Math.max(Math.abs(rowOf(a, size) - rowOf(b, size)), Math.abs(colOf(a, size) - colOf(b, size)));
}

/** The lesson's pieces that can do this job, with the asked piece first. */
function army(env: PuzzleEnv, able: PieceType[]): PieceType[] {
  const allowed = able.filter((type) => env.pieces.includes(type));
  const pool = allowed.length ? allowed : able;
  const main = pool.includes(env.piece) ? env.piece : pool[0];
  return [main, ...pool.filter((type) => type !== main)];
}

/** A winning first move made by a piece of this type — one that keeps clear of the black king when there is a choice. */
function winBy(position: Position, moves: FirstMove[], type: PieceType): FirstMove | undefined {
  const wins = moves.filter((entry) => entry.won && pieceAt(position, entry.move.from)?.type === type);
  const king = position.pieces.find((piece) => piece.side === "b" && piece.type === "K");
  return wins.find((entry) => !king || distance(entry.move.to, king.sq, position.size) > 1) ?? wins[0];
}

// ---------- check ----------

function checkQuestion(main: PieceType, position: Position): Question | null {
  if (!isSanePosition(position) || inCheck(position, "w")) return null;
  const base = baseOf("check", main, position);
  const moves = firstMoves(base);
  const mine = winBy(position, moves, main);
  // Few checking moves among many: tapping around will not find one.
  if (!mine || moves.filter((entry) => entry.won).length > moves.length * 0.4) return null;
  return missionQuestion(S.check, S.hintCheck, base, [mine.move]);
}

function tryCheck(env: PuzzleEnv): Question | null {
  const { rng } = env;
  const size = boardSize(env);
  const [main, ...others] = army(env, CHECKERS);
  const squares = shuffle(rng, allSquares(size));
  const pieces = [black("K", squares[0]), white(main, squares[1])];
  if (others.length && env.difficulty > 0.5 && rng() < 0.4) pieces.push(white(pick(rng, others), squares[2]));
  // The queen checks from so many squares that she always brings her king: his steps are the quiet moves.
  if (main === "Q" || (!env.easier && rng() < 0.6)) pieces.push(white("K", squares[3]));
  // A black piece that may stand in a line.
  if (env.difficulty > 0.6 && rng() < 0.35) pieces.push(black(enemyType(env, squares[4], size), squares[4]));
  return checkQuestion(main, { size, pieces });
}

/** King in the corner; the piece stands where exactly one or two of its moves give check. */
function floorCheck(env: PuzzleEnv): Question {
  const [main] = army(env, CHECKERS);
  const size = Math.min(env.size, 5);
  const corner = size * size - 1;
  for (const sq of allSquares(size).reverse()) {
    const question = checkQuestion(main, { size, pieces: [black("K", 0), white(main, sq), white("K", corner)] });
    if (question) return question;
  }
  const base = baseOf("check", "R", { size: 4, pieces: [black("K", 0), white("R", 13)] });
  return missionQuestion(S.check, S.hintCheck, base, [{ from: 13, to: 12 }]);
}

// ---------- escape ----------

function escapeQuestion(position: Position, king: number): Question | null {
  if (attackersOf(position, king, "b").length !== 1) return null;
  const base: MissionBase = { ...baseOf("escape", "K", position), guessable: true };
  const moves = firstMoves(base);
  const wins = moves.filter((entry) => entry.won);
  // Some steps save the king and some do not: he has to look first.
  if (!wins.length || wins.length === moves.length || wins.length > moves.length * 0.6) return null;
  return missionQuestion(S.escape, S.hintEscape, base, [wins[0].move]);
}

function tryEscape(env: PuzzleEnv): Question | null {
  const { rng } = env;
  const size = boardSize(env);
  const king = pick(rng, allSquares(size));
  const hero = white("K", king);
  let position: Position = { size, pieces: [hero] };
  const around = attacks(position, hero);
  const types = threatTypes(env);
  const calm = env.easier || env.difficulty < 0.5;
  const checker = pick(rng, types);
  // In gentle puzzles the checking piece stands back, out of the king's reach.
  const aims = aimSquares(position, checker, king).filter((sq) => !calm || !around.includes(sq));
  if (!aims.length) return null;
  position = withPiece(position, black(checker, pick(rng, aims)));
  if (!env.easier && rng() < 0.3 + env.difficulty * 0.5) {
    const guard = pick(rng, types);
    const quiet = freeSquares(position)
      .filter((sq) => !around.includes(sq) && !attacks(position, black(guard, sq)).includes(king));
    if (quiet.length) position = withPiece(position, black(guard, pick(rng, quiet)));
  }
  return escapeQuestion(position, king);
}

/** A rook checks down the file: stepping along the file does not help, stepping aside does. */
function floorEscape(): Question {
  const position: Position = { size: 4, pieces: [white("K", 12), black("R", 0)] };
  const base: MissionBase = { ...baseOf("escape", "K", position), guessable: true };
  return missionQuestion(S.escape, S.hintEscape, base, [{ from: 12, to: 13 }]);
}

// ---------- mate ----------

function onEdge(sq: number, size: number): boolean {
  return [0, size - 1].includes(rowOf(sq, size)) || [0, size - 1].includes(colOf(sq, size));
}

/** White's attackers: a lone queen or rook, two rooks (the ladder), or queen and rook. */
function mateArmy(env: PuzzleEnv): PieceType[] {
  const [main, ...others] = army(env, MATERS);
  const roll = env.rng();
  if (roll < 0.45) return [main];
  if (main === "R" && roll < 0.8) return ["R", "R"];
  return others.length ? [main, others[0]] : [main];
}

function mateQuestion(main: PieceType, position: Position): Question | null {
  if (!isSanePosition(position) || inCheck(position, "w") || isStalemate(position, "b")) return null;
  const base = baseOf("mate", main, position);
  const moves = firstMoves(base);
  const mine = winBy(position, moves, main);
  // One or two mating moves only: the child has to find THE move.
  if (!mine || moves.filter((entry) => entry.won).length > 2) return null;
  return missionQuestion(S.mate, S.hintMate, base, [mine.move]);
}

function tryMate(env: PuzzleEnv): Question | null {
  const { rng } = env;
  const size = boardSize(env);
  const squares = allSquares(size);
  const attackers = mateArmy(env);
  // Kings are mated on the edge, usually with the white king two squares away.
  const target = pick(rng, squares.filter((sq) => onEdge(sq, size)));
  const facing = squares.filter((sq) => distance(sq, target, size) === 2);
  const guard = rng() < 0.7 ? pick(rng, facing) : pick(rng, squares.filter((sq) => sq !== target));
  let position: Position = { size, pieces: [black("K", target), white("K", guard)] };
  for (const type of attackers) position = withPiece(position, white(type, pick(rng, freeSquares(position))));
  const pawnSpots = freeSquares(position).filter((sq) => pawnCanStand(sq, size));
  if (pawnSpots.length && env.difficulty > 0.6 && rng() < 0.25) position = withPiece(position, black("P", pick(rng, pawnSpots)));
  return mateQuestion(attackers[0], position);
}

/** The white king takes the second row away; the queen or rook mates on the top row. */
function floorMate(env: PuzzleEnv): Question {
  const [main] = army(env, MATERS);
  const position: Position = { size: 4, pieces: [black("K", 0), white("K", 8), white(main, 14)] };
  return missionQuestion(S.mate, S.hintMate, baseOf("mate", main, position), [{ from: 14, to: 2 }]);
}

export const KING_RECIPES = {
  check: { attempt: tryCheck, floor: floorCheck, tries: CHECK_TRIES },
  escape: { attempt: tryEscape, floor: floorEscape },
  mate: { attempt: tryMate, floor: floorMate, tries: MATE_TRIES },
} satisfies Record<string, Recipe>;
