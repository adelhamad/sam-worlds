// Answer-integrity rule 1 for World Tour: a missed question is thrown away and
// replaced by a fresh one — the same skill (exercise kind) on a DIFFERENT
// country, never a question the session has already shown.
import type { GenContext, Question } from "../generators/types";
import { shuffle, type RNG } from "../rng";
import { buildExercise, eligibleFor } from "./exercises";
import { asVariant, isFresh, isSingle, subjectKey, subjectOf, type BuildEnv, type LessonPool } from "./pool";
import type { TourReplace } from "./sessionParams";
import type { TourKind, TourPayload } from "./types";

/** Boards have many card sets per country; this many main countries is plenty. */
const BOARD_TRIES = 12;

interface Search {
  pool: LessonPool;
  rng: RNG;
  ctx: GenContext;
  seen: ReadonlySet<string>;
  /** Main-country candidates, best first. */
  codes: string[];
  /** The missed question's countries, as a sorted key — never rebuild exactly that. */
  missed: string;
}

const groupKey = (codes: string[]) => [...codes].sort().join("+");

function repeatsMissed(q: Question, search: Search): boolean {
  return groupKey((q.payload as unknown as TourPayload).codes) === search.missed;
}

function envFor(search: Search, wide: boolean): BuildEnv {
  return {
    pool: search.pool,
    rng: search.rng,
    ctx: search.ctx,
    wide,
    isTaken: wide ? undefined : (dedupeKey) => search.seen.has(subjectKey(dedupeKey)),
  };
}

function tryCodes(kind: TourKind, search: Search): string[] {
  const able = search.codes.filter((code) => eligibleFor(kind, code));
  return isSingle(kind) ? able : able.slice(0, BOARD_TRIES);
}

/** A subject the session has not met yet. */
function freshSubject(kind: TourKind, search: Search): Question | null {
  for (const code of tryCodes(kind, search)) {
    if (isSingle(kind) && search.seen.has(subjectKey(subjectOf(kind, [code])))) continue;
    const question = buildExercise(kind, code, envFor(search, false));
    if (question && isFresh(question, search.seen) && !repeatsMissed(question, search)) return question;
  }
  return null;
}

/**
 * Every subject of this kind is used: the same kind again, under a numbered
 * subject. Lesson countries only at first; anchors join in when that runs dry.
 */
function variantSubject(kind: TourKind, search: Search): Question | null {
  for (const wide of [false, true]) {
    for (const code of tryCodes(kind, search)) {
      const question = buildExercise(kind, code, { ...envFor(search, wide), isTaken: undefined });
      const variant = question && !repeatsMissed(question, search) ? asVariant(question, search.seen) : null;
      if (variant) return variant;
    }
  }
  return null;
}

function firstOf(kinds: TourKind[], search: Search): Question | null {
  for (const kind of kinds) {
    const question = freshSubject(kind, search);
    if (question) return question;
  }
  for (const kind of kinds) {
    const question = variantSubject(kind, search);
    if (question) return question;
  }
  return null;
}

/** Nothing else worked (a tiny pool, a very long session): keep drawing until something new appears. */
function lastResort(kinds: TourKind[], search: Search): Question {
  let last: Question | null = null;
  for (let attempt = 0; attempt < 240; attempt++) {
    const kind = kinds[Math.floor(attempt / 12) % kinds.length];
    const code = search.pool.all[Math.floor(search.rng() * search.pool.all.length)];
    const built = buildExercise(kind, code, envFor(search, true));
    const variant = built ? asVariant(built, search.seen) : null;
    if (variant) return variant;
    last = built ?? last;
  }
  if (!last) throw new Error("World Tour: no exercise can be built from this lesson's countries");
  return { ...last, dedupeKey: `${last.dedupeKey}#${search.seen.size + 2}` };
}

/**
 * One question whose keys are not in `seen`. With `replace` (set after a miss)
 * it keeps the missed question's kind and moves to a different country; when
 * that kind has no other country it switches kind rather than re-ask the same one.
 */
export function planReplacement(
  pool: LessonPool, kinds: TourKind[], rng: RNG, ctx: GenContext, seen: ReadonlySet<string>, replace?: TourReplace,
): Question {
  const avoid = new Set(replace?.avoid ?? []);
  // Mostly the lesson's own countries; sometimes an earlier one first.
  const groups = rng() < 0.75 ? [pool.focus, pool.review] : [pool.review, pool.focus];
  const ordered = groups.flatMap((group) => shuffle(rng, group));
  const search: Search = {
    pool, rng, ctx, seen,
    codes: [...ordered.filter((code) => !avoid.has(code)), ...ordered.filter((code) => avoid.has(code))],
    missed: groupKey([...avoid]),
  };
  const others = shuffle(rng, kinds.filter((kind) => kind !== replace?.kind));
  const pinned = replace ? firstOf([replace.kind], search) : null;
  return pinned ?? firstOf(others, search) ?? lastResort(replace ? [replace.kind, ...others] : others, search);
}
