// Tick Tock opening demos — DATA. Each lesson that introduces an idea opens
// with one of these (TickParams.intro): Pogo says the title, a big clock plays
// a short loop (≤ ~10 s) that SHOWS the idea, two lines teach it, and the child
// can grab the hands at any moment and play. Strings: strings/tick.ts
// (TICK.meet.intros). Times are running totals of minutes after 12:00
// (4:30 = 270) so the hands always turn the right way.
import type { TickIntroKey, TickStep } from "../../engine/tick/types";
import { TICK } from "../../strings/tick";

export interface TickFrame {
  /** Running total of minutes the clock shows in this frame. */
  at: number;
  /** How long the frame stays (ms). */
  ms: number;
  /** Make one hand glow. */
  pulse?: "hour" | "minute";
}

export interface TickIntro {
  title: string;
  /** Two lines, ≤ 8 words each. */
  lines: string[];
  /** The loop the clock plays (the first frame is jumped to, the rest glide). */
  frames: TickFrame[];
  /** How the hands snap when the child plays with them (60 = turn the short hand). */
  step: TickStep;
  /** Teaching overlays that follow the hands (also while the child plays). */
  show: {
    /** Paint the face: from 12 to the long hand up to half past, then from the hand on to 12 ("quarter to"). */
    wedge?: boolean;
    /** Minute ring 5, 10 … 55 on the rim; with `ringLit` the passed labels light up. */
    ring?: boolean;
    ringLit?: boolean;
    /** Highlight the hour the short hand has passed. */
    hourMark?: boolean;
    /** Light the single-minute marks since the last number. */
    ticks?: boolean;
    /** The long hand turns whole circles when the hour changes (false: it rests on 12). */
    spin?: boolean;
  };
  /** Under the clock: the hand legend, the time in words ("half past 4") or digits ("4:30"). */
  caption: "legend" | "words" | "digits";
}

const hold = (at: number, ms: number, pulse?: TickFrame["pulse"]): TickFrame => ({ at, ms, pulse });

/** Frames from `from` to `to` (inclusive) every `by` minutes, `ms` each. */
function sweep(from: number, to: number, by: number, ms: number): TickFrame[] {
  const out: TickFrame[] = [];
  for (let at = from; at <= to; at += by) out.push({ at, ms });
  return out;
}

const M = TICK.meet.intros;

export const TICK_INTROS: Record<TickIntroKey, TickIntro> = {
  hands: {
    ...M.hands,
    // 10:10 — the hands far apart, both easy to see
    frames: [hold(610, 1900, "hour"), hold(610, 1900, "minute"), hold(610, 800)],
    step: 5,
    show: {},
    caption: "legend",
  },
  oclock: {
    ...M.oclock,
    frames: [hold(0, 1200), ...sweep(60, 300, 60, 1150), hold(300, 900)],
    step: 60,
    show: { hourMark: true, spin: false },
    caption: "words",
  },
  half: {
    ...M.half,
    frames: [hold(240, 1100), ...sweep(241, 269, 1, 50), hold(270, 2400)],
    step: 5,
    show: { wedge: true },
    caption: "words",
  },
  quarter: {
    ...M.quarter,
    frames: [hold(120, 1000), ...sweep(121, 134, 1, 55), hold(135, 2000), ...sweep(136, 164, 1, 40), hold(165, 2600)],
    step: 15,
    show: { wedge: true },
    caption: "words",
  },
  fives: {
    ...M.fives,
    frames: [hold(420, 1000), ...sweep(425, 475, 5, 720), hold(480, 1500)],
    step: 5,
    show: { ring: true, ringLit: true },
    caption: "digits",
  },
  minutes: {
    ...M.minutes,
    frames: [hold(550, 1100), ...sweep(551, 559, 1, 650), hold(560, 1600)],
    step: 1,
    show: { ring: true, ticks: true },
    caption: "digits",
  },
  later: {
    ...M.later,
    frames: [hold(300, 1400), ...sweep(302, 358, 2, 70), hold(360, 2400)],
    step: 5,
    show: { hourMark: true },
    caption: "digits",
  },
};
