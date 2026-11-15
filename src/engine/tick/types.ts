// Tick Tock — CONTRACT of the tell-the-time course, shared by the planner
// (engine), the clock widgets (UI) and the lesson screen. Questions are normal
// engine `Question`s with `inputMode: "tour"` and `repeatable: true`. Two kinds
// are the course's own (`tick-read`, `tick-set`); the rest are Course Kit
// payloads (`kit-pairs`, `kit-pick`, `kit-order`, `kit-sort`) that the planner
// builds on the fly with clock faces as card art. The store judges with plain
// `typed === question.answer` (serialisers: ./clock.ts).
import type { Question } from "../generators/types";
import type { KitTemplate } from "../kit/types";

/** A time on a 12-hour clock face. */
export interface ClockTime {
  /** 1–12. */
  hour: number;
  /** 0–59. */
  minute: number;
}

/** How fine the minutes of a lesson are: whole hours, halves, quarters, fives, or any minute. */
export type TickStep = 60 | 30 | 15 | 5 | 1;

/** What a lesson may ask. */
export type TickTask =
  | "read" // a clock is shown: type the time
  | "set" // a time is written: move the hands to it
  | "match" // match clocks to written times (kit-pairs)
  | "pick-clock" // a time is written: tap the clock that shows it (kit-pick)
  | "pick-words" // a clock is shown: tap how you say it (kit-pick)
  | "order" // put clocks in order, earliest first (kit-order)
  | "later-read" // "30 minutes later…" — a clock is shown: type the new time
  | "later-set"; // "…": move the hands to the new time

/** What the lesson's opening demo teaches (content/tick/intros.ts). */
export type TickIntroKey = "hands" | "oclock" | "half" | "quarter" | "fives" | "minutes" | "later";

/** Stage params for a Tick Tock lesson (StageDef.params). */
export interface TickParams {
  tasks: TickTask[];
  step: TickStep;
  /** Minutes the lesson centres on (e.g. [30] for half past); defaults to every multiple of `step`. */
  focus?: number[];
  /** Write times in words where there is a natural phrase ("half past 3", "quarter to 4"). */
  words?: boolean;
  /** Jumps for the "later" tasks, in minutes (e.g. [30, 60]). */
  jumps?: number[];
  /** Course Kit templates mixed in (parts of the day, days of the week…). */
  kit?: KitTemplate[];
  intro?: TickIntroKey;
}

export type TickKind = "tick-read" | "tick-set";

interface TickBase {
  tour: TickKind;
  /** The task this question came from (a replacement keeps the same task). */
  task: TickTask;
  /** Finest minute step of the puzzle (the hands snap to it). */
  step: TickStep;
}

/** A clock is shown; the child types the time on a time pad. answer = timeKey(answer time). */
export interface ReadPayload extends TickBase {
  tour: "tick-read";
  /** The time the clock shows. */
  shown: ClockTime;
  /** "later-read": minutes to add to `shown` — the child types the NEW time. 0 for a plain read. */
  jump: number;
}

/** A time is written; the child moves the hands, then CHECK. answer = timeKey(target). */
export interface SetPayload extends TickBase {
  tour: "tick-set";
  /** How the target is written for the child: "3:30" or "half past 3". For "later-set" this is the jump phrase. */
  say: string;
  target: ClockTime;
  /** Where the hands start (never the target). For "later-set" it is the "before" time. */
  start: ClockTime;
  /** "later-set": minutes from `start` to `target`; 0 otherwise. */
  jump: number;
}

export type TickPayload = ReadPayload | SetPayload;

/** Narrow a generic question to its Tick Tock payload (null for everything else, kit payloads included). */
export function tickPayload(q: Question | null | undefined): TickPayload | null {
  const p = q?.payload as { tour?: unknown } | undefined;
  return q?.inputMode === "tour" && typeof p?.tour === "string" && p.tour.startsWith("tick-")
    ? (q.payload as unknown as TickPayload)
    : null;
}
