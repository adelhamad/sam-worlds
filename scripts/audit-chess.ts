// Chess Camp audit: plans every lesson many times and checks the contract in
// src/engine/chess/types.ts, the lesson-shape rules and the miss-replacement
// rules. Run alone (`bun scripts/audit-chess.ts`) or through audit-questions.ts.
import { CHESS_UNITS, chessParams } from "../src/content/chess/units";
import type { StageDef } from "../src/content/types";
import { chessKeys } from "../src/engine/chess/boards";
import { chessGenStats, resetChessGenStats } from "../src/engine/chess/genStats";
import { planChessLesson } from "../src/engine/chess/planner";
import {
  CHESS_TASKS, MISSION_TASKS, REVIEW_TASKS, floorPuzzle, makeSpec, supports,
} from "../src/engine/chess/puzzles";
import { chessSessionParams, type ChessSessionParams } from "../src/engine/chess/sessionParams";
import { chessPayload, type ChessParams, type ChessTask, type PieceType } from "../src/engine/chess/types";
import { generateQuestionSet, questionKeys } from "../src/engine/generators";
import type { GenContext, Question } from "../src/engine/generators/types";
import { mulberry32 } from "../src/engine/rng";
import { CHESS } from "../src/strings/chess";
import { checkChessQuestion } from "./audit-chess-payload";

const SEEDS = [1, 3, 7, 37, 101, 509, 1009, 12345, 54321, 99991, 424242, 7777777];
const DIFFICULTIES = [0.1, 0.5, 0.9];
const MISS_RUN = 60;
const PIECES: PieceType[] = ["K", "Q", "R", "B", "N", "P"];
/** Tasks whose piece is worked out from the puzzle itself, not pinned. */
const DERIVED: ChessTask[] = ["count", "place"];

interface Stats {
  lessons: number;
  questions: number;
  replacements: number;
  tasks: Record<string, number>;
}

const taskOf = (q: Question) => chessPayload(q)?.task;
const pieceOf = (q: Question) => chessPayload(q)?.piece;

function checkKeys(q: Question, label: string, failures: string[]): void {
  if (JSON.stringify(chessKeys(q)) !== JSON.stringify(questionKeys(q))) failures.push(`${label}: chessKeys drifted from questionKeys`);
}

/** Lesson-shape rules: gentle opener, mission finish, rotation, task coverage, review share. */
function checkShape(set: Question[], params: ChessParams, label: string, failures: string[]): void {
  const tasks = set.map((q) => taskOf(q) as ChessTask);
  const own = [...new Set(params.tasks)];
  const stray = tasks.filter((task) => !own.includes(task));
  if (stray.length) failures.push(`${label}: tasks outside the lesson: ${stray.join(", ")}`);
  const gentlest = CHESS_TASKS.find((task) => own.includes(task));
  if (tasks[0] !== gentlest) failures.push(`${label}: opens with ${tasks[0]}, not ${gentlest}`);
  const missions = own.filter((task) => MISSION_TASKS.includes(task));
  const last = tasks[tasks.length - 1];
  if (missions.length && !MISSION_TASKS.includes(last)) failures.push(`${label}: last slot is ${last}, not a mission`);
  if (own.length > 1 && last === tasks[0]) failures.push(`${label}: opener and closer are both ${last}`);
  for (let i = 2; i < tasks.length; i++) {
    if (own.length > 1 && tasks[i] === tasks[i - 1] && tasks[i] === tasks[i - 2]) failures.push(`${label}: three ${tasks[i]} in a row at slot ${i + 1}`);
  }
  const least = Math.floor(set.length / own.length);
  for (const task of own) {
    const amount = tasks.filter((used) => used === task).length;
    if (amount < least || amount > least + 1) failures.push(`${label}: ${amount} ${task} puzzles (expected ${least}–${least + 1})`);
    if (own.length <= 4 && set.length >= 8 && amount < 2) failures.push(`${label}: ${task} appears only ${amount} time(s)`);
  }
}

/** Piece rules: lesson pieces everywhere, and earlier pieces in about a quarter of a champion lesson. */
function checkPieces(set: Question[], params: ChessParams, label: string, failures: string[]): void {
  const spec = makeSpec(params);
  const known = [...spec.pieces, ...spec.review];
  const revisits = set.filter((q) => REVIEW_TASKS.includes(taskOf(q) as ChessTask) && spec.review.includes(pieceOf(q) as PieceType));
  set.forEach((q, index) => {
    const task = taskOf(q) as ChessTask;
    const piece = pieceOf(q) as PieceType;
    if (!supports(task, piece)) failures.push(`${label} #${index + 1}: ${task} about a ${piece}`);
    if (["spot-moves", "spot-captures", "stars", "capture", "check", "mate"].includes(task) && !known.includes(piece)) {
      failures.push(`${label} #${index + 1}: ${task} uses a ${piece} the child has not met`);
    }
  });
  const canRevisit = set.some((q, index) => index > 0 && REVIEW_TASKS.includes(taskOf(q) as ChessTask)) &&
    REVIEW_TASKS.some((task) => params.tasks.includes(task) && spec.review.some((type) => supports(task, type)));
  if (set.length < 10 && revisits.length) failures.push(`${label}: a regular lesson revisits earlier pieces`);
  if (set.length >= 10 && canRevisit && (revisits.length < 1 || revisits.length > Math.round(set.length / 4))) {
    failures.push(`${label}: ${revisits.length}/${set.length} slots revisit earlier pieces`);
  }
  if (revisits.some((q) => q === set[0])) failures.push(`${label}: the opener revisits an earlier piece`);
}

function checkLesson(stage: StageDef, seed: number, ctx: GenContext, failures: string[], stats: Stats): Question[] {
  const params = chessParams(stage);
  const label = `${stage.id} seed ${seed} d${ctx.difficulty}${ctx.easier ? " easier" : ""}`;
  const set = generateQuestionSet(stage.generator, stage.params, stage.questions, seed, ctx);
  stats.lessons++;
  stats.questions += set.length;
  if (set.length !== stage.questions) failures.push(`${label}: ${set.length}/${stage.questions} questions`);
  const again = generateQuestionSet(stage.generator, stage.params, stage.questions, seed, ctx);
  if (JSON.stringify(set) !== JSON.stringify(again)) failures.push(`${label}: not deterministic from the seed`);
  const seen = new Set<string>();
  set.forEach((q, index) => {
    if (q.id !== `chess-${seed}-${index}`) failures.push(`${label}: id ${q.id}`);
    const p = checkChessQuestion(q, params, `${label} #${index + 1}`, failures);
    if (p) stats.tasks[p.task] = (stats.tasks[p.task] ?? 0) + 1;
    checkKeys(q, label, failures);
    if (q.dedupeKey?.includes("#")) failures.push(`${label}: a planned lesson needed a variant subject (${q.dedupeKey})`);
    if (questionKeys(q).some((key) => seen.has(key))) failures.push(`${label}: repeated question ${q.dedupeKey}`);
    questionKeys(q).forEach((key) => seen.add(key));
  });
  if (set.every((q) => taskOf(q))) {
    checkShape(set, params, label, failures);
    checkPieces(set, params, label, failures);
  }
  return set;
}

function replace(stage: StageDef, missed: Question, seed: number, ctx: GenContext, seen: Set<string>): Question | undefined {
  const pinned = chessSessionParams(missed, stage.params);
  return generateQuestionSet(stage.generator, pinned, 1, seed, ctx, seen)[0];
}

/** Rule 1: "new values, same skill" — same task (and piece) on a different board, nothing already shown. */
function checkReplacement(
  stage: StageDef, missed: Question, fresh: Question | undefined, seen: Set<string>, label: string, failures: string[],
): boolean {
  if (!fresh) {
    failures.push(`${label}: replacement came back empty`);
    return false;
  }
  if (!checkChessQuestion(fresh, chessParams(stage), label, failures)) return false;
  if (questionKeys(fresh).some((key) => seen.has(key))) failures.push(`${label}: replacement repeats a shown question`);
  if (fresh.dedupeKey?.includes("#")) failures.push(`${label}: replacement needed a variant subject (${fresh.dedupeKey})`);
  if (taskOf(fresh) !== taskOf(missed)) failures.push(`${label}: replacement switched ${taskOf(missed)} → ${taskOf(fresh)}`);
  const pinsPiece = !DERIVED.includes(taskOf(missed) as ChessTask);
  if (pinsPiece && pieceOf(fresh) !== pieceOf(missed)) failures.push(`${label}: replacement switched ${pieceOf(missed)} → ${pieceOf(fresh)}`);
  checkKeys(fresh, label, failures);
  return true;
}

/** Replace every question of a lesson once, as the miss flow would. */
function checkReplacements(stage: StageDef, set: Question[], seed: number, ctx: GenContext, failures: string[], stats: Stats): void {
  const seen = new Set(set.flatMap(questionKeys));
  set.forEach((missed, index) => {
    const label = `${stage.id} seed ${seed} d${ctx.difficulty}${ctx.easier ? " easier" : ""} replace #${index + 1}`;
    const fresh = replace(stage, missed, seed * 31 + index, ctx, seen);
    stats.replacements++;
    checkReplacement(stage, missed, fresh, seen, label, failures);
    const pinned = chessSessionParams(missed, stage.params) as unknown as ChessSessionParams;
    if (pinned.replace?.task !== taskOf(missed) || pinned.replace?.piece !== pieceOf(missed)) failures.push(`${label}: chessSessionParams did not pin the task`);
  });
  // An unpinned draw (the registry's single-question form) must be fresh too.
  const [loose] = generateQuestionSet(stage.generator, stage.params, 1, seed + 5, ctx, seen);
  if (!loose || questionKeys(loose).some((key) => seen.has(key))) failures.push(`${stage.id} seed ${seed}: unpinned replacement not fresh`);
}

/** A child who keeps missing: 60 replacements in a row never run dry, repeat, or leave the task. */
function checkMissRun(stage: StageDef, set: Question[], slot: number, seed: number, ctx: GenContext, failures: string[], stats: Stats): void {
  const seen = new Set(set.flatMap(questionKeys));
  let current = set[slot % set.length];
  for (let miss = 0; miss < MISS_RUN; miss++) {
    const label = `${stage.id} seed ${seed} d${ctx.difficulty} slot ${(slot % set.length) + 1} miss ${miss + 1}`;
    const next = replace(stage, current, seed * 977 + slot * 131 + miss, { ...ctx, easier: miss % 3 === 2 }, seen);
    stats.replacements++;
    if (!next || !checkReplacement(stage, current, next, seen, label, failures)) {
      failures.push(`${label}: replacement came back empty or malformed`);
      return;
    }
    questionKeys(next).forEach((key) => seen.add(key));
    current = next;
  }
}

/** The first slot of each task in the lesson. */
function missSlots(set: Question[]): number[] {
  const tasks = set.map(taskOf);
  return tasks.map((_, index) => index).filter((index) => tasks.indexOf(tasks[index]) === index);
}

function checkStrings(failures: string[]): void {
  const E = CHESS.engine;
  const made = [
    E.spotMoves("knight"), E.spotCaptures("bishop"), E.stars(1, 1), E.stars(3, 4), E.captureOne("knight", 1), E.captureOne("bishop", 3),
    E.captureAll(3), E.promote(4), E.placeOne("queen"), E.placeTwo("knight"), E.hintCount(["rook 5", "knight 3"]),
  ];
  const samples = [...made, ...Object.values(E).flatMap((entry) => {
    if (typeof entry === "string") return [entry];
    return typeof entry === "function" ? [] : Object.values(entry);
  })];
  if (samples.some((text) => /wrong|fail/i.test(text))) failures.push("CHESS.engine: forbidden word");
  const long = samples.filter((text) => text.trim().split(/\s+/).length > 8);
  if (long.length) failures.push(`CHESS.engine: more than 8 words: ${long.join(" | ")}`);
  if (CHESS.engine.hintCount(["rook 5", "knight 3", "pawn 1"]) !== "Rook 5, knight 3, pawn 1.") failures.push("CHESS.engine.hintCount wording");
  if (CHESS.engine.stars(1, 1) !== "Collect the star in 1 move" || CHESS.engine.stars(2, 2) !== "Collect the stars in 2 moves") failures.push("CHESS.engine.stars wording");
}

/** The hand-built last-resort puzzle of every task must itself pass every check. */
function checkFloors(failures: string[]): void {
  const rng = mulberry32(2024);
  for (const task of CHESS_TASKS) {
    for (const piece of PIECES.filter((type) => supports(task, type))) {
      for (const size of [4, 5, 6]) {
        const params: ChessParams = { pieces: [piece], review: PIECES, tasks: [task, "count"], size };
        for (let round = 0; round < 6; round++) {
          const q = floorPuzzle(task, piece, makeSpec(params), rng, { difficulty: round / 5, easier: round % 2 === 0 });
          checkChessQuestion(q, params, `floor ${task}/${piece} size ${size}`, failures);
        }
      }
    }
  }
}

/** Hand-made odd lessons: the planner must still return exactly `count` distinct, valid puzzles. */
function checkOddLessons(failures: string[]): void {
  const odd: [string, ChessParams, number][] = [
    ["one task", { pieces: ["N"], review: [], tasks: ["spot-moves"], size: 5 }, 10],
    ["only place", { pieces: ["Q", "R"], review: [], tasks: ["place"], size: 5 }, 12],
    ["only count", { pieces: ["Q", "R"], review: [], tasks: ["count"], size: 5 }, 12],
    ["tiny board", { pieces: ["Q", "R", "B", "N", "K", "P"], review: [], tasks: [...CHESS_TASKS], size: 4 }, 24],
    ["big board", { pieces: ["Q", "R", "B", "N", "K", "P"], review: [], tasks: [...CHESS_TASKS], size: 6 }, 24],
    ["short", { pieces: ["B"], review: ["R"], tasks: ["spot-moves", "stars", "capture"], size: 5 }, 3],
    ["stars for pawns", { pieces: ["P"], review: [], tasks: ["stars", "mate", "check"], size: 6 }, 9],
    ["nothing given", { pieces: [], review: [], tasks: [], size: 9 }, 8],
  ];
  for (const [name, params, count] of odd) {
    for (const seed of SEEDS) {
      for (const easier of [false, true]) {
        const label = `odd lesson "${name}" seed ${seed}${easier ? " easier" : ""}`;
        const set = planChessLesson(params, count, seed, { difficulty: 0.5, easier });
        if (set.length !== count) failures.push(`${label}: ${set.length}/${count} questions`);
        const keys = set.flatMap(questionKeys);
        if (new Set(keys).size !== keys.length) failures.push(`${label}: repeated question`);
        const spec = makeSpec(params);
        const lenient: ChessParams = { ...params, pieces: PIECES, tasks: spec.tasks, size: spec.size };
        set.forEach((q, index) => checkChessQuestion(q, lenient, `${label} #${index + 1}`, failures));
      }
    }
  }
}

function runAudit(): { failures: string[]; stats: Stats } {
  const failures: string[] = [];
  const stats: Stats = { lessons: 0, questions: 0, replacements: 0, tasks: {} };
  checkStrings(failures);
  checkFloors(failures);
  checkOddLessons(failures);
  resetChessGenStats();
  for (const stage of CHESS_UNITS.flatMap((unit) => unit.lessons)) {
    for (const seed of SEEDS) {
      for (const difficulty of DIFFICULTIES) {
        for (const easier of [false, true]) {
          const ctx = { difficulty, easier };
          try {
            const set = checkLesson(stage, seed, ctx, failures, stats);
            checkReplacements(stage, set, seed, ctx, failures, stats);
            // Every task of the lesson gets its own long run of misses.
            if (!easier && seed < 10) missSlots(set).forEach((slot) => checkMissRun(stage, set, slot, seed, ctx, failures, stats));
          } catch (error) {
            failures.push(`${stage.id} seed ${seed} d${difficulty}: ${String(error)}`);
          }
        }
      }
    }
  }
  return { failures, stats };
}

/** Failure messages (empty = pass). Hooked into scripts/audit-questions.ts. */
export function auditChess(): string[] {
  return runAudit().failures;
}

/** One line per task: how many were planned, and how hard the generator had to work. */
function generatorReport(stats: Stats): string {
  const lines = CHESS_TASKS.map((task) => {
    const gen = chessGenStats().get(task) ?? { built: 0, tries: 0, gentle: 0, floor: 0 };
    const share = (amount: number) => `${((100 * amount) / Math.max(1, gen.built)).toFixed(2)}%`;
    return `  ${task.padEnd(15)} in lessons ${String(stats.tasks[task] ?? 0).padStart(5)} · built ${String(gen.built).padStart(6)}` +
      ` · avg boards sampled ${(gen.tries / Math.max(1, gen.built)).toFixed(1).padStart(5)}` +
      ` · gentle fallback ${share(gen.gentle).padStart(6)} · floor ${share(gen.floor).padStart(6)}`;
  });
  return `Per task:\n${lines.join("\n")}`;
}

if (import.meta.main) {
  const started = performance.now();
  const { failures, stats } = runAudit();
  console.log(generatorReport(stats));
  if (failures.length) {
    console.error(failures.slice(0, 60).join("\n"));
    console.error(`${failures.length} Chess Camp audit failures`);
    process.exitCode = 1;
  } else {
    const seconds = ((performance.now() - started) / 1000).toFixed(1);
    console.log(`Chess Camp audit passed: ${stats.lessons} lessons, ${stats.questions} questions, ${stats.replacements} replacements (${seconds}s)`);
  }
}
