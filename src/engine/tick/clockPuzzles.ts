// The course's own puzzles: read a clock (type the time) and set a clock
// (move the hands), plain or "how much later". Each takes the lesson's env
// and returns one build; the answer is always timeKey of the time to reach.
import { pick } from "../rng";
import { TICK } from "../../strings/tick";
import { addMinutes, hasWords, jumpWords, timeKey, timeWords } from "./clock";
import { laterHint, readHint, tickQuestion, type Built } from "./puzzle";
import { ALL_HOURS, crossesTwelve, dialGap, drawAny, drawTime, isLow, onMinutes, pickJump, type TickEnv } from "./times";
import type { ClockTime, ReadPayload, SetPayload } from "./types";

const ENGINE = TICK.engine;
const NOON: ClockTime = { hour: 12, minute: 0 };
const SIX: ClockTime = { hour: 6, minute: 0 };

export function buildRead(env: TickEnv): Built {
  const shown = drawAny(env, { primary: true });
  const payload: ReadPayload = { tour: "tick-read", task: "read", step: env.spec.step, shown, jump: 0 };
  const answer = timeKey(shown);
  const question = tickQuestion("read", { prompt: ENGINE.read, hint: readHint(shown, env.spec.step) }, answer, answer, payload);
  return { question, times: [shown], primary: answer };
}

/** Where the hands start: 12:00 when gentle, else a time on the step grid at least 2 hours away. */
function startFor(env: TickEnv, target: ClockTime): ClockTime {
  if (isLow(env)) return timeKey(target) === timeKey(NOON) ? SIX : NOON;
  const grid = Array.from({ length: 60 / env.spec.step }, (_, i) => i * env.spec.step);
  const far = ALL_HOURS.flatMap((hour) => grid.map((minute) => ({ hour, minute }))).filter((time) => dialGap(time, target) >= 120);
  return pick(env.rng, far);
}

/** How the target is written: about half the time in words when the lesson uses them. */
function sayFor(env: TickEnv, target: ClockTime): string {
  return env.spec.words && hasWords(target) && env.rng() < 0.5 ? timeWords(target) : timeKey(target);
}

export function buildSet(env: TickEnv): Built {
  const target = drawAny(env, { primary: true });
  const say = sayFor(env, target);
  const payload: SetPayload = { tour: "tick-set", task: "set", step: env.spec.step, say, target, start: startFor(env, target), jump: 0 };
  const answer = timeKey(target);
  const question = tickQuestion("set", { prompt: ENGINE.set(say), hint: readHint(target, env.spec.step) }, answer, answer, payload);
  return { question, times: [target], primary: answer };
}

/** The "before" time of a jump: gentle settings never cross 12 → 1; the time after is a new answer when possible. */
function beforeTime(env: TickEnv, jump: number): ClockTime {
  const ok = (time: ClockTime) => onMinutes(addMinutes(time, jump), env.spec) && !(isLow(env) && crossesTwelve(time, jump));
  const fresh = (time: ClockTime) => ok(time) && !env.taken.has(timeKey(addMinutes(time, jump)));
  return drawTime(env, { accept: fresh }) ?? drawTime(env, { accept: ok }) ?? drawAny(env);
}

export function buildLaterRead(env: TickEnv): Built {
  const jump = pickJump(env);
  const shown = beforeTime(env, jump);
  const after = addMinutes(shown, jump);
  const payload: ReadPayload = { tour: "tick-read", task: "later-read", step: env.spec.step, shown, jump };
  const answer = timeKey(after);
  const text = { prompt: ENGINE.laterRead(jumpWords(jump)), hint: laterHint(jump) };
  return { question: tickQuestion("later-read", text, answer, `${timeKey(shown)}+${jump}`, payload), times: [shown, after], primary: answer };
}

export function buildLaterSet(env: TickEnv): Built {
  const jump = pickJump(env);
  const start = beforeTime(env, jump);
  const target = addMinutes(start, jump);
  const words = jumpWords(jump);
  const payload: SetPayload = { tour: "tick-set", task: "later-set", step: env.spec.step, say: ENGINE.laterSay(words), target, start, jump };
  const answer = timeKey(target);
  const text = { prompt: ENGINE.laterSet(words), hint: laterHint(jump) };
  return { question: tickQuestion("later-set", text, answer, `${timeKey(start)}+${jump}`, payload), times: [start, target], primary: answer };
}
