// Card puzzles of Tick Tock, built straight as Course Kit payloads (the
// generic kit widgets draw them, with clock faces as card art): match clocks
// to written times, pick the clock, pick the words, put clocks in order.
// Distractors are the instructive slips: the hands swapped, the hour next
// door, "quarter to" the same hour instead of the next one.
import { pick, shuffle, type RNG } from "../rng";
import { orderAnswer, pairsAnswer } from "../kit/answers";
import type { KitItem, KitOrderPayload, KitPairsPayload, KitPickPayload } from "../kit/types";
import { TICK } from "../../strings/tick";
import { addMinutes, hasWords, timeKey, toMinutes } from "./clock";
import { clockCard, readHint, tickQuestion, wordCard, written, type Built } from "./puzzle";
import {
  FRIENDLY_HOURS, ORDER_HOURS, drawAny, drawMany, drawTime, fingerprint, handSwap, isLow, keysOf, onMinutes, swapsWith,
  type TickEnv,
} from "./times";
import type { ClockTime } from "./types";

const ENGINE = TICK.engine;
const RESHUFFLES = 12;

/** Cards on a board: 3 when easier, 5 when hard, else 4. */
function boardSize(env: TickEnv): number {
  if (env.easier) return 3;
  return env.difficulty > 0.6 ? 5 : 4;
}

/** The first `amount` distinct times of `list` that differ from `taken`. */
function distinctTimes(list: Array<ClockTime | null>, taken: ClockTime[], amount: number): ClockTime[] {
  const keys = new Set(keysOf(taken));
  const out: ClockTime[] = [];
  for (const time of list) {
    if (!time || keys.has(timeKey(time)) || out.length >= amount) continue;
    keys.add(timeKey(time));
    out.push(time);
  }
  return out;
}

/** `amount` options: the slips first, then any other times of the lesson. */
function options(env: TickEnv, right: ClockTime, slips: Array<ClockTime | null>, amount: number): ClockTime[] {
  const chosen = distinctTimes(slips, [right], amount);
  const avoid = new Set(keysOf([right, ...chosen]));
  return [...chosen, ...drawMany(env, amount - chosen.length, { avoid })];
}

// ------------------------------------------------------------------ match

/** One clock that reads as another with the hands swapped, both on the lesson's minutes. */
function swapPair(env: TickEnv): ClockTime[] {
  const first = drawTime(env, { accept: (time) => { const swapped = handSwap(time); return swapped !== null && onMinutes(swapped, env.spec); } });
  const swapped = first && handSwap(first);
  return first && swapped ? [first, swapped] : [];
}

export function buildMatch(env: TickEnv): Built {
  const size = boardSize(env);
  const low = isLow(env);
  // Hard boards include a hand-swap pair on purpose; gentle ones keep such pairs apart.
  const seeded = !env.easier && env.difficulty > 0.5 ? swapPair(env) : [];
  const fits = (time: ClockTime, chosen: ClockTime[]) => !low || ![...seeded, ...chosen].some((other) => swapsWith(other, time));
  const times = [...seeded, ...drawMany(env, size - seeded.length, { avoid: new Set(keysOf(seeded)) }, fits)];
  const decoy = env.difficulty > 0.3 && !env.easier ? drawTime(env, { avoid: new Set(keysOf(times)) }) : null;
  const ids = keysOf(times);
  const right: KitItem[] = [...times, ...(decoy ? [decoy] : [])].map((time) => wordCard(time, env.spec));
  const payload: KitPairsPayload = {
    tour: "kit-pairs", template: "match", explain: ENGINE.explain.match,
    left: shuffle(env.rng, times.map(clockCard)), right: shuffle(env.rng, right),
  };
  const print = fingerprint(times);
  const question = tickQuestion("match", { prompt: ENGINE.match, hint: ENGINE.hint.match }, pairsAnswer(ids), print, payload);
  return { question, times: decoy ? [...times, decoy] : times, primary: print };
}

// ------------------------------------------------------------------ picks

/** Same minutes at another hour (not the one next door). */
function otherHour(rng: RNG, time: ClockTime): ClockTime {
  return addMinutes(time, 60 * pick(rng, [2, 3, 4, 5, 6, 7, 8, 9, 10]));
}

/** The same minutes an hour later and an hour earlier, in random order. */
function nextDoor(rng: RNG, time: ClockTime): [ClockTime, ClockTime] {
  const later = addMinutes(time, 60);
  const earlier = addMinutes(time, -60);
  return rng() < 0.5 ? [later, earlier] : [earlier, later];
}

/** Same hour at another of the lesson's minutes (null when the lesson has one minute). */
function otherMinute(env: TickEnv, time: ClockTime): ClockTime | null {
  const others = env.spec.minutes.filter((minute) => minute !== time.minute);
  return others.length ? { hour: time.hour, minute: pick(env.rng, others) } : null;
}

export function buildPickClock(env: TickEnv): Built {
  const right = drawAny(env, { primary: true });
  const [near, far] = nextDoor(env.rng, right);
  const slips = [handSwap(right), near, otherMinute(env, right), otherHour(env.rng, right), far];
  const shown = [right, ...options(env, right, slips, (env.easier ? 3 : 4) - 1)];
  const say = written(right, env.spec);
  const payload: KitPickPayload = {
    tour: "kit-pick", template: "pick-clock", explain: ENGINE.explain.pickClock, guessable: true, layout: "grid",
    options: shuffle(env.rng, shown.map(clockCard)),
  };
  const text = { prompt: ENGINE.pickClock(say), hint: readHint(right, env.spec.step) };
  return { question: tickQuestion("pick-clock", text, timeKey(right), fingerprint(shown), payload), times: shown, primary: timeKey(right) };
}

/** The classic slips in words: "quarter to 3" for 3:45, "quarter to 3" for 3:15, the hands swapped, an hour off, o'clock. */
function wordSlips(env: TickEnv, right: ClockTime): Array<ClockTime | null> {
  const sameHourTo = right.minute === 45 ? addMinutes(right, -60) : null;
  const pastTo = right.minute === 15 ? addMinutes(right, -30) : null;
  const [near, far] = nextDoor(env.rng, right);
  const oclock = right.minute ? { hour: right.hour, minute: 0 } : null;
  const slips = [sameHourTo, handSwap(right), pastTo, near, far, oclock, otherHour(env.rng, right)];
  // In a words lesson every option is said in words the child already knows (a lone "6:35" would give itself away).
  const known = knownMinutes(env);
  return env.spec.words ? slips.filter((time) => !time || (hasWords(time) && known.includes(time.minute))) : slips;
}

/** Minutes a words lesson may say: up to its latest minute (quarter past comes before quarter to), plus o'clock and half past. */
function knownMinutes(env: TickEnv): number[] {
  const latest = Math.max(...env.spec.minutes);
  const steps = Array.from({ length: 60 / env.spec.step }, (_, i) => i * env.spec.step).filter((minute) => minute <= latest);
  return [...steps, 0, ...(env.spec.step <= 30 ? [30] : [])];
}

export function buildPickWords(env: TickEnv): Built {
  const right = drawAny(env, { primary: true });
  const shown = [right, ...options(env, right, wordSlips(env, right), (env.easier ? 3 : 4) - 1)];
  const payload: KitPickPayload = {
    tour: "kit-pick", template: "pick-words", explain: ENGINE.explain.pickWords, guessable: true, layout: "list",
    hero: { ...clockCard(right), id: "hero" },
    options: shuffle(env.rng, shown.map((time) => wordCard(time, env.spec))),
  };
  const text = { prompt: ENGINE.pickWords, hint: readHint(right, env.spec.step) };
  return { question: tickQuestion("pick-words", text, timeKey(right), fingerprint(shown), payload), times: shown, primary: timeKey(right) };
}

// ------------------------------------------------------------------ order

/** A shuffle of `cards` that is not already earliest-first (reversed as a last resort). */
function outOfOrder(rng: RNG, cards: KitItem[], answer: string): KitItem[] {
  let candidate = shuffle(rng, cards);
  for (let i = 0; i < RESHUFFLES && orderAnswer(candidate.map((card) => card.id)) === answer; i++) candidate = shuffle(rng, cards);
  return orderAnswer(candidate.map((card) => card.id)) === answer ? [...cards].reverse() : candidate;
}

export function buildOrder(env: TickEnv): Built {
  const hours = env.easier ? FRIENDLY_HOURS : ORDER_HOURS;
  const first = drawAny(env, { hours });
  // Hard boards put two times in the same hour, so the minutes decide.
  const twin = env.difficulty > 0.6 && !env.easier ? otherMinute(env, first) : null;
  const seeded = twin ? [first, twin] : [first];
  const rest = drawMany(env, boardSize(env) - seeded.length, { hours, avoid: new Set(keysOf(seeded)) });
  const times = [...seeded, ...rest].sort((a, b) => toMinutes(a) - toMinutes(b));
  const answer = orderAnswer(keysOf(times));
  const payload: KitOrderPayload = {
    tour: "kit-order", template: "order", explain: ENGINE.explain.order, cards: outOfOrder(env.rng, times.map(clockCard), answer),
  };
  const print = fingerprint(times);
  return { question: tickQuestion("order", { prompt: ENGINE.order, hint: ENGINE.hint.order }, answer, print, payload), times, primary: print };
}
