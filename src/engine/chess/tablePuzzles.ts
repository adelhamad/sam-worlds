// Off-board puzzles: add up piece values, and set pieces on their home squares.
// Both always succeed — there is nothing to validate against the rules.
import type { Question } from "../generators/types";
import { pick, shuffle } from "../rng";
import { CHESS } from "../../strings/chess";
import { chessQuestion, clamp, pieceName, type PuzzleEnv, type Recipe } from "./boards";
import { HOME_ROW, PIECE_VALUE, countAnswer, placeAnswer } from "./judge";
import type { CountPayload, PieceType, PlacePayload } from "./types";

const S = CHESS.engine;

// ---------- count ----------

/** Pawns are common, the queen is rare — as on a real board. */
const COUNT_GENTLE: PieceType[] = ["P", "P", "P", "N", "B", "R"];
const COUNT_MIXED: PieceType[] = ["P", "P", "N", "B", "R", "R", "Q"];
const MAX_POINTS = 30;
const BY_VALUE: PieceType[] = ["Q", "R", "B", "N", "P"];

function total(pieces: PieceType[]): number {
  return pieces.reduce((sum, type) => sum + PIECE_VALUE[type], 0);
}

function countPieces(env: PuzzleEnv): PieceType[] {
  const { rng } = env;
  const amount = env.easier ? 2 + Math.floor(rng() * 2) : clamp(2 + Math.round(env.difficulty * 3 + rng() - 0.5), 2, 5);
  const bag = env.easier || env.difficulty < 0.4 ? COUNT_GENTLE : COUNT_MIXED;
  const pieces = Array.from({ length: amount }, () => pick(rng, bag));
  // Keep the sum small enough to add in your head: swap the biggest piece for a pawn.
  while (total(pieces) > MAX_POINTS) pieces[pieces.indexOf(BY_VALUE.find((type) => pieces.includes(type)) ?? "P")] = "P";
  return pieces;
}

function buildCount(env: PuzzleEnv): Question {
  const pieces = countPieces(env);
  const kinds = BY_VALUE.filter((type) => pieces.includes(type));
  const payload: CountPayload = { tour: "chess-count", task: "count", piece: kinds[0], pieces };
  const hint = S.hintCount(kinds.map((type) => `${pieceName(type)} ${PIECE_VALUE[type]}`));
  const print = [...pieces].sort((a, b) => a.localeCompare(b)).join("");
  return chessQuestion(S.count, countAnswer(pieces), hint, payload, print);
}

// ---------- place ----------

interface Group {
  /** Home squares (a1 = 0 … h1 = 7) the child fills. */
  squares: number[];
  prompt: string;
  hint: string;
}

const pair = (type: PieceType, squares: number[]): Group =>
  ({ squares, prompt: squares.length === 1 ? S.placeOne(pieceName(type)) : S.placeTwo(pieceName(type)), hint: S.hintPlace[type] });
const mixed = (squares: number[]): Group => ({ squares, prompt: S.placeGroup, hint: S.hintRow });

const SINGLE: Group[] = [pair("R", [0, 7]), pair("N", [1, 6]), pair("B", [2, 5]), pair("Q", [3]), pair("K", [4])];
const ROYALS: Group = { squares: [3, 4], prompt: S.placeRoyals, hint: S.hintPlace.Q };
const MIXED: Group[] = [
  mixed([0, 1, 6, 7]), mixed([1, 2, 5, 6]), mixed([2, 3, 4, 5]), mixed([0, 1, 2, 3]), mixed([4, 5, 6, 7]), mixed([0, 3, 4, 7]),
];
const WHOLE: Group = { squares: [0, 1, 2, 3, 4, 5, 6, 7], prompt: S.placeRow, hint: S.hintRow };

/** One kind of piece first, then king and queen together, mixed groups, and finally the whole row. */
function placeGroup(env: PuzzleEnv): Group {
  const { rng } = env;
  if (env.easier || env.difficulty < 0.3) return pick(rng, SINGLE);
  if (env.difficulty < 0.55) return pick(rng, [...SINGLE, ROYALS, ROYALS]);
  if (env.difficulty < 0.8) return pick(rng, [ROYALS, ...MIXED]);
  return rng() < 0.4 ? WHOLE : pick(rng, MIXED);
}

/** Which of the other squares already hold their piece: most of them in gentle puzzles. */
function filledSquares(env: PuzzleEnv, group: Group): number[] {
  const others = HOME_ROW.map((_, index) => index).filter((index) => !group.squares.includes(index));
  const share = env.easier ? 0.8 : clamp(0.9 - env.difficulty, 0.1, 0.8);
  const filled = others.filter(() => env.rng() < share);
  // Always leave a gap or two, so the tray pieces are not simply dropped into the only holes.
  const gaps = env.easier ? 1 : 2;
  return others.length - filled.length >= gaps ? filled : shuffle(env.rng, filled).slice(0, Math.max(0, others.length - gaps));
}

/** How many different ways the tray fits the empty squares (small = easy to guess). */
function arrangements(empty: number, tray: PieceType[]): number {
  let ways = 1;
  const used = new Map<PieceType, number>();
  tray.forEach((type, index) => {
    const same = (used.get(type) ?? 0) + 1;
    used.set(type, same);
    ways = (ways * (empty - index)) / same;
  });
  return ways;
}

function buildPlace(env: PuzzleEnv): Question {
  const group = placeGroup(env);
  const filled = filledSquares(env, group);
  const row = HOME_ROW.map((type, index) => (filled.includes(index) ? type : null));
  const done = HOME_ROW.map((type, index) => (filled.includes(index) || group.squares.includes(index) ? type : null));
  const tray = shuffle(env.rng, group.squares.map((index) => HOME_ROW[index]));
  const empty = row.filter((type) => type === null).length;
  const payload: PlacePayload = { tour: "chess-place", task: "place", piece: HOME_ROW[group.squares[0]], row, tray };
  const guessable = arrangements(empty, tray) <= 3;
  const print = `${placeAnswer(row)}>${placeAnswer(done)}`;
  return chessQuestion(group.prompt, placeAnswer(done), group.hint, guessable ? { ...payload, guessable } : payload, print);
}

export const TABLE_RECIPES = {
  count: { attempt: buildCount, floor: buildCount },
  place: { attempt: buildPlace, floor: buildPlace },
} satisfies Record<string, Recipe>;
