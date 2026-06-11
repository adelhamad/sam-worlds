// Time Keep — set the clockwork tower's hands. Constructed answer: Sam moves
// the analog hands; the widget submits "h:mm".
import { pick, randInt, type RNG } from "../rng";
import type { GenContext, Question } from "./types";

export interface ClockParams {
  /** Minute precision: 60 (o'clock), 30, 15, 5. */
  step: 60 | 30 | 15 | 5;
  /** Elapsed-time word problems instead of plain "set the clock". */
  elapsed?: boolean;
}

let qid = 0;

function fmt(h: number, m: number): string {
  return `${h}:${String(m).padStart(2, "0")}`;
}

function words(h: number, m: number): string {
  if (m === 0) return `${h} o'clock`;
  if (m === 30) return `half past ${h}`;
  if (m === 15) return `quarter past ${h}`;
  if (m === 45) return `quarter to ${h === 12 ? 1 : h + 1}`;
  return fmt(h, m);
}

function easierStep(step: number): 60 | 30 | 15 {
  if (step === 5) return 15;
  return 30;
}

function durationText(addMin: number): string {
  if (addMin % 60 !== 0) return `${addMin} minutes`;
  const hours = addMin / 60;
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

export function generateClock(params: ClockParams, rng: RNG, ctx: GenContext): Question {
  const step = ctx.easier ? easierStep(params.step) : params.step;
  const h = randInt(rng, 1, 12);
  const m = randInt(rng, 0, 60 / step - 1) * step;

  if (params.elapsed && !ctx.easier) {
    const addMin = pick(rng, [30, 60, 90, 120]);
    const total = h * 60 + m + addMin;
    const eh = Math.floor(total / 60) % 12 || 12;
    const em = total % 60;
    const durText = durationText(addMin);
    return {
      id: `tk${++qid}`,
      prompt: `Star-train leaves at ${words(h, m)} and rides ${durText}. Set arrival!`,
      answer: fmt(eh, em),
      choices: [],
      hint: `Start at ${fmt(h, m)}, move forward ${durText}.`,
      inputMode: "clock",
      payload: { step },
    };
  }

  return {
    id: `tk${++qid}`,
    prompt: `Set the clock to ${words(h, m)}`,
    answer: fmt(h, m),
    choices: [],
    hint: m === 0 ? "Big hand straight up!" : `Big hand on ${m / 5}.`,
    inputMode: "clock",
    payload: { step },
  };
}
