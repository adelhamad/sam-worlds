// Tick Tock widget helpers (no React). The interactive clock keeps a RUNNING
// TOTAL of minutes (unwrapped: 13:00 after 12:00 is 780, not 60) so the hands
// can turn many times and glide without spinning backwards at 12.
import { fromMinutes, toMinutes } from "../../../engine/tick/clock";
import type { ClockTime, TickStep } from "../../../engine/tick/types";
import { tourSfx } from "../../../engine/feedback/tourSfx";
import { mod } from "../../../ui/clock/clockGeo";

/** The running total that shows `time`, nearest to `around` (so the hands take the short way). */
export function nearestTotal(time: ClockTime, around: number): number {
  const base = toMinutes(time);
  return base + Math.round((around - base) / 720) * 720;
}

export const timeOf = (total: number): ClockTime => fromMinutes(total);

/** Hand angles for a running total. `spin: false` keeps the long hand from turning whole circles. */
export function handDegs(total: number, spin = true): { hour: number; minute: number } {
  return { hour: total * 0.5, minute: spin ? total * 6 : mod(total, 60) * 6 };
}

/** "3:05" → { hour: 3, minute: 5 }; anything else → null. */
export function parseTime(value: string | undefined | null): ClockTime | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value ?? "");
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  return hour >= 1 && hour <= 12 && minute <= 59 ? { hour, minute } : null;
}

let lastTick = 0;

/** Sounds for a hand move from `prev` to `next` (running totals): a tick per number crossed, a chime per hour. */
export function crossSound(prev: number, next: number, step: TickStep): void {
  if (prev === next) return;
  const now = typeof performance === "undefined" ? Date.now() : performance.now();
  if (now - lastTick < 45) return;
  lastTick = now;
  const unit = step === 60 ? 60 : 5;
  const hour = Math.floor(prev / 60) !== Math.floor(next / 60);
  if (hour && step !== 60) {
    tourSfx.chime();
    return;
  }
  if (Math.floor(prev / unit) !== Math.floor(next / unit) || step >= 5) {
    tourSfx.tick(mod(Math.floor(next / unit), 2) === 1);
  }
}
