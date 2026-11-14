// One entry point for every puzzle generator, plus the lesson facts they share:
// which pieces a task can be about, and the build environment of a lesson.
import type { GenContext, Question } from "../generators/types";
import type { RNG } from "../rng";
import { ALL_PIECES, buildWithFallback, clamp, type PuzzleEnv, type Recipe } from "./boards";
import { KING_RECIPES } from "./kingPuzzles";
import { MISSION_RECIPES } from "./missionPuzzles";
import { SPOT_RECIPES } from "./spotPuzzles";
import { TABLE_RECIPES } from "./tablePuzzles";
import type { ChessParams, ChessTask, PieceType } from "./types";

/** Every task, gentlest first: a lesson opens with the first of these it has. */
export const CHESS_TASKS: ChessTask[] = [
  "spot-moves", "count", "spot-captures", "spot-attackers", "spot-safe", "place",
  "stars", "capture", "promote", "check", "escape", "mate",
];
/** Tasks played on the board with a move budget — a lesson ends on one. */
export const MISSION_TASKS: ChessTask[] = ["stars", "capture", "promote", "check", "escape", "mate"];
/** Tasks that can be about a piece from an earlier unit (spaced review). */
export const REVIEW_TASKS: ChessTask[] = ["spot-moves", "spot-captures", "stars", "capture"];

const RECIPES: Record<ChessTask, Recipe> = { ...SPOT_RECIPES, ...MISSION_RECIPES, ...KING_RECIPES, ...TABLE_RECIPES };

/** The pieces a task can be about (null = any). */
const HEROES: Partial<Record<ChessTask, PieceType[]>> = {
  "spot-captures": ["Q", "R", "B", "N", "P"],
  "spot-attackers": ["K"],
  "spot-safe": ["K"],
  stars: ["K", "Q", "R", "B", "N"],
  promote: ["P"],
  check: ["Q", "R", "B", "N"],
  escape: ["K"],
  mate: ["Q", "R"],
};
/** Tasks whose piece is fixed by the task itself, whatever the lesson teaches. */
const FIXED: ChessTask[] = ["spot-attackers", "spot-safe", "promote", "escape"];

/** A lesson's params, cleaned up. */
export interface LessonSpec {
  pieces: PieceType[];
  /** Earlier pieces that are not also lesson pieces. */
  review: PieceType[];
  tasks: ChessTask[];
  size: number;
  /** The lesson teaches piece values. */
  values: boolean;
}

function knownPieces(list: unknown): PieceType[] {
  return Array.isArray(list) ? ALL_PIECES.filter((type) => list.includes(type)) : [];
}

export function makeSpec(params: ChessParams): LessonSpec {
  const given = knownPieces(params.pieces);
  const pieces = given.length ? given : (["R"] as PieceType[]);
  const asked = Array.isArray(params.tasks) ? params.tasks.filter((task) => CHESS_TASKS.includes(task)) : [];
  const tasks = [...new Set(asked)];
  return {
    pieces,
    review: knownPieces(params.review).filter((type) => !pieces.includes(type)),
    tasks: tasks.length ? tasks : ["spot-moves"],
    size: clamp(Math.round(Number(params.size) || 5), 4, 6),
    values: tasks.includes("count"),
  };
}

export function supports(task: ChessTask, piece: PieceType): boolean {
  return HEROES[task]?.includes(piece) ?? true;
}

/** The lesson pieces this task can be about; a sensible stand-in when none fits. */
export function heroesFor(task: ChessTask, spec: LessonSpec): PieceType[] {
  const able = HEROES[task] ?? ALL_PIECES;
  if (FIXED.includes(task)) return able;
  const own = spec.pieces.filter((type) => able.includes(type));
  if (own.length) return own;
  const earlier = spec.review.filter((type) => able.includes(type));
  return earlier.length ? earlier : [able.includes("R") ? "R" : able[0]];
}

/** Earlier pieces this task can revisit. */
export function reviewHeroes(task: ChessTask, spec: LessonSpec): PieceType[] {
  return REVIEW_TASKS.includes(task) ? spec.review.filter((type) => supports(task, type)) : [];
}

export function envFor(spec: LessonSpec, piece: PieceType, rng: RNG, ctx: GenContext): PuzzleEnv {
  return {
    rng,
    difficulty: clamp(Number(ctx.difficulty) || 0, 0, 1),
    easier: ctx.easier === true,
    size: spec.size,
    piece,
    pieces: spec.pieces,
    known: [...spec.pieces, ...spec.review],
    values: spec.values,
  };
}

export function buildPuzzle(task: ChessTask, piece: PieceType, spec: LessonSpec, rng: RNG, ctx: GenContext): Question {
  return buildWithFallback(task, envFor(spec, piece, rng, ctx), RECIPES[task]);
}

/** The task's last-resort puzzle (scripts/audit-chess.ts proves each one is sound). */
export function floorPuzzle(task: ChessTask, piece: PieceType, spec: LessonSpec, rng: RNG, ctx: GenContext): Question {
  return RECIPES[task].floor(envFor(spec, piece, rng, ctx));
}
