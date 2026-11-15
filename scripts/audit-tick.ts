// Tick Tock audit: plans every lesson many times and checks the contract in
// src/engine/tick/types.ts (payloads: audit-tick-payload.ts), the lesson-shape
// rules and the miss-replacement rules. Run alone (`bun scripts/audit-tick.ts`)
// or through audit-questions.ts.
import { TICK_BANK } from "../src/content/tick/bank";
import { TICK_UNITS, tickParams } from "../src/content/tick/units";
import type { StageDef } from "../src/content/types";
import { questionKeys } from "../src/engine/generators";
import type { GenContext, Question } from "../src/engine/generators/types";
import { subjectKey } from "../src/engine/kit/sample";
import { slotDifficulty } from "../src/engine/tick/lessonPlan";
import { planTickLesson, tickSessionParams } from "../src/engine/tick/planner";
import { closerRank, gentleness, lessonSources, makeSpec, sourceKey, type LessonSpec } from "../src/engine/tick/sources";
import { TICK_TASKS } from "../src/engine/tick/times";
import type { TickParams } from "../src/engine/tick/types";
import { checkTickQuestion, checkText, sourceOf, type TickExpect } from "./audit-tick-payload";

const SEEDS = [1, 3, 7, 37, 101, 509, 1009, 12345, 54321, 99991];
const DIFFICULTIES = [0.1, 0.5, 0.9];
const MISS_RUN = 60;
const PROMPT_WORDS = 8;
/** Tasks whose answer is one time (the "no same answer twice" rule applies). */
const ONE_TIME = new Set(["read", "set", "pick-clock", "pick-words", "later-read", "later-set"]);

interface Stats {
  lessons: number;
  questions: number;
  replacements: number;
  variants: number;
  keptAnswer: number;
  sources: Record<string, number>;
}

interface Lesson {
  stage: StageDef;
  params: TickParams;
  spec: LessonSpec;
  own: string[];
}

const variant = (q: Question) => q.dedupeKey?.includes("#") ?? false;

function expectFor(lesson: Lesson, low?: boolean): TickExpect {
  return { spec: lesson.spec.time, tasks: lesson.spec.tasks, templates: new Map(lesson.spec.kit.map((t) => [t.id, t])), low };
}

// --------------------------------------------------------------- static

function checkStatic(lessons: Lesson[], failures: string[]): void {
  const uses = new Map<string, number>();
  for (const { stage, params, spec } of lessons) {
    const step = spec.time.step;
    if (params.step !== step) failures.push(`${stage.id}: step ${params.step} is not a valid step`);
    if ((params.focus ?? []).some((m) => m % step)) failures.push(`${stage.id}: focus ${params.focus?.join(",")} is off the step ${step}`);
    if (spec.time.jumps.some((j) => j % step)) failures.push(`${stage.id}: a jump is not a multiple of the step ${step}`);
    if (params.tasks.some((task) => !TICK_TASKS.includes(task))) failures.push(`${stage.id}: unknown task`);
    if (params.tasks.some((task) => task.startsWith("later")) && !params.jumps?.length) failures.push(`${stage.id}: "later" tasks without jumps`);
    (params.kit ?? []).forEach((t) => uses.set(t.id, (uses.get(t.id) ?? 0) + 1));
  }
  for (const [id, n] of uses) if (n > 3) failures.push(`template "${id}" is listed in ${n} lessons (max 3)`);
  for (const t of TICK_BANK) {
    if (TICK_TASKS.includes(t.id as never)) failures.push(`bank template id "${t.id}" clashes with a task name`);
    const out: string[] = [];
    checkText(t.prompt, "prompt", out);
    checkText(t.explain, "explain", out);
    if (t.prompt.trim().split(/\s+/).length > PROMPT_WORDS) out.push(`prompt "${t.prompt}" is over ${PROMPT_WORDS} words`);
    if (/\p{Extended_Pictographic}/u.test(JSON.stringify(t)) || JSON.stringify(t).includes('"emoji"')) out.push("has an emoji");
    failures.push(...out.map((message) => `bank "${t.id}": ${message}`));
  }
}

// -------------------------------------------------------------- lessons

/** Lesson-shape rules: gentle opener, hands-on finish, rotation, coverage, no three in a row. */
function checkShape(lesson: Lesson, sources: string[], label: string, failures: string[]): void {
  const { own } = lesson;
  const all = lessonSources(lesson.spec);
  const stray = sources.filter((source) => !own.includes(source));
  if (stray.length) failures.push(`${label}: sources outside the lesson: ${stray.join(", ")}`);
  const finishers = all.filter((source) => closerRank(source) >= 0).sort((a, b) => closerRank(b) - closerRank(a));
  const last = sources[sources.length - 1];
  if (finishers.length && last !== sourceKey(finishers[0])) failures.push(`${label}: last slot is ${last}, not ${sourceKey(finishers[0])}`);
  const gentlest = Math.min(...all.filter((source) => all.length === 1 || sourceKey(source) !== last).map(gentleness));
  const opener = all.find((source) => sourceKey(source) === sources[0]);
  if (!opener || gentleness(opener) !== gentlest) failures.push(`${label}: opens with ${sources[0]}, not the gentlest source`);
  for (let i = 2; i < sources.length; i++) {
    if (own.length > 1 && sources[i] === sources[i - 1] && sources[i] === sources[i - 2]) failures.push(`${label}: three ${sources[i]} in a row at slot ${i + 1}`);
  }
  for (const source of own) {
    const amount = sources.filter((used) => used === source).length;
    if (own.length <= 4 && sources.length >= 8 && amount < 2) failures.push(`${label}: ${source} appears only ${amount} time(s)`);
    if (amount < 1 && sources.length >= own.length) failures.push(`${label}: ${source} never appears`);
  }
}

function checkUniqueness(set: Question[], sources: string[], label: string, failures: string[]): void {
  const keys = new Set<string>();
  const answers = new Set<string>();
  set.forEach((q, i) => {
    if (keys.has(q.dedupeKey ?? "")) failures.push(`${label}: repeated dedupeKey ${q.dedupeKey}`);
    keys.add(q.dedupeKey ?? "");
    if (variant(q)) failures.push(`${label}: lesson ran out of fresh puzzles (${q.dedupeKey})`);
    if (!ONE_TIME.has(sources[i])) return;
    const answer = `${sources[i]}|${q.answer}`;
    if (answers.has(answer)) failures.push(`${label}: ${sources[i]} asks for ${q.answer} twice`);
    answers.add(answer);
  });
}

function checkLesson(lesson: Lesson, seed: number, ctx: GenContext, failures: string[], stats: Stats): Question[] {
  const { stage, params } = lesson;
  const label = `${stage.id} seed ${seed} d${ctx.difficulty}${ctx.easier ? " easier" : ""}`;
  const set = planTickLesson(params, stage.questions, seed, ctx);
  stats.lessons++;
  stats.questions += set.length;
  if (set.length !== stage.questions) failures.push(`${label}: ${set.length}/${stage.questions} questions`);
  const again = planTickLesson(params, stage.questions, seed, ctx, set.flatMap(questionKeys));
  if (JSON.stringify(set) !== JSON.stringify(again)) failures.push(`${label}: not deterministic from the seed`);
  const sources = set.map((q, index) => {
    if (q.id !== `tick-${seed}-${index}`) failures.push(`${label}: id ${q.id}`);
    const low = ctx.easier || slotDifficulty(ctx.difficulty, index, set.length) < 0.35;
    checkTickQuestion(q, expectFor(lesson, low), `${label} #${index + 1}`, failures);
    const source = sourceOf(q);
    stats.sources[source] = (stats.sources[source] ?? 0) + 1;
    return source;
  });
  checkShape(lesson, sources, label, failures);
  checkUniqueness(set, sources, label, failures);
  return set;
}

// ---------------------------------------------------------- replacements

function replace(lesson: Lesson, missed: Question | undefined, seed: number, ctx: GenContext, seen: Set<string>): Question | undefined {
  const params = missed ? tickSessionParams(missed, lesson.params as never) : lesson.params;
  return planTickLesson(params as unknown as TickParams, 1, seed, ctx, seen)[0];
}

/** Rule 1: the same source, a subject the session has not shown, a different answer when possible. */
function checkReplacement(
  lesson: Lesson, missed: Question, fresh: Question | undefined, seen: Set<string>, label: string, failures: string[], stats: Stats,
): Question | null {
  stats.replacements++;
  if (!fresh) {
    failures.push(`${label}: replacement came back empty`);
    return null;
  }
  const source = checkTickQuestion(fresh, expectFor(lesson), label, failures);
  if (!source) return null;
  const want = sourceOf(missed);
  if (source !== want) failures.push(`${label}: replacement of ${want} is ${source}`);
  if (seen.has(subjectKey(fresh.dedupeKey ?? ""))) failures.push(`${label}: replacement repeats a shown subject ${fresh.dedupeKey}`);
  else if (!variant(fresh) && questionKeys(fresh).some((key) => seen.has(key))) failures.push(`${label}: replacement repeats a shown question`);
  if (variant(fresh)) stats.variants++;
  if (fresh.answer === missed.answer) stats.keptAnswer++;
  return fresh;
}

function checkReplacements(lesson: Lesson, set: Question[], seed: number, ctx: GenContext, failures: string[], stats: Stats): void {
  const seen = new Set(set.flatMap(questionKeys));
  set.forEach((missed, index) => {
    const label = `${lesson.stage.id} seed ${seed} d${ctx.difficulty} replace #${index + 1}`;
    const fresh = checkReplacement(lesson, missed, replace(lesson, missed, seed * 31 + index, ctx, seen), seen, label, failures, stats);
    if (fresh && !variant(fresh) && fresh.answer === missed.answer && ONE_TIME.has(sourceOfTask(fresh))) {
      failures.push(`${label}: replacement kept the missed answer ${missed.answer}`);
    }
  });
  const loose = replace(lesson, undefined, seed + 5, ctx, seen);
  if (!loose || questionKeys(loose).some((key) => seen.has(key))) failures.push(`${lesson.stage.id} seed ${seed}: unpinned replacement not fresh`);
}

const sourceOfTask = (q: Question) => (q.dedupeKey?.startsWith("tick:") ? q.dedupeKey.split(":")[1] : "kit");

/** A child who keeps missing: 60 replacements in a row never come back empty or repeat a subject. */
function checkMissRun(lesson: Lesson, set: Question[], seed: number, ctx: GenContext, failures: string[], stats: Stats): void {
  const seen = new Set(set.flatMap(questionKeys));
  let current = set[seed % set.length];
  for (let miss = 0; miss < MISS_RUN; miss++) {
    const label = `${lesson.stage.id} seed ${seed} miss ${miss + 1}`;
    const level = { ...ctx, easier: miss % 3 === 2 };
    const next = checkReplacement(lesson, current, replace(lesson, current, seed * 977 + miss, level, seen), seen, label, failures, stats);
    if (!next) return;
    questionKeys(next).forEach((key) => seen.add(key));
    current = next;
  }
}

function auditLesson(lesson: Lesson, failures: string[], stats: Stats): void {
  for (const seed of SEEDS) {
    for (const difficulty of DIFFICULTIES) {
      for (const easier of [false, true]) {
        const ctx = { difficulty, easier };
        try {
          const set = checkLesson(lesson, seed, ctx, failures, stats);
          checkReplacements(lesson, set, seed, ctx, failures, stats);
          if (!easier && seed < 40) checkMissRun(lesson, set, seed, ctx, failures, stats);
        } catch (error) {
          failures.push(`${lesson.stage.id} seed ${seed} d${difficulty}: ${String(error)}`);
        }
      }
    }
  }
}

function lessons(): Lesson[] {
  return TICK_UNITS.flatMap((unit) => unit.lessons).map((stage) => {
    const params = tickParams(stage);
    const spec = makeSpec(params);
    return { stage, params, spec, own: lessonSources(spec).map(sourceKey) };
  });
}

function runAudit(): { failures: string[]; stats: Stats } {
  const failures: string[] = [];
  const stats: Stats = { lessons: 0, questions: 0, replacements: 0, variants: 0, keptAnswer: 0, sources: {} };
  const all = lessons();
  checkStatic(all, failures);
  for (const lesson of all) {
    if (lesson.stage.generator !== "tick") failures.push(`${lesson.stage.id}: generator ${lesson.stage.generator}`);
    auditLesson(lesson, failures, stats);
  }
  return { failures, stats };
}

/** Failure messages (empty = pass). Hooked into scripts/audit-questions.ts. */
export function auditTick(): string[] {
  return runAudit().failures;
}

if (import.meta.main) {
  const { failures, stats } = runAudit();
  const counts = Object.entries(stats.sources).sort((a, b) => b[1] - a[1]).map(([source, n]) => `${source} ${n}`).join(", ");
  console.log(`Tick: ${lessons().length} lessons, ${stats.lessons} planned runs, ${stats.questions} questions, ${stats.replacements} replacements ` +
    `(${stats.variants} numbered variants, ${stats.keptAnswer} kept the missed answer)`);
  console.log(`Per source: ${counts}`);
  if (failures.length) {
    console.error(failures.slice(0, 80).join("\n"));
    console.error(`${failures.length} Tick Tock audit failures`);
    process.exitCode = 1;
  } else {
    console.log("Tick Tock audit passed");
  }
}
