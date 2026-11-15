// Plans a whole Tick Tock lesson: every slot gets a source (a gentle opener,
// an even rotation, a hands-on finish), a difficulty on a gentle ramp, and
// times spread over the dial; no question, and no answer of a task, appears twice.
import type { GenContext, Question } from "../generators/types";
import { pick, shuffle, type RNG } from "../rng";
import { kitKeys, isFresh } from "../kit/sample";
import { kitQuestion, numbered } from "./kitSlots";
import type { Built } from "./puzzle";
import { buildPuzzle, closerRank, gentleness, lessonSources, type LessonSpec, type Source } from "./sources";
import { markShown, newBook, type TimeBook } from "./times";
import type { TickTask } from "./types";

/** Builds tried at the slot's difficulty, then at any difficulty, before a numbered variant. */
const TRIES = 12;
const ANY_LEVEL = 24;
const KIT_TRIES = 10;
const ARRANGE_TRIES = 40;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Closer = the hands-on finish (later-set, set, read); opener = the gentlest other source. */
export function bookends(sources: Source[]): [Source, Source] {
  const byEase = [...sources].sort((a, b) => gentleness(a) - gentleness(b));
  const finishers = sources.filter((source) => closerRank(source) >= 0).sort((a, b) => closerRank(b) - closerRank(a));
  const closer = finishers[0] ?? byEase[byEase.length - 1];
  const opener = byEase.find((source) => source !== closer) ?? closer;
  return [opener, closer];
}

function noTriples(sequence: Source[]): boolean {
  return !sequence.some((source, i) => i >= 2 && source === sequence[i - 1] && source === sequence[i - 2]);
}

/** Fallback arrangement: always the most plentiful source that does not make three in a row. */
function spread(middle: Source[], opener: Source, closer: Source): Source[] {
  const left = [...middle];
  const out: Source[] = [opener];
  while (left.length) {
    const amount = (source: Source) => left.filter((other) => other === source).length;
    const fits = (source: Source) => noTriples([...out, source, ...(left.length === 1 ? [closer] : [])]);
    const choice = [...left].sort((a, b) => Number(fits(b)) - Number(fits(a)) || amount(b) - amount(a))[0];
    out.push(choice);
    left.splice(left.indexOf(choice), 1);
  }
  return [...out, closer];
}

/** The source of every slot: an even rotation through the lesson's sources. */
export function planSources(sources: Source[], count: number, rng: RNG): Source[] {
  if (count <= 1) return [pick(rng, sources)];
  const [opener, closer] = bookends(sources);
  // The bookends are dealt first, so a short lesson still has both.
  const order = [...new Set([opener, closer, ...sources])];
  const middle = Array.from({ length: count - 2 }, (_, i) => order[(i + 2) % order.length]);
  for (let attempt = 0; attempt < ARRANGE_TRIES; attempt++) {
    const sequence = [opener, ...shuffle(rng, middle), closer];
    if (noTriples(sequence) || order.length === 1) return sequence;
  }
  return spread(middle, opener, closer);
}

/** Lessons warm up and then stretch: −0.15 at the start, +0.15 at the end. */
export function slotDifficulty(difficulty: number, index: number, count: number): number {
  return clamp(difficulty + 0.3 * (index / Math.max(1, count - 1) - 0.5));
}

/** What a lesson (or a replacement) has used so far. */
export interface Fill {
  spec: LessonSpec;
  rng: RNG;
  seen: Set<string>;
  book: TimeBook;
  /** Answer times (or board fingerprints) each task has used. */
  taken: Map<TickTask, Set<string>>;
}

export function newFill(spec: LessonSpec, rng: RNG, seen: Iterable<string> = []): Fill {
  return { spec, rng, seen: new Set(seen), book: newBook(), taken: new Map() };
}

/**
 * A fresh build of `task`: at the slot's difficulty, then at any; a new answer
 * for the task (and not `avoidAnswer`) when one exists; a numbered variant
 * only when the session has truly seen every puzzle of the task.
 */
export function freshPuzzle(
  fill: Fill, task: TickTask, ctx: GenContext, tries = TRIES, anyLevel = ANY_LEVEL, avoidAnswer?: string,
): Built {
  const { rng, seen } = fill;
  const taken = new Set([...(fill.taken.get(task) ?? []), ...(avoidAnswer ? [avoidAnswer] : [])]);
  let fallback: Built | null = null;
  let last: Built | null = null;
  for (let i = 0; i < tries + anyLevel; i++) {
    const level = i < tries ? ctx : { difficulty: rng(), easier: i % 2 === 0 };
    const built = buildPuzzle(task, { rng, difficulty: clamp(level.difficulty), easier: level.easier, spec: fill.spec.time, book: fill.book, taken });
    last = built;
    if (!isFresh(built.question, seen)) continue;
    if (!taken.has(built.primary) && built.question.answer !== avoidAnswer) return built;
    fallback ??= built;
  }
  const out = fallback ?? (last as Built);
  return fallback ? out : { ...out, question: numbered(out.question, seen) };
}

function fillSource(fill: Fill, source: Source, ctx: GenContext): Built {
  if (source.kind === "task") return freshPuzzle(fill, source.task, ctx);
  const question = kitQuestion(source.template, fill.rng, ctx, fill.seen, KIT_TRIES);
  return { question, times: [], primary: question.dedupeKey ?? "" };
}

/** Remember a placed question: its keys, its times, its answer for its task. */
export function record(fill: Fill, source: Source, built: Built): void {
  kitKeys(built.question).forEach((key) => fill.seen.add(key));
  markShown(fill.book, built.times);
  if (source.kind !== "task") return;
  const taken = fill.taken.get(source.task) ?? new Set<string>();
  taken.add(built.primary);
  fill.taken.set(source.task, taken);
}

/**
 * `count` questions (always exactly `count`), balanced across the lesson's
 * sources. Like the other course planners it ignores the session's seen keys:
 * tick questions are repeatable, and a replay must plan the same lesson.
 */
export function planLesson(spec: LessonSpec, count: number, rng: RNG, ctx: GenContext): Question[] {
  const sequence = planSources(lessonSources(spec), count, rng);
  const fill = newFill(spec, rng);
  return sequence.map((source, index) => {
    const built = fillSource(fill, source, { ...ctx, difficulty: slotDifficulty(ctx.difficulty, index, count) });
    record(fill, source, built);
    return built.question;
  });
}
