// When the friendly reminders fire and what each one says — pure, so it can be
// printed and audited without a browser. At most two a day (late morning and
// after school, device local time), never in quiet hours, for the next few
// days. A day on which Sam already finished a lesson gets no more reminders.
// No guilt, no urgency: every cheer points at something good that is waiting.
import { COURSES } from "../../content/courses";
import { HOME } from "../../strings/home";

export interface Cheer {
  title: string;
  body: string;
}

/** What is knowable when reminders are (re)armed. */
export interface ReminderContext {
  /** Quests not finished yet today. */
  questsOpenToday: number;
  /** Title of the lesson the Continue button would start. */
  nextLesson: string | null;
  /** A unit treasure chest is ready to open on some course path. */
  chestWaiting: boolean;
  /** A lesson was finished today — today's remaining slots stay quiet. */
  playedToday?: boolean;
}

export interface ReminderSlot {
  /** Epoch ms the notification should show. */
  when: number;
  /** Notification tag (`sam-reminder-<day>-<slot>`) — the same slot replaces itself. */
  tag: string;
  cheer: Cheer;
}

export const REMINDER_TAG = "sam-reminder";
/** Local times of the daily slots: late morning and after school. */
export const REMINDER_SLOTS = [
  { key: "am", hour: 10, minute: 30 },
  { key: "pm", hour: 16, minute: 30 },
] as const;
/** Quiet hours: nothing before 08:00 or after 19:30. */
export const QUIET_BEFORE_MIN = 8 * 60;
export const QUIET_AFTER_MIN = 19 * 60 + 30;
/** Today plus the next three days; re-armed on every visit. */
export const REMINDER_DAYS = 4;
/** A slot this close to "now" is skipped (Sam is probably still here). */
export const MIN_LEAD_MS = 45 * 60 * 1000;

const C = HOME.cheers;

/** Every reminder that can rotate in (one per course, plus the general ones). */
export function cheerPool(): Cheer[] {
  const courses = COURSES.map((course, i) => C.course[i % C.course.length](course.title, course.icon));
  return [C.quests, C.gift, ...courses, ...C.general];
}

/** Every reminder text there is (for the audit). `lesson` fills the "next lesson" cheer. */
export function allCheers(lesson: string): Cheer[] {
  return [C.chest, C.next(lesson), ...cheerPool()];
}

/** The most relevant cheer for the first slot, if anything specific is waiting. */
export function leadCheer(context: ReminderContext | undefined): Cheer | null {
  if (!context) return null;
  if (context.chestWaiting) return C.chest;
  if (context.nextLesson) return C.next(context.nextLesson);
  if (context.questsOpenToday > 0) return C.quests;
  return null;
}

const pad = (value: number) => String(value).padStart(2, "0");

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function inDaytime(d: Date): boolean {
  const minutes = d.getHours() * 60 + d.getMinutes();
  return minutes >= QUIET_BEFORE_MIN && minutes <= QUIET_AFTER_MIN;
}

function dayNumber(d: Date): number {
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

/** The slots to schedule from `now` (device local time), with their cheers:
 * the next REMINDER_DAYS days that still have a slot (a quiet "played today"
 * is skipped, not counted). Each calendar slot has its own rotating cheer; the
 * first one is replaced by the most relevant cheer when something is waiting. */
export function reminderSchedule(now: number, context?: ReminderContext): ReminderSlot[] {
  const start = new Date(now);
  const times: { when: number; tag: string; rotation: number }[] = [];
  let days = 0;
  for (let offset = 0; offset <= REMINDER_DAYS && days < REMINDER_DAYS; offset++) {
    if (offset === 0 && context?.playedToday) continue;
    let any = false;
    REMINDER_SLOTS.forEach((slot, slotIndex) => {
      const at = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset, slot.hour, slot.minute);
      if (at.getTime() < now + MIN_LEAD_MS || !inDaytime(at)) return;
      const rotation = dayNumber(at) * REMINDER_SLOTS.length + slotIndex;
      times.push({ when: at.getTime(), tag: `${REMINDER_TAG}-${dayKey(at)}-${slot.key}`, rotation });
      any = true;
    });
    if (any) days++;
  }
  const lead = leadCheer(context);
  const pool = cheerPool();
  const slots: ReminderSlot[] = [];
  times.forEach(({ when, tag, rotation }, i) => {
    let cheer = i === 0 && lead ? lead : pool[rotation % pool.length];
    // Never the same cheer twice in a row (the lead, or a neighbour pushed along by it).
    for (let step = 1; i > 0 && cheer === slots[i - 1].cheer && step < pool.length; step++) cheer = pool[(rotation + step) % pool.length];
    slots.push({ when, tag, cheer });
  });
  return slots;
}
