// Shared pieces of the World Tour planner: the lesson's country pool, the
// question factory and the question-identity keys.
import { COUNTRY_BY_CODE, type Country } from "../generators/geography";
import type { GenContext, Question } from "../generators/types";
import type { RNG } from "../rng";
import type { TourKind, TourParams, TourPayload } from "./types";

export const TOUR_KINDS: TourKind[] = ["pick", "pairs", "build", "map", "sort", "paint"];

/**
 * Well-known countries the planner may borrow when a lesson's own pool is too
 * small: a second continent to sort into, a decoy name, a fresh distractor.
 */
export const TOUR_ANCHORS: string[] = [
  "JPN", "BRA", "EGY", "FRA", "AUS", "USA", "CHN", "MEX", "NGA", "IND", "GBR", "ARG", "CAN", "KEN", "ITA", "NZL",
].filter((code) => COUNTRY_BY_CODE.has(code));

export interface LessonPool {
  focus: string[];
  /** Review countries that are not also in focus. */
  review: string[];
  /** focus followed by review. */
  all: string[];
}

function knownCodes(codes: unknown): string[] {
  const list = Array.isArray(codes) ? codes.filter((code): code is string => typeof code === "string") : [];
  return [...new Set(list)].filter((code) => COUNTRY_BY_CODE.has(code));
}

export function makePool(params: TourParams): LessonPool {
  const given = knownCodes(params.focus);
  const focus = given.length ? given : TOUR_ANCHORS.slice(0, 4);
  const review = knownCodes(params.review).filter((code) => !focus.includes(code));
  return { focus, review, all: [...focus, ...review] };
}

/** Everything one exercise builder needs. */
export interface BuildEnv {
  pool: LessonPool;
  rng: RNG;
  ctx: GenContext;
  /** Multi-country exercises skip card sets whose dedupeKey this rejects. */
  isTaken?: (dedupeKey: string) => boolean;
  /** Preferred partner countries for pairs / sort, best first. */
  partners?: string[];
  /** Plain name → flag recognition (lesson openers). */
  basic?: boolean;
  /** Also draw distractors from the anchors (extra variety when a small pool runs dry). */
  wide?: boolean;
}

export function countryOf(code: string): Country | undefined {
  return COUNTRY_BY_CODE.get(code);
}

/** Kinds whose question is about exactly one country. */
export function isSingle(kind: TourKind): boolean {
  return kind !== "pairs" && kind !== "sort";
}

export function subjectOf(kind: TourKind, codes: string[]): string {
  return `tour:${kind}:${[...codes].sort().join("+")}`;
}

export function tourQuestion(prompt: string, answer: string, hint: string, payload: TourPayload, keyCodes: string[]): Question {
  return {
    id: "",
    prompt,
    answer,
    choices: [],
    hint,
    inputMode: "tour",
    repeatable: true,
    dedupeKey: subjectOf(payload.tour, keyCodes),
    payload: payload as unknown as Record<string, unknown>,
  };
}

export function subjectKey(dedupeKey: string): string {
  return `subject:${dedupeKey}`;
}

function visibleKey(q: Question): string {
  return `visible:${JSON.stringify([q.prompt, q.answer, q.payload ?? null])}`;
}

/**
 * Same identity keys as `questionKeys` in generators/index (which imports the
 * planner, so it cannot be imported back here). scripts/audit-tour.ts checks
 * the two never drift apart.
 */
export function tourKeys(q: Question): string[] {
  return q.dedupeKey ? [subjectKey(q.dedupeKey), visibleKey(q)] : [visibleKey(q)];
}

export function isFresh(q: Question, seen: ReadonlySet<string>): boolean {
  return !tourKeys(q).some((key) => seen.has(key));
}

/**
 * The same exercise under a numbered subject ("tour:pick:JPN#2") for sessions
 * that have used every plain subject. Null when it would LOOK identical to a
 * question already shown.
 */
export function asVariant(q: Question, seen: ReadonlySet<string>): Question | null {
  if (seen.has(visibleKey(q))) return null;
  let n = 2;
  while (seen.has(subjectKey(`${q.dedupeKey}#${n}`))) n++;
  return { ...q, dedupeKey: `${q.dedupeKey}#${n}` };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
