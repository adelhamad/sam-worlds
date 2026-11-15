// Clock maths and wording for Tick Tock. Pure. The planner uses these to set
// `question.answer`; the widgets use the SAME helpers to serialise what the
// child did, so the shared answer engine judges with plain equality.
import type { ClockTime } from "./types";

/** Canonical answer string: "3:05", "12:30". */
export function timeKey(time: ClockTime): string {
  return `${time.hour}:${String(time.minute).padStart(2, "0")}`;
}

/** Minutes after 12:00 on the dial (0–719). */
export function toMinutes(time: ClockTime): number {
  return (time.hour % 12) * 60 + time.minute;
}

/** The dial time that is `minutes` after 12:00 (wraps around the 12-hour face). */
export function fromMinutes(minutes: number): ClockTime {
  const wrapped = ((Math.round(minutes) % 720) + 720) % 720;
  const hour = Math.floor(wrapped / 60);
  return { hour: hour === 0 ? 12 : hour, minute: wrapped % 60 };
}

export function addMinutes(time: ClockTime, minutes: number): ClockTime {
  return fromMinutes(toMinutes(time) + minutes);
}

export function sameTime(a: ClockTime, b: ClockTime): boolean {
  return a.hour === b.hour && a.minute === b.minute;
}

/** The hour that follows on the dial (12 → 1). */
export function nextHour(hour: number): number {
  return hour === 12 ? 1 : hour + 1;
}

/** Hand angles in degrees, clockwise from 12. The hour hand creeps as the minutes pass. */
export function handAngles(time: ClockTime): { hour: number; minute: number } {
  return { hour: (time.hour % 12) * 30 + time.minute * 0.5, minute: time.minute * 6 };
}

/** The dial time a pair of hand angles shows, snapped to `step` minutes. */
export function timeFromMinuteAngle(hour: number, minuteAngle: number, step: number): ClockTime {
  const raw = (((minuteAngle % 360) + 360) % 360) / 6;
  const snapped = Math.round(raw / step) * step;
  return snapped >= 60 ? { hour: nextHour(hour), minute: 0 } : { hour, minute: snapped };
}

/** True when the time has a everyday phrase: o'clock, quarter past, half past, quarter to. */
export function hasWords(time: ClockTime): boolean {
  return time.minute % 15 === 0;
}

/** "3 o'clock", "quarter past 3", "half past 3", "quarter to 4"; other minutes fall back to "3:20". */
export function timeWords(time: ClockTime): string {
  if (time.minute === 0) return `${time.hour} o'clock`;
  if (time.minute === 15) return `quarter past ${time.hour}`;
  if (time.minute === 30) return `half past ${time.hour}`;
  if (time.minute === 45) return `quarter to ${nextHour(time.hour)}`;
  return timeKey(time);
}

/** "30 minutes", "1 hour", "1 hour 30 minutes". */
export function jumpWords(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  if (rest > 0) parts.push(`${rest} ${rest === 1 ? "minute" : "minutes"}`);
  return parts.join(" ");
}
