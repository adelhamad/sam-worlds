// Shared pieces of the Tick Tock puzzle builders: the question factory, the
// cards, the way a time is written for the child and the teaching hints.
import type { Question } from "../generators/types";
import type { KitItem, KitPayload } from "../kit/types";
import { TICK } from "../../strings/tick";
import { hasWords, timeKey, timeWords } from "./clock";
import type { TickSpec } from "./times";
import type { ClockTime, TickPayload, TickTask } from "./types";

const HINT = TICK.engine.hint;

/** One build: the question, every time it shows, and its main ("answer") time key for the lesson's no-repeat rule. */
export interface Built {
  question: Question;
  times: ClockTime[];
  primary: string;
}

export function tickQuestion(
  task: TickTask, text: { prompt: string; hint: string }, answer: string, print: string, payload: TickPayload | KitPayload,
): Question {
  return {
    id: "", prompt: text.prompt, answer, choices: [], hint: text.hint, inputMode: "tour", repeatable: true,
    dedupeKey: `tick:${task}:${print}`, payload: payload as unknown as Record<string, unknown>,
  };
}

/** How a time is written on a card: the everyday phrase when the lesson uses words, else "3:25". */
export function written(time: ClockTime, spec: TickSpec): string {
  return spec.words && hasWords(time) ? timeWords(time) : timeKey(time);
}

export function clockCard(time: ClockTime): KitItem {
  return { id: timeKey(time), label: "", art: { kind: "clock", hour: time.hour, minute: time.minute } };
}

export function wordCard(time: ClockTime, spec: TickSpec): KitItem {
  return { id: timeKey(time), label: written(time, spec) };
}

/** The rule that reads this time (never the time itself). */
export function readHint(time: ClockTime, step: number): string {
  if (time.minute === 0) return step === 60 ? HINT.hour : HINT.oclock;
  if (time.minute === 30) return HINT.half;
  if (time.minute === 15) return HINT.quarterPast;
  if (time.minute === 45) return HINT.quarterTo;
  return time.minute % 5 === 0 ? HINT.fives : HINT.minutes;
}

/** The rule for a jump on the dial. */
export function laterHint(jump: number): string {
  if (jump === 60) return HINT.laterHour;
  if (jump === 30) return HINT.laterHalf;
  if (jump < 60) return HINT.laterFives;
  return HINT.laterMix;
}
