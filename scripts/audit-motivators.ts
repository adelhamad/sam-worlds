// Audit of everything Pogo says at home (engine/quests/motivator.ts) and every
// reminder notification (engine/notify/schedule.ts): sweeps a grid of facts ×
// turns and checks length, banned words and moods; then checks the reminder
// schedule's cadence, quiet hours and "played today" rule. Run from
// scripts/audit-questions.ts (part of `bun run check`).
import { COURSES } from "../src/content/courses";
import type { QuestKind } from "../src/engine/quests/daily";
import { pogoLine, POGO_MOODS, type MotivatorFacts, type NearestQuest } from "../src/engine/quests/motivator";
import {
  allCheers, QUIET_AFTER_MIN, QUIET_BEFORE_MIN, REMINDER_DAYS, REMINDER_SLOTS, reminderSchedule, type ReminderContext,
} from "../src/engine/notify/schedule";

const MAX_LINE_WORDS = 9;
const MAX_TITLE_WORDS = 5;
const MAX_BODY_WORDS = 12;
const BANNED = /\b(wrong|fail\w*|miss you|missed|lose|losing|lost|last chance|hurry|don'?t forget|streak)\b/i;
const DAY_MS = 86_400_000;

/** Words a child reads (emoji and dashes are not words). */
function words(text: string): number {
  return text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

function checkText(text: string, max: number, label: string, failures: string[]): void {
  if (!text.trim()) failures.push(`${label}: empty line`);
  if (words(text) > max) failures.push(`${label}: ${words(text)} words (max ${max}) — "${text}"`);
  if (BANNED.test(text)) failures.push(`${label}: banned word — "${text}"`);
}

const LESSONS = COURSES.flatMap((course) => course.world.stages.map((stage) => stage.name));
const LONGEST_LESSON = [...LESSONS].sort((a, b) => words(b) - words(a))[0] ?? "Lesson";
const KINDS: QuestKind[] = ["lessons", "firstTry", "combo", "dust", "perfect"];
const NEAREST: (NearestQuest | null)[] = [
  null,
  ...KINDS.flatMap((kind) => [1, 7].map((left) => ({ kind, left, target: left + 1 }))),
];

const AXES: { [K in keyof Required<MotivatorFacts>]: MotivatorFacts[K][] } = {
  hour: [3, 9, 14, 18, 22],
  daysAway: [null, 0, 3],
  questsToCollect: [0, 1, 2],
  questsOpen: [0, 2],
  questChestReady: [false, true],
  chestWaitingIn: [null, ...COURSES.map((course) => course.title)],
  lessonsToChest: [null, 1, 2, 3],
  nextLesson: [null, LONGEST_LESSON],
  lessonsToday: [0, 1, 3],
  nearest: NEAREST,
  turn: [-1, 0, 1, 2, 3, 4, 5],
};

/** Every combination of the axes above. */
function* factGrid(): Generator<MotivatorFacts> {
  const keys = Object.keys(AXES) as (keyof MotivatorFacts)[];
  const index = keys.map(() => 0);
  for (;;) {
    yield Object.fromEntries(keys.map((key, i) => [key, AXES[key][index[i]]])) as unknown as MotivatorFacts;
    let axis = keys.length - 1;
    while (axis >= 0 && ++index[axis] === AXES[keys[axis]].length) index[axis--] = 0;
    if (axis < 0) return;
  }
}

function auditPogoLines(failures: string[]): number {
  const seen = new Map<string, string>();
  const take = (facts: MotivatorFacts) => {
    const line = pogoLine(facts);
    if (!POGO_MOODS.includes(line.mood)) failures.push(`pogoLine: mood "${line.mood}" outside the union`);
    if (!seen.has(line.text)) seen.set(line.text, line.mood);
  };
  for (const facts of factGrid()) take(facts);
  // Every lesson name in the "next lesson" lines.
  const base: MotivatorFacts = {
    hour: 10, daysAway: 0, questsToCollect: 0, questsOpen: 3, questChestReady: false, chestWaitingIn: null,
    lessonsToChest: null, nextLesson: null, lessonsToday: 0, turn: 0,
  };
  for (const nextLesson of LESSONS) for (let turn = 0; turn < 6; turn++) take({ ...base, nextLesson, turn });
  for (let hour = 0; hour < 24; hour++) for (let turn = 0; turn < 6; turn++) take({ ...base, daysAway: 1, hour, turn });
  for (const text of seen.keys()) checkText(text, MAX_LINE_WORDS, "pogoLine", failures);
  return seen.size;
}

function auditCheerTexts(failures: string[]): number {
  const seen = new Set<string>();
  for (const lesson of LESSONS) {
    for (const cheer of allCheers(lesson)) {
      const key = `${cheer.title}|${cheer.body}`;
      if (seen.has(key)) continue;
      seen.add(key);
      checkText(cheer.title, MAX_TITLE_WORDS, "reminder title", failures);
      checkText(cheer.body, MAX_BODY_WORDS, "reminder body", failures);
    }
  }
  return seen.size;
}

function localDay(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function checkSchedule(now: number, context: ReminderContext | undefined, failures: string[]): void {
  const slots = reminderSchedule(now, context);
  const label = `schedule @ ${new Date(now).toString().slice(0, 21)}`;
  const perDay = new Map<string, number>();
  if (new Set(slots.map((slot) => slot.tag)).size !== slots.length) failures.push(`${label}: duplicate tags`);
  if (slots.length > REMINDER_DAYS * REMINDER_SLOTS.length) failures.push(`${label}: too many reminders`);
  slots.forEach((slot, i) => {
    const at = new Date(slot.when);
    const minutes = at.getHours() * 60 + at.getMinutes();
    if (minutes < QUIET_BEFORE_MIN || minutes > QUIET_AFTER_MIN) failures.push(`${label}: slot in quiet hours ${at.toString()}`);
    if (slot.when <= now) failures.push(`${label}: slot in the past`);
    if (slot.when > now + (REMINDER_DAYS + 1) * DAY_MS) failures.push(`${label}: slot too far ahead`);
    if (i > 0 && slot.when <= slots[i - 1].when) failures.push(`${label}: slots out of order`);
    if (i > 0 && slot.cheer === slots[i - 1].cheer) failures.push(`${label}: same cheer twice in a row`);
    perDay.set(localDay(slot.when), (perDay.get(localDay(slot.when)) ?? 0) + 1);
  });
  for (const [day, count] of perDay) if (count > 2) failures.push(`${label}: ${count} reminders on ${day}`);
  if (perDay.size !== REMINDER_DAYS) failures.push(`${label}: reminders cover ${perDay.size} days, not ${REMINDER_DAYS}`);
  if (context?.playedToday && slots.some((slot) => localDay(slot.when) === localDay(now))) {
    failures.push(`${label}: reminder on a day he already played`);
  }
}

function auditSchedule(failures: string[]): number {
  const contexts: (ReminderContext | undefined)[] = [
    undefined,
    { questsOpenToday: 3, nextLesson: null, chestWaiting: false },
    { questsOpenToday: 0, nextLesson: LONGEST_LESSON, chestWaiting: false, playedToday: true },
    { questsOpenToday: 1, nextLesson: LONGEST_LESSON, chestWaiting: true, playedToday: false },
  ];
  const start = new Date(2026, 10, 15, 0, 0).getTime();
  let runs = 0;
  for (let step = 0; step < 48 * 3; step++) {
    for (const context of contexts) {
      checkSchedule(start + step * 30 * 60_000, context, failures);
      runs++;
    }
  }
  const lead = reminderSchedule(new Date(2026, 10, 15, 7, 0).getTime(), contexts[3])[0];
  if (lead?.cheer.title !== allCheers("x")[0].title) failures.push("schedule: a waiting chest does not lead the first reminder");
  return runs;
}

export function auditMotivators(): string[] {
  const failures: string[] = [];
  const lines = auditPogoLines(failures);
  const cheers = auditCheerTexts(failures);
  const runs = auditSchedule(failures);
  if (!failures.length) console.log(`Motivator audit: ${lines} Pogo lines, ${cheers} reminder texts, ${runs} schedules passed.`);
  return failures;
}

if (import.meta.main) {
  const failures = auditMotivators();
  if (failures.length) {
    console.error(failures.slice(0, 60).join("\n"));
    console.error(`${failures.length} motivator audit failures`);
    process.exit(1);
  }
}
