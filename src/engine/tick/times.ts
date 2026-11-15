// Choosing the times of a Tick Tock lesson: the lesson's minutes (its focus or
// every multiple of its step), hours spread evenly over the lesson, never the
// same answer twice for one task, and the clock facts the puzzles are built on
// (the hand-swap misreading, crossing 12 → 1). Pure; all randomness is the rng.
import { pick, type RNG } from "../rng";
import { addMinutes, timeKey, toMinutes } from "./clock";
import type { ClockTime, TickParams, TickStep, TickTask } from "./types";

export const TICK_TASKS: TickTask[] = ["read", "set", "match", "pick-clock", "pick-words", "order", "later-read", "later-set"];
const STEPS: TickStep[] = [60, 30, 15, 5, 1];
export const ALL_HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
/** Hours with no 11 → 12 → 1 wrap nearby (gentler for a child who keeps missing). */
export const FRIENDLY_HOURS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
/** "Earliest first" is only unambiguous on one half-day without 12:xx. */
export const ORDER_HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/** Everything the time pickers need to know about the lesson. */
export interface TickSpec {
  step: TickStep;
  /** The lesson's minutes (focus, or every multiple of the step), ascending. */
  minutes: number[];
  words: boolean;
  jumps: number[];
}

/** What the lesson has shown so far (soft spread) — shared by all of its slots. */
export interface TimeBook {
  times: Map<string, number>;
  hours: Map<number, number>;
}

/** One puzzle build: the generator's world. */
export interface TickEnv {
  rng: RNG;
  difficulty: number;
  easier: boolean;
  spec: TickSpec;
  book: TimeBook;
  /** Answer times this task has already used (never again in the lesson). */
  taken: ReadonlySet<string>;
}

export const newBook = (): TimeBook => ({ times: new Map(), hours: new Map() });

/** Gentle setting: the start of a lesson, or a child who keeps missing. */
export const isLow = (env: TickEnv) => env.easier || env.difficulty < 0.35;

export function tickSpec(params: Partial<TickParams>): TickSpec {
  const step = STEPS.includes(params.step as TickStep) ? (params.step as TickStep) : 60;
  const focus = (params.focus ?? []).filter((m) => Number.isInteger(m) && m >= 0 && m < 60);
  const all = Array.from({ length: 60 / step }, (_, i) => i * step);
  const minutes = [...new Set(focus.length ? focus : all)].sort((a, b) => a - b);
  const jumps = (params.jumps ?? []).filter((j) => Number.isInteger(j) && j > 0 && j < 720);
  return { step, minutes, words: params.words === true, jumps: jumps.length ? jumps : [60] };
}

export const onMinutes = (time: ClockTime, spec: TickSpec) => spec.minutes.includes(time.minute);
export const keysOf = (times: ClockTime[]) => times.map(timeKey);
/** Order-free identity of a set of times. */
export const fingerprint = (times: ClockTime[]) => keysOf(times).sort().join("+");

/**
 * The misreading of a child who swaps the hands: the long hand read as the
 * hour, the short hand as the minutes (6:15 → 3:30). Null when the minute hand
 * is not on a number, or the swap reads the same time (12:00, 2:10…).
 */
export function handSwap(time: ClockTime): ClockTime | null {
  if (time.minute % 5 !== 0) return null;
  const swapped = { hour: time.minute / 5 || 12, minute: (time.hour % 12) * 5 };
  return timeKey(swapped) === timeKey(time) ? null : swapped;
}

/** Does `a` read as `b` with the hands swapped (either way)? */
export function swapsWith(a: ClockTime, b: ClockTime): boolean {
  const sa = handSwap(a);
  const sb = handSwap(b);
  return (sa !== null && timeKey(sa) === timeKey(b)) || (sb !== null && timeKey(sb) === timeKey(a));
}

/** Going from `start` to `end`, does the hour number wrap (12:30 → 1:30)? */
export function crossesTwelve(start: ClockTime, jump: number): boolean {
  return addMinutes(start, jump).hour < start.hour || jump >= 720;
}

/** Shortest way round the dial between two times, in minutes. */
export function dialGap(a: ClockTime, b: ClockTime): number {
  const gap = Math.abs(toMinutes(a) - toMinutes(b));
  return Math.min(gap, 720 - gap);
}

export interface DrawOptions {
  minutes?: number[];
  hours?: number[];
  accept?: (time: ClockTime) => boolean;
  /** Times this board already shows. */
  avoid?: ReadonlySet<string>;
  /** Also avoid the task's used answers (true for a puzzle's main time). */
  primary?: boolean;
}

/** Any-minute lessons practise real "every minute" times about two thirds of the time. */
function minutePool(env: TickEnv, minutes: number[] | undefined): number[] {
  if (minutes) return minutes;
  const { spec, rng } = env;
  if (spec.step !== 1) return spec.minutes;
  const odd = spec.minutes.filter((m) => m % 5 !== 0);
  const round = spec.minutes.filter((m) => m % 5 === 0);
  return rng() < 2 / 3 ? odd : round;
}

function candidates(env: TickEnv, options: DrawOptions): ClockTime[] {
  const hours = options.hours ?? (env.easier ? FRIENDLY_HOURS : ALL_HOURS);
  const minutes = minutePool(env, options.minutes);
  const out = hours.flatMap((hour) => minutes.map((minute) => ({ hour, minute })));
  return options.accept ? out.filter(options.accept) : out;
}

/** Hours not on this board first, then times the lesson has not shown, then the least-used hours. */
function score(book: TimeBook, board: ReadonlySet<number>, time: ClockTime): number {
  return (board.has(time.hour) ? 10000 : 0) + (book.times.get(timeKey(time)) ?? 0) * 100 + (book.hours.get(time.hour) ?? 0);
}

/**
 * One time for a puzzle: on the lesson's minutes, not on this board, not a
 * used answer of the task (for a main time), and spread over the lesson.
 * Never a time in `avoid`; null when no time passes `accept` and `avoid`.
 */
export function drawTime(env: TickEnv, options: DrawOptions = {}): ClockTime | null {
  let pool = candidates(env, options);
  if (!pool.length && !options.minutes && env.spec.step === 1) pool = candidates(env, { ...options, minutes: env.spec.minutes });
  if (!pool.length && env.easier && !options.hours) pool = candidates(env, { ...options, hours: ALL_HOURS });
  const avoid = options.avoid ?? new Set<string>();
  const free = pool.filter((time) => !avoid.has(timeKey(time)));
  const fresh = options.primary ? free.filter((time) => !env.taken.has(timeKey(time))) : free;
  const tier = [fresh, free].find((list) => list.length) ?? [];
  if (!tier.length) return null;
  const board = new Set([...avoid].map((key) => Number(key.split(":")[0])));
  const scores = tier.map((time) => score(env.book, board, time));
  const best = Math.min(...scores);
  return pick(env.rng, tier.filter((_, i) => scores[i] === best));
}

/** Like drawTime, but never null: falls back to the lesson's first time on the dial. */
export function drawAny(env: TickEnv, options: DrawOptions = {}): ClockTime {
  return drawTime(env, options) ?? drawTime(env, { ...options, accept: undefined }) ?? { hour: 3, minute: env.spec.minutes[0] ?? 0 };
}

/** Count the times a question showed, so later slots spread to others. */
export function markShown(book: TimeBook, times: ClockTime[]): void {
  for (const time of times) {
    const key = timeKey(time);
    book.times.set(key, (book.times.get(key) ?? 0) + 1);
    book.hours.set(time.hour, (book.hours.get(time.hour) ?? 0) + 1);
  }
}

/** Up to `amount` distinct times drawn one by one (each sees the ones before it). */
export function drawMany(
  env: TickEnv, amount: number, options: DrawOptions, fits: (time: ClockTime, chosen: ClockTime[]) => boolean = () => true,
): ClockTime[] {
  const chosen: ClockTime[] = [];
  for (let i = 0; i < amount; i++) {
    const avoid = new Set([...(options.avoid ?? []), ...keysOf(chosen)]);
    const accept = (time: ClockTime) => (options.accept?.(time) ?? true) && fits(time, chosen);
    const time = drawTime(env, { ...options, avoid, accept }) ?? drawTime(env, { ...options, avoid });
    if (!time) break;
    chosen.push(time);
  }
  return chosen;
}

export function pickJump(env: TickEnv): number {
  return pick(env.rng, env.spec.jumps);
}
