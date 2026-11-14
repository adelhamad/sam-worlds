// Plans a whole Chess Camp lesson: every slot gets a task (a gentle opener, an
// even rotation, a mission to finish on), a piece and a difficulty, and no
// board appears twice.
import type { GenContext, Question } from "../generators/types";
import { pick, shuffle, type RNG } from "../rng";
import { asVariant, chessKeys, clamp, isFresh } from "./boards";
import { CHESS_TASKS, MISSION_TASKS, buildPuzzle, heroesFor, reviewHeroes, type LessonSpec } from "./puzzles";
import type { ChessTask, PieceType } from "./types";

/** Lessons this long are champion lessons: they revisit earlier pieces. */
const CHAMPION_LENGTH = 10;
/** Share of a champion lesson's slots that use a piece from an earlier unit. */
const REVIEW_SHARE = 0.25;
/** Builds tried for one piece before moving on. */
const TRIES = 10;

const gentleness = (task: ChessTask) => CHESS_TASKS.indexOf(task);

/** The gentlest task opens the lesson; its first mission (or else its hardest task) closes it. */
function bookends(tasks: ChessTask[]): [ChessTask, ChessTask] {
  const byEase = [...tasks].sort((a, b) => gentleness(a) - gentleness(b));
  const opener = byEase[0];
  const closer = tasks.find((task) => task !== opener && MISSION_TASKS.includes(task)) ?? byEase[byEase.length - 1];
  return [opener, closer];
}

function noTriples(sequence: ChessTask[]): boolean {
  return !sequence.some((task, i) => i >= 2 && task === sequence[i - 1] && task === sequence[i - 2]);
}

/** Fallback arrangement: always the most plentiful task that does not make three in a row. */
function spread(middle: ChessTask[], opener: ChessTask, closer: ChessTask): ChessTask[] {
  const left = [...middle];
  const out: ChessTask[] = [opener];
  while (left.length) {
    const amount = (task: ChessTask) => left.filter((other) => other === task).length;
    const fits = (task: ChessTask) => noTriples([...out, task, ...(left.length === 1 ? [closer] : [])]);
    const choice = [...left].sort((a, b) => Number(fits(b)) - Number(fits(a)) || amount(b) - amount(a))[0];
    out.push(choice);
    left.splice(left.indexOf(choice), 1);
  }
  return [...out, closer];
}

/** The task of every slot: an even rotation through the lesson's tasks. */
export function planTasks(tasks: ChessTask[], count: number, rng: RNG): ChessTask[] {
  if (count <= 1) return [pick(rng, tasks)];
  const [opener, closer] = bookends(tasks);
  // The bookends are dealt first, so a short lesson still has both.
  const order = [...new Set([opener, closer, ...tasks])];
  const middle = Array.from({ length: count - 2 }, (_, i) => order[(i + 2) % order.length]);
  for (let attempt = 0; attempt < 40; attempt++) {
    const sequence = [opener, ...shuffle(rng, middle), closer];
    if (noTriples(sequence)) return sequence;
  }
  return spread(middle, opener, closer);
}

/** Slots that revisit an earlier piece: about a quarter of a champion lesson, never the opener. */
function reviewSlots(spec: LessonSpec, sequence: ChessTask[], rng: RNG): Set<number> {
  if (sequence.length < CHAMPION_LENGTH) return new Set();
  const able = sequence.map((_, index) => index).filter((index) => index > 0 && reviewHeroes(sequence[index], spec).length > 0);
  return new Set(shuffle(rng, able).slice(0, Math.round(sequence.length * REVIEW_SHARE)));
}

/** Deals each task's pieces in turn, so a lesson with several pieces practises them evenly. */
class Rota {
  private readonly queues = new Map<ChessTask, PieceType[]>();

  constructor(private readonly spec: LessonSpec, private readonly rng: RNG) {}

  next(task: ChessTask): PieceType {
    let queue = this.queues.get(task) ?? [];
    if (!queue.length) queue = shuffle(this.rng, heroesFor(task, this.spec));
    this.queues.set(task, queue.slice(1));
    return queue[0];
  }
}

interface Slot {
  task: ChessTask;
  /** Pieces to try, best first. */
  pieces: PieceType[];
  ctx: GenContext;
}

/** Lessons warm up and then stretch: early slots a little easier, late ones a little harder. */
function slotDifficulty(difficulty: number, index: number, count: number): number {
  return clamp(difficulty + 0.3 * (index / Math.max(1, count - 1) - 0.5), 0, 1);
}

interface Fill {
  spec: LessonSpec;
  rng: RNG;
  seen: Set<string>;
}

function freshPuzzle(fill: Fill, task: ChessTask, pieces: PieceType[], ctx: GenContext, tries: number): Question | null {
  for (const piece of pieces) {
    for (let i = 0; i < tries; i++) {
      const question = buildPuzzle(task, piece, fill.spec, fill.rng, ctx);
      if (isFresh(question, fill.seen)) return question;
    }
  }
  return null;
}

/** The slot's own task and piece when possible; a lesson is never a question short. */
function fillSlot(fill: Fill, slot: Slot): Question {
  const { spec, rng } = fill;
  const own = freshPuzzle(fill, slot.task, slot.pieces, slot.ctx, TRIES);
  if (own) return own;
  // This difficulty has no board left: look across all of them.
  const anyLevel = { difficulty: rng(), easier: false };
  const wider = freshPuzzle(fill, slot.task, heroesFor(slot.task, spec), anyLevel, TRIES * 2);
  if (wider) return wider;
  for (const task of shuffle(rng, spec.tasks.filter((other) => other !== slot.task))) {
    const other = freshPuzzle(fill, task, heroesFor(task, spec), slot.ctx, TRIES);
    if (other) return other;
  }
  return asVariant(buildPuzzle(slot.task, slot.pieces[0], spec, rng, anyLevel), fill.seen);
}

/** `count` puzzles (always exactly `count`), balanced across the lesson's tasks and pieces. */
export function planLesson(spec: LessonSpec, count: number, rng: RNG, ctx: GenContext): Question[] {
  const sequence = planTasks(spec.tasks, count, rng);
  const review = reviewSlots(spec, sequence, rng);
  const rota = new Rota(spec, rng);
  const fill: Fill = { spec, rng, seen: new Set() };
  return sequence.map((task, index) => {
    const own = rota.next(task);
    const pieces = review.has(index) ? [pick(rng, reviewHeroes(task, spec)), own] : [own];
    const question = fillSlot(fill, { task, pieces, ctx: { ...ctx, difficulty: slotDifficulty(ctx.difficulty, index, count) } });
    chessKeys(question).forEach((key) => fill.seen.add(key));
    return question;
  });
}
