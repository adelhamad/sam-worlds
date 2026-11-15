// Plans a whole Code Lab lesson: every slot gets a source (a gentle opener, an
// even rotation, a run-style puzzle to finish on) and a difficulty on a gentle
// ramp, and no puzzle or card question appears twice.
import type { GenContext, Question } from "../generators/types";
import { pick, shuffle, type RNG } from "../rng";
import { asVariant, clamp, codeKeys, isFresh } from "./grids";
import { kitQuestion } from "./kitSlots";
import { buildPuzzle, gentleness, isRunStyle, lessonSources, type LessonSpec, type Source } from "./puzzles";
import type { CodeTask } from "./types";

/** Builds tried at the slot's difficulty, then at any difficulty, before a numbered variant. */
const TRIES = 10;
const ANY_LEVEL = 20;

/** Opener = the gentlest source; closer = the lesson's last run-style source (it differs from the opener). */
export function bookends(sources: Source[]): [Source, Source] {
  const byEase = [...sources].sort((a, b) => gentleness(a) - gentleness(b));
  const runStyle = sources.filter(isRunStyle);
  const closer = runStyle.filter((source) => source !== byEase[0]).at(-1) ?? runStyle.at(-1) ?? byEase[byEase.length - 1];
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
  for (let attempt = 0; attempt < 40; attempt++) {
    const sequence = [opener, ...shuffle(rng, middle), closer];
    if (noTriples(sequence) || order.length === 1) return sequence;
  }
  return spread(middle, opener, closer);
}

/** Lessons warm up and then stretch: −0.15 at the start, +0.15 at the end. */
export function slotDifficulty(difficulty: number, index: number, count: number): number {
  return clamp(difficulty + 0.3 * (index / Math.max(1, count - 1) - 0.5), 0, 1);
}

interface Fill {
  spec: LessonSpec;
  rng: RNG;
  seen: Set<string>;
}

/** A fresh puzzle of `task`: at the slot's difficulty, then at any, then a numbered variant. */
export function freshPuzzle(fill: Fill, task: CodeTask, ctx: GenContext, tries = TRIES, anyLevel = ANY_LEVEL): Question {
  const { spec, rng, seen } = fill;
  let question = buildPuzzle(task, spec, rng, ctx);
  for (let i = 0; i < tries + anyLevel && !isFresh(question, seen); i++) {
    const level = i < tries ? ctx : { difficulty: rng(), easier: i % 2 === 0 };
    question = buildPuzzle(task, spec, rng, level);
  }
  return isFresh(question, seen) ? question : asVariant(question, seen);
}

export function fillSource(fill: Fill, source: Source, ctx: GenContext): Question {
  return source.kind === "kit"
    ? kitQuestion(source.template, fill.rng, ctx, fill.seen, TRIES)
    : freshPuzzle(fill, source.task, ctx);
}

/**
 * `count` questions (always exactly `count`), balanced across the lesson's
 * sources. Like the other course planners it ignores the session's seen keys:
 * code questions are repeatable, and a replay must plan the same lesson.
 */
export function planLesson(spec: LessonSpec, count: number, rng: RNG, ctx: GenContext): Question[] {
  const sequence = planSources(lessonSources(spec), count, rng);
  const fill: Fill = { spec, rng, seen: new Set() };
  return sequence.map((source, index) => {
    const question = fillSource(fill, source, { ...ctx, difficulty: slotDifficulty(ctx.difficulty, index, count) });
    codeKeys(question).forEach((key) => fill.seen.add(key));
    return question;
  });
}
