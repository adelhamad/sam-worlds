// Tick Tock audit — checks ONE planned question against the contract in
// src/engine/tick/types.ts: answers recomputed with the clock helpers
// (src/engine/tick/clock.ts) and the kit helpers (src/engine/kit/answers.ts),
// times on the lesson's minutes, wording limits, no emoji. Used by scripts/audit-tick.ts.
import type { Question } from "../src/engine/generators/types";
import { orderAnswer, pairsAnswer } from "../src/engine/kit/answers";
import { kitPayload, type KitItem, type KitPayload, type KitTemplate } from "../src/engine/kit/types";
import { addMinutes, hasWords, sameTime, timeKey, timeWords, toMinutes } from "../src/engine/tick/clock";
import { crossesTwelve, type TickSpec } from "../src/engine/tick/times";
import { tickPayload, type ClockTime, type ReadPayload, type SetPayload, type TickTask } from "../src/engine/tick/types";
import { TICK } from "../src/strings/tick";
import { checkKitQuestion } from "./audit-kit-payload";

const PROMPT_WORDS = 8;
const CARD_CHARS = 28;
const LIST_CHARS = 60;
const EMOJI = /\p{Extended_Pictographic}/u;
const FORBIDDEN = /\b(wrong|fail|fails|failed|failing)\b/i;

export interface TickExpect {
  spec: TickSpec;
  tasks: TickTask[];
  templates: ReadonlyMap<string, KitTemplate>;
  /** Gentle slot (easier, or difficulty < 0.35): "later" puzzles must not cross 12 → 1. Undefined = not checked. */
  low?: boolean;
}

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const unique = (list: string[]) => new Set(list).size === list.length;
const validTime = (t: ClockTime | undefined) =>
  !!t && Number.isInteger(t.hour) && Number.isInteger(t.minute) && t.hour >= 1 && t.hour <= 12 && t.minute >= 0 && t.minute <= 59;
const written = (t: ClockTime, spec: TickSpec) => (spec.words && hasWords(t) ? timeWords(t) : timeKey(t));

/** Text a child sees: non-blank, no emoji, never "wrong" / "fail". */
export function checkText(text: string | undefined, what: string, out: string[], blankOk = false): void {
  if (typeof text !== "string" || (!blankOk && !text.trim())) out.push(`${what} is blank`);
  else if (EMOJI.test(text)) out.push(`${what} "${text}" has an emoji`);
  else if (FORBIDDEN.test(text)) out.push(`${what} "${text}" uses wrong / fail`);
}

function checkItems(items: KitItem[], what: string, chars: number, out: string[]): void {
  for (const item of items) {
    checkText(item.label, `${what} label`, out, item.art !== undefined);
    if (item.label.length > chars) out.push(`${what} label "${item.label}" is over ${chars} characters`);
    if ("emoji" in item) out.push(`${what} ${item.id} uses the deprecated emoji field`);
  }
}

/** The time a clock card shows (its id must be that time). */
function clockOf(item: KitItem, out: string[]): ClockTime | null {
  const art = item.art;
  if (art?.kind !== "clock") {
    out.push(`card ${item.id} is not a clock`);
    return null;
  }
  const time = { hour: art.hour, minute: art.minute };
  if (!validTime(time)) out.push(`clock ${item.id} shows ${art.hour}:${art.minute}`);
  if (item.id !== timeKey(time)) out.push(`clock id ${item.id} ≠ ${timeKey(time)}`);
  return time;
}

/** Card id "3:05" back to a time. */
function timeOfId(id: string): ClockTime | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(id);
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null;
}

function onLesson(time: ClockTime | null, spec: TickSpec, what: string, out: string[]): void {
  if (!time || !validTime(time)) out.push(`${what} is not a valid time`);
  else if (!spec.minutes.includes(time.minute)) out.push(`${what} ${timeKey(time)} is off the lesson's minutes`);
}

// ------------------------------------------------------------- own payloads

function checkRead(q: Question, p: ReadPayload, x: TickExpect, out: string[]): void {
  onLesson(p.shown, x.spec, "shown", out);
  if (p.task === "read" && p.jump !== 0) out.push(`read with jump ${p.jump}`);
  if (p.task === "later-read" && !x.spec.jumps.includes(p.jump)) out.push(`jump ${p.jump} is not one of the lesson's`);
  if (!validTime(p.shown)) return;
  const after = addMinutes(p.shown, p.jump);
  if (q.answer !== timeKey(after)) out.push(`answer ${q.answer} ≠ ${timeKey(after)}`);
  onLesson(after, x.spec, "answer", out);
  if (p.jump && x.low && crossesTwelve(p.shown, p.jump)) out.push(`gentle "later" crosses 12 → 1 (${timeKey(p.shown)} + ${p.jump})`);
}

function checkSet(q: Question, p: SetPayload, x: TickExpect, out: string[]): void {
  onLesson(p.target, x.spec, "target", out);
  if (!validTime(p.start)) out.push("start is not a valid time");
  else if (p.start.minute % x.spec.step) out.push(`start ${timeKey(p.start)} is off the step grid`);
  if (validTime(p.start) && validTime(p.target) && sameTime(p.start, p.target)) out.push("start = target");
  if (q.answer !== timeKey(p.target)) out.push(`answer ${q.answer} ≠ ${timeKey(p.target)}`);
  checkText(p.say, "say", out);
  if (p.task === "set") {
    if (p.jump !== 0) out.push(`set with jump ${p.jump}`);
    if (p.say !== timeKey(p.target) && p.say !== timeWords(p.target)) out.push(`say "${p.say}" is not the target`);
    return;
  }
  if (!x.spec.jumps.includes(p.jump)) out.push(`jump ${p.jump} is not one of the lesson's`);
  onLesson(p.start, x.spec, "start", out);
  if (validTime(p.start) && !sameTime(addMinutes(p.start, p.jump), p.target)) out.push("target ≠ start + jump");
  if (validTime(p.start) && x.low && crossesTwelve(p.start, p.jump)) out.push(`gentle "later" crosses 12 → 1 (${timeKey(p.start)} + ${p.jump})`);
}

// ------------------------------------------------------------- kit payloads built by the planner

function checkMatch(q: Question, p: Extract<KitPayload, { tour: "kit-pairs" }>, x: TickExpect, out: string[]): void {
  const left = p.left.map((item) => clockOf(item, out));
  const leftIds = p.left.map((item) => item.id);
  if (p.left.length < 3 || p.left.length > 5) out.push(`${p.left.length} pairs`);
  if (!unique(leftIds) || !unique(p.right.map((item) => item.id))) out.push("repeated card id");
  if (!unique(p.right.map((item) => item.label))) out.push("two written times say the same");
  left.forEach((time, i) => onLesson(time, x.spec, `clock ${i + 1}`, out));
  for (const [i, time] of left.entries()) {
    const partner = p.right.find((item) => item.id === leftIds[i]);
    if (!partner) out.push(`clock ${leftIds[i]} has no partner`);
    else if (time && partner.label !== written(time, x.spec)) out.push(`partner of ${leftIds[i]} says "${partner.label}"`);
  }
  const decoys = p.right.filter((item) => !leftIds.includes(item.id));
  if (decoys.length > 1) out.push(`${decoys.length} decoys`);
  for (const decoy of decoys) {
    const time = timeOfId(decoy.id);
    if (!time || decoy.label !== written(time, x.spec)) out.push(`decoy ${decoy.id} says "${decoy.label}"`);
  }
  checkItems([...p.left, ...p.right], "match card", CARD_CHARS, out);
  if (q.answer !== pairsAnswer(leftIds)) out.push("answer is not pairsAnswer(left ids)");
}

/** The one option the question names (by the prompt for pick-clock, by the hero clock for pick-words). */
function checkPick(q: Question, p: Extract<KitPayload, { tour: "kit-pick" }>, task: TickTask, x: TickExpect, out: string[]): void {
  if (p.options.length < 3 || p.options.length > 4) out.push(`${p.options.length} options`);
  if (!unique(p.options.map((item) => item.id))) out.push("repeated option");
  if (p.guessable !== true) out.push("pick is not guessable");
  let right: KitItem[];
  if (task === "pick-clock") {
    if (p.layout !== "grid") out.push(`layout ${p.layout}`);
    const times = p.options.map((item) => clockOf(item, out));
    right = p.options.filter((_, i) => times[i] && q.prompt === TICK.engine.pickClock(written(times[i] as ClockTime, x.spec)));
    checkItems(p.options, "clock option", CARD_CHARS, out);
  } else {
    if (p.layout !== "list") out.push(`layout ${p.layout}`);
    const hero = p.hero ? clockOf({ ...p.hero, id: p.hero.art?.kind === "clock" ? timeKey(p.hero.art) : p.hero.id }, out) : null;
    if (!hero) out.push("no hero clock");
    right = hero ? p.options.filter((item) => item.label === written(hero, x.spec)) : [];
    if (!unique(p.options.map((item) => item.label))) out.push("two options say the same");
    if (p.options.some((item) => !timeOfId(item.id))) out.push("an option id is not a time");
    checkItems(p.options, "words option", LIST_CHARS, out);
  }
  if (right.length !== 1) out.push(`${right.length} right options (need exactly 1)`);
  else if (q.answer !== right[0].id) out.push(`answer ${q.answer} is not the right option ${right[0].id}`);
  onLesson(timeOfId(q.answer), x.spec, "answer", out);
}

function checkOrder(q: Question, p: Extract<KitPayload, { tour: "kit-order" }>, x: TickExpect, out: string[]): void {
  const times = p.cards.map((item) => clockOf(item, out)).filter((time): time is ClockTime => time !== null);
  if (p.cards.length < 3 || p.cards.length > 5) out.push(`${p.cards.length} cards`);
  if (!unique(p.cards.map((item) => item.id))) out.push("two cards show the same time");
  times.forEach((time, i) => onLesson(time, x.spec, `card ${i + 1}`, out));
  if (times.some((time) => time.hour === 12)) out.push("a 12:xx card makes earliest-first ambiguous");
  const sorted = [...times].sort((a, b) => toMinutes(a) - toMinutes(b));
  if (q.answer !== orderAnswer(sorted.map(timeKey))) out.push("answer is not earliest → latest");
  const answer = q.answer.split(">").map(timeOfId);
  if (answer.some((time, i) => !time || (i > 0 && toMinutes(time) <= toMinutes(answer[i - 1] as ClockTime)))) out.push("answer times are not strictly increasing");
  if (orderAnswer(p.cards.map((item) => item.id)) === q.answer) out.push("cards arrive already in order");
  checkItems(p.cards, "order card", CARD_CHARS, out);
}

const KIT_TASKS: Partial<Record<string, TickTask>> = { match: "match", "pick-clock": "pick-clock", "pick-words": "pick-words", order: "order" };

function checkBuiltKit(q: Question, p: KitPayload, x: TickExpect, out: string[]): TickTask | null {
  const task = KIT_TASKS[p.template];
  if (!task) return null;
  checkText(p.explain, "explain", out);
  if (!q.dedupeKey?.startsWith(`tick:${task}:`)) out.push(`dedupeKey ${q.dedupeKey}`);
  if (p.tour === "kit-pairs" && task === "match") checkMatch(q, p, x, out);
  else if (p.tour === "kit-pick" && (task === "pick-clock" || task === "pick-words")) checkPick(q, p, task, x, out);
  else if (p.tour === "kit-order" && task === "order") checkOrder(q, p, x, out);
  else out.push(`payload ${p.tour} for task ${task}`);
  return task;
}

/** "read", "match", "kit:day-parts" … — the source a question came from. */
export function sourceOf(q: Question): string {
  const tick = tickPayload(q);
  if (tick) return tick.task;
  const kit = kitPayload(q);
  if (!kit) return "?";
  return KIT_TASKS[kit.template] ?? `kit:${kit.template}`;
}

function checkCommon(q: Question, out: string[]): void {
  if (q.inputMode !== "tour" || q.repeatable !== true || q.choices.length) out.push("must be inputMode tour, repeatable, no choices");
  checkText(q.prompt, "prompt", out);
  checkText(q.hint, "hint", out);
  if (!q.answer.trim()) out.push("blank answer");
  if (words(q.prompt) > PROMPT_WORDS) out.push(`prompt "${q.prompt}" has ${words(q.prompt)} words`);
}

/** Validate one question of a tick lesson; returns its source ("read", "kit:day-parts"…) or null when malformed. */
export function checkTickQuestion(q: Question, x: TickExpect, label: string, failures: string[]): string | null {
  const out: string[] = [];
  checkCommon(q, out);
  const source = sourceOf(q);
  const tick = tickPayload(q);
  const kit = kitPayload(q);
  try {
    if (tick) {
      if (!q.dedupeKey?.startsWith(`tick:${tick.task}:`)) out.push(`dedupeKey ${q.dedupeKey}`);
      if (tick.step !== x.spec.step) out.push(`step ${tick.step} ≠ ${x.spec.step}`);
      if (tick.tour === "tick-read" && (tick.task === "read" || tick.task === "later-read")) checkRead(q, tick, x, out);
      else if (tick.tour === "tick-set" && (tick.task === "set" || tick.task === "later-set")) checkSet(q, tick, x, out);
      else out.push(`${tick.tour} for task ${tick.task}`);
    } else if (kit && !checkBuiltKit(q, kit, x, out)) {
      const text = JSON.stringify(kit);
      if (EMOJI.test(text) || FORBIDDEN.test(text) || text.includes('"emoji"')) out.push("kit card text has an emoji, an emoji field, or wrong / fail");
      const before = failures.length;
      checkKitQuestion(q, x.templates, label, failures);
      if (failures.length > before) return null;
    } else if (!kit) out.push("neither a tick nor a kit question");
  } catch (error) {
    out.push(`malformed payload (${String(error)})`);
  }
  if (source !== "?" && !source.startsWith("kit:") && !x.tasks.includes(source as TickTask)) out.push(`task ${source} is not in the lesson`);
  failures.push(...out.map((message) => `${label} [${source}]: ${message}`));
  return out.length ? null : source;
}
