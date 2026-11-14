// Plans a whole World Tour lesson: every slot gets a kind (kindPlan) and then a
// country, so the lesson's focus countries are practised evenly, a share of
// slots revisits earlier countries, and no question appears twice.
import type { GenContext, Question } from "../generators/types";
import { pick, shuffle, type RNG } from "../rng";
import { buildExercise, eligibleFor, kindCapacity } from "./exercises";
import { planKinds } from "./kindPlan";
import { asVariant, clamp, isFresh, isSingle, subjectKey, subjectOf, tourKeys, type BuildEnv, type LessonPool } from "./pool";
import type { TourKind, TourPayload } from "./types";

/** "Meet" lessons introduce at most this many countries. */
const MEET_SIZE = 4;
/** In a full-length meet lesson every new country is practised at least this often. */
const MEET_REPS = 3;
const FULL_LENGTH = 10;
/** Share of slots that revisit earlier countries in the big mixed lessons. */
const REVIEW_SHARE = 0.25;
const ATTEMPTS = 6;

interface LessonState {
  pool: LessonPool;
  kinds: TourKind[];
  rng: RNG;
  /** Identity keys of the questions planned so far. */
  seen: Set<string>;
  /** How many planned questions credit each country. */
  credits: Map<string, number>;
}

interface Slot {
  kind: TourKind;
  /** Draw the main country from review instead of focus. */
  review: boolean;
  basic: boolean;
  ctx: GenContext;
  /** Kinds of the neighbouring slots — a fallback kind should differ from them. */
  beside: TourKind[];
}

const codesOf = (q: Question) => (q.payload as unknown as TourPayload).codes;
const kindOf = (q: Question) => (q.payload as unknown as TourPayload).tour;
const isMeet = (pool: LessonPool) => pool.focus.length <= MEET_SIZE;

/** Shuffled, then least-practised first. */
function byNeed(state: LessonState, codes: string[]): string[] {
  const credit = (code: string) => state.credits.get(code) ?? 0;
  return shuffle(state.rng, codes).sort((a, b) => credit(a) - credit(b));
}

function candidates(state: LessonState, kind: TourKind, review: boolean): string[] {
  const focus = byNeed(state, state.pool.focus);
  const earlier = shuffle(state.rng, state.pool.review);
  const ordered = review ? [...earlier, ...focus] : [...focus, ...earlier];
  return ordered.filter((code) => eligibleFor(kind, code) &&
    !(isSingle(kind) && state.seen.has(subjectKey(subjectOf(kind, [code])))));
}

/** Who shares a pairs / sort board with `code`: countries needing practice first. */
function partners(state: LessonState, code: string): string[] {
  const focus = byNeed(state, state.pool.focus.filter((other) => other !== code));
  const earlier = shuffle(state.rng, state.pool.review.filter((other) => other !== code));
  if (isMeet(state.pool) || !earlier.length) return [...focus, ...earlier];
  // Big mixed lessons weave one earlier country into the board.
  return [...focus.slice(0, 2), earlier[0], ...focus.slice(2), ...earlier.slice(1)];
}

function envFor(state: LessonState, slot: Slot, code: string): BuildEnv {
  return {
    pool: state.pool,
    rng: state.rng,
    ctx: slot.ctx,
    basic: slot.basic,
    partners: partners(state, code),
    isTaken: (dedupeKey) => state.seen.has(subjectKey(dedupeKey)),
  };
}

function tryKind(state: LessonState, kind: TourKind, slot: Slot): Question | null {
  const codes = candidates(state, kind, slot.review);
  // A board has many card sets per country; a handful of main countries is plenty.
  for (const code of isSingle(kind) ? codes : codes.slice(0, 6)) {
    const question = buildExercise(kind, code, envFor(state, slot, code));
    if (question && isFresh(question, state.seen)) return question;
  }
  return null;
}

/** Every plain subject is used up: repeat a country under a numbered subject. */
function variantSlot(state: LessonState, slot: Slot): Question {
  const kinds = [slot.kind, ...state.kinds.filter((kind) => kind !== slot.kind)];
  let last: Question | null = null;
  for (let attempt = 0; attempt < 80; attempt++) {
    const kind = kinds[Math.floor(attempt / 8) % kinds.length];
    const code = pick(state.rng, state.pool.all);
    // Lesson countries only at first; anchors join in when that runs dry.
    const env = { pool: state.pool, rng: state.rng, ctx: slot.ctx, basic: slot.basic, wide: attempt % 8 >= 4 };
    const built = buildExercise(kind, code, env);
    const variant = built ? asVariant(built, state.seen) : null;
    if (variant) return variant;
    last = built ?? last;
  }
  if (!last) throw new Error("World Tour: no exercise can be built from this lesson's countries");
  return { ...last, dedupeKey: `${last.dedupeKey}#${state.seen.size + 2}` };
}

function fillSlot(state: LessonState, slot: Slot): Question {
  const spare = state.kinds.filter((kind) => kind !== slot.kind);
  const order = [
    slot.kind,
    ...spare.filter((kind) => !slot.beside.includes(kind)),
    ...spare.filter((kind) => slot.beside.includes(kind)),
  ];
  for (const kind of order) {
    const question = tryKind(state, kind, slot);
    if (question) return question;
  }
  return variantSlot(state, slot);
}

function reviewSlots(pool: LessonPool, count: number, rng: RNG): Set<number> {
  if (!pool.review.length || count < 4) return new Set();
  const amount = isMeet(pool) ? 1 : Math.round(count * REVIEW_SHARE);
  // Never the two openers: those greet the lesson's own countries.
  const open = Array.from({ length: count - 2 }, (_, i) => i + 2);
  return new Set(shuffle(rng, open).slice(0, amount));
}

/** Lessons warm up and then stretch: early slots a little easier, late ones a little harder. */
function slotDifficulty(difficulty: number, index: number, count: number): number {
  return clamp(difficulty + 0.3 * (index / Math.max(1, count - 1) - 0.5), 0, 1);
}

function attemptLesson(
  pool: LessonPool, kinds: TourKind[], count: number, rng: RNG, ctx: GenContext, withReview: boolean,
): Question[] {
  const state: LessonState = { pool, kinds, rng, seen: new Set(), credits: new Map() };
  const sequence = planKinds(kinds, count, rng, (kind) => kindCapacity(kind, pool));
  const review = withReview ? reviewSlots(pool, count, rng) : new Set<number>();
  const out: Question[] = [];
  for (let index = 0; index < count; index++) {
    const beside: TourKind[] = [];
    // Slot 2 may repeat slot 1 (the two openers); after that neighbours differ.
    if (index >= 2) beside.push(kindOf(out[index - 1]));
    if (index + 1 < count && index >= 1) beside.push(sequence[index + 1]);
    const question = fillSlot(state, {
      kind: sequence[index],
      review: review.has(index),
      basic: index < 2,
      ctx: { ...ctx, difficulty: slotDifficulty(ctx.difficulty, index, count) },
      beside,
    });
    out.push(question);
    tourKeys(question).forEach((key) => state.seen.add(key));
    codesOf(question).forEach((code) => state.credits.set(code, (state.credits.get(code) ?? 0) + 1));
  }
  return out;
}

/** Does a meet lesson practise each of its new countries often enough? */
function coversFocus(questions: Question[], pool: LessonPool, count: number): boolean {
  if (!isMeet(pool) || count < FULL_LENGTH) return true;
  return pool.focus.every((code) => questions.filter((q) => codesOf(q).includes(code)).length >= MEET_REPS);
}

/** `count` questions (always exactly `count`), balanced across kinds and countries. */
export function planLesson(pool: LessonPool, kinds: TourKind[], count: number, rng: RNG, ctx: GenContext): Question[] {
  let lesson: Question[] = [];
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    // Later attempts give every slot to the focus countries.
    lesson = attemptLesson(pool, kinds, count, rng, ctx, attempt < ATTEMPTS - 2);
    if (coversFocus(lesson, pool, count)) break;
  }
  return lesson;
}
