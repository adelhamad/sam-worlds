// Code Lab audit: plans every lesson many times and checks the contract in
// src/engine/code/types.ts, the lesson-shape rules and the miss-replacement
// rules. Run alone (`bun scripts/audit-code.ts`) or through audit-questions.ts.
import { CODE_UNITS, codeParams } from "../src/content/code/units";
import type { StageDef } from "../src/content/types";
import { codeGenStats, resetCodeGenStats } from "../src/engine/code/genStats";
import { codeKeys } from "../src/engine/code/grids";
import { slotDifficulty } from "../src/engine/code/lessonPlan";
import { codeSessionParams, planCodeLesson, type CodeSessionParams } from "../src/engine/code/planner";
import { CODE_TASKS, RUN_TASKS, floorPuzzle, makeSpec } from "../src/engine/code/puzzles";
import { codePayload, type CodeParams, type CodeTask } from "../src/engine/code/types";
import { generateQuestionSet, questionKeys } from "../src/engine/generators";
import type { GenContext, Question } from "../src/engine/generators/types";
import { kitPayload } from "../src/engine/kit/types";
import { mulberry32 } from "../src/engine/rng";
import { CODE } from "../src/strings/code";
import { checkCodeQuestion, tally, type Expect } from "./audit-code-payload";

const SEEDS = [1, 3, 7, 37, 101, 509, 1009, 12345, 54321, 99991, 424242, 7777777];
const DIFFICULTIES = [0.1, 0.5, 0.9];
const MISS_RUN = 60;

interface Stats {
  lessons: number;
  questions: number;
  replacements: number;
  sources: Record<string, number>;
  /** Kit replacements that had to reuse a card set (the template's pool ran out in a long miss run). */
  kitRepeats: number;
  /** Kit replacements (of all of them) that kept the missed answer. */
  kitSameAnswer: number;
  kitReplacements: number;
}

/** "trace", "kit:<template id>" … */
function sourceOf(q: Question): string {
  const code = codePayload(q);
  if (code) return code.task;
  const kit = kitPayload(q);
  return kit ? `kit:${kit.template}` : "?";
}

function ownSources(params: CodeParams): string[] {
  const spec = makeSpec(params);
  return [...spec.tasks, ...spec.kit.map((template) => `kit:${template.id}`)];
}

/** Reading code first (trace), then cards, then building — the order a lesson should open in. */
function gentleness(source: string): number {
  if (source.startsWith("kit:")) return 0.5;
  return source === "trace" ? 0 : CODE_TASKS.indexOf(source as CodeTask) + 1;
}
const runStyle = (source: string) => RUN_TASKS.includes(source as CodeTask);

/** Replacements may come from any difficulty (a fresh puzzle matters more), so only lessons check the size and the debug rule strictly. */
function expectFor(params: CodeParams, size: number, strictDebug: boolean): Expect {
  const spec = makeSpec(params);
  return { tasks: spec.tasks, templates: spec.kit.map((template) => template.id), size, strictDebug };
}

/** Lesson-shape rules: gentle opener, run-style finish, rotation, coverage, no three in a row. */
function checkShape(set: Question[], params: CodeParams, label: string, failures: string[]): void {
  const sources = set.map(sourceOf);
  const own = ownSources(params);
  const stray = sources.filter((source) => !own.includes(source));
  if (stray.length) failures.push(`${label}: sources outside the lesson: ${stray.join(", ")}`);
  const last = sources[sources.length - 1];
  const runs = own.filter(runStyle);
  if (runs.length && !runStyle(last)) failures.push(`${label}: last slot is ${last}, not a run-style puzzle`);
  const gentlest = Math.min(...own.filter((source) => own.length === 1 || source !== last).map(gentleness));
  if (gentleness(sources[0]) !== gentlest) failures.push(`${label}: opens with ${sources[0]}, not the gentlest source`);
  if (own.length > 1 && last === sources[0]) failures.push(`${label}: opener and closer are both ${last}`);
  for (let i = 2; i < sources.length; i++) {
    if (own.length > 1 && sources[i] === sources[i - 1] && sources[i] === sources[i - 2]) failures.push(`${label}: three ${sources[i]} in a row at slot ${i + 1}`);
  }
  for (const source of own) {
    const amount = sources.filter((used) => used === source).length;
    if (own.length <= 4 && set.length >= 8 && amount < 2) failures.push(`${label}: ${source} appears only ${amount} time(s)`);
    if (amount < 1) failures.push(`${label}: ${source} never appears`);
  }
}

/** Planned lessons never repeat; a kit replacement may reuse cards once its template's pool is used up. */
function checkIdentity(q: Question, label: string, seen: Set<string>, failures: string[], stats: Stats, inLesson: boolean): void {
  if (JSON.stringify(codeKeys(q)) !== JSON.stringify(questionKeys(q))) failures.push(`${label}: codeKeys drifted from questionKeys`);
  const kit = Boolean(kitPayload(q));
  if (q.dedupeKey?.includes("#") || questionKeys(q).some((key) => seen.has(key))) {
    if (kit && !inLesson) stats.kitRepeats++;
    else failures.push(`${label}: repeated or variant question ${q.dedupeKey}`);
  }
  questionKeys(q).forEach((key) => seen.add(key));
}

function checkLesson(stage: StageDef, seed: number, ctx: GenContext, failures: string[], stats: Stats): Question[] {
  const params = codeParams(stage);
  const label = `${stage.id} seed ${seed} d${ctx.difficulty}${ctx.easier ? " easier" : ""}`;
  const set = generateQuestionSet(stage.generator, stage.params, stage.questions, seed, ctx);
  stats.lessons++;
  stats.questions += set.length;
  if (set.length !== stage.questions) failures.push(`${label}: ${set.length}/${stage.questions} questions`);
  const again = generateQuestionSet(stage.generator, stage.params, stage.questions, seed, ctx);
  if (JSON.stringify(set) !== JSON.stringify(again)) failures.push(`${label}: not deterministic from the seed`);
  // A replay plans the same lesson whatever the session has already seen.
  const replay = generateQuestionSet(stage.generator, stage.params, stage.questions, seed, ctx, set.flatMap(questionKeys));
  if (JSON.stringify(set) !== JSON.stringify(replay)) failures.push(`${label}: a whole lesson depends on \`excluded\``);
  const seen = new Set<string>();
  set.forEach((q, index) => {
    if (q.id !== `code-${seed}-${index}`) failures.push(`${label}: id ${q.id}`);
    const difficulty = slotDifficulty(ctx.difficulty, index, set.length);
    const size = ctx.easier ? 4 : makeSpec(params).size;
    checkCodeQuestion(q, expectFor(params, size, difficulty < 0.6), `${label} #${index + 1}`, failures);
    stats.sources[sourceOf(q)] = (stats.sources[sourceOf(q)] ?? 0) + 1;
    checkIdentity(q, label, seen, failures, stats, true);
  });
  checkShape(set, params, label, failures);
  return set;
}

function replace(stage: StageDef, missed: Question, seed: number, ctx: GenContext, seen: Set<string>): Question | undefined {
  return generateQuestionSet(stage.generator, codeSessionParams(missed, stage.params), 1, seed, ctx, seen)[0];
}

/** Rule 1: "new values, same skill" — same task / template, nothing already shown. */
function checkReplacement(
  stage: StageDef, missed: Question, fresh: Question | undefined, ctx: { seen: Set<string>; label: string },
  failures: string[], stats: Stats,
): boolean {
  const { seen, label } = ctx;
  if (!fresh) {
    failures.push(`${label}: replacement came back empty`);
    return false;
  }
  const params = codeParams(stage);
  checkCodeQuestion(fresh, expectFor(params, makeSpec(params).size, false), label, failures);
  if (sourceOf(fresh) !== sourceOf(missed)) failures.push(`${label}: replacement switched ${sourceOf(missed)} → ${sourceOf(fresh)}`);
  const pinned = codeSessionParams(missed, stage.params) as unknown as CodeSessionParams;
  const pin = pinned.replace?.task ?? (pinned.replace?.template ? `kit:${pinned.replace.template}` : undefined);
  if (pin !== sourceOf(missed)) failures.push(`${label}: codeSessionParams pinned ${pin}, not ${sourceOf(missed)}`);
  checkIdentity(fresh, label, new Set(seen), failures, stats, false);
  if (kitPayload(missed)) {
    stats.kitReplacements++;
    if (fresh.answer === missed.answer) stats.kitSameAnswer++;
  }
  return true;
}

/** Replace every question of a lesson once, as the miss flow would. */
function checkReplacements(stage: StageDef, set: Question[], seed: number, ctx: GenContext, failures: string[], stats: Stats): void {
  const seen = new Set(set.flatMap(questionKeys));
  set.forEach((missed, index) => {
    const label = `${stage.id} seed ${seed} d${ctx.difficulty}${ctx.easier ? " easier" : ""} replace #${index + 1}`;
    const fresh = replace(stage, missed, seed * 31 + index, ctx, seen);
    stats.replacements++;
    checkReplacement(stage, missed, fresh, { seen, label }, failures, stats);
  });
  const [loose] = generateQuestionSet(stage.generator, stage.params, 1, seed + 5, ctx, seen);
  if (!loose || (codePayload(loose) && questionKeys(loose).some((key) => seen.has(key)))) failures.push(`${stage.id} seed ${seed}: unpinned replacement not fresh`);
}

/** A child who keeps missing: 60 replacements in a row never run dry, repeat, or leave the source. */
function checkMissRun(stage: StageDef, set: Question[], slot: number, seed: number, ctx: GenContext, failures: string[], stats: Stats): void {
  const seen = new Set(set.flatMap(questionKeys));
  let current = set[slot];
  for (let miss = 0; miss < MISS_RUN; miss++) {
    const label = `${stage.id} seed ${seed} d${ctx.difficulty} slot ${slot + 1} miss ${miss + 1}`;
    const easier = miss % 3 === 2;
    const next = replace(stage, current, seed * 977 + slot * 131 + miss, { ...ctx, easier }, seen);
    stats.replacements++;
    if (!checkReplacement(stage, current, next, { seen, label }, failures, stats)) return;
    questionKeys(next as Question).forEach((key) => seen.add(key));
    current = next as Question;
  }
}

/** The first slot of each source in the lesson. */
function missSlots(set: Question[]): number[] {
  const sources = set.map(sourceOf);
  return sources.map((_, index) => index).filter((index) => sources.indexOf(sources[index]) === index);
}

function checkStrings(failures: string[]): void {
  const samples = Object.values(CODE.engine).flatMap((entry) => (typeof entry === "string" ? [entry] : Object.values(entry)));
  if (samples.some((text) => /wrong|fail/i.test(text))) failures.push("CODE.engine: forbidden word");
  const long = samples.filter((text) => text.trim().split(/\s+/).length > 8);
  if (long.length) failures.push(`CODE.engine: more than 8 words: ${long.join(" | ")}`);
  if (samples.some((text) => !text.trim())) failures.push("CODE.engine: blank string");
}

/** The hand-built last-resort puzzle of every task must itself pass every check. */
function checkFloors(failures: string[]): void {
  const rng = mulberry32(2024);
  for (const task of CODE_TASKS) {
    for (const size of [4, 5, 6]) {
      const params: CodeParams = { tasks: [task], size };
      for (let round = 0; round < 8; round++) {
        const ctx = { difficulty: round / 7, easier: round % 2 === 0 };
        const q = floorPuzzle(task, makeSpec(params), rng, ctx);
        checkCodeQuestion(q, { tasks: [task], templates: [], size, strictDebug: true }, `floor ${task} size ${size} round ${round}`, failures);
      }
    }
  }
}

/** Hand-made odd lessons: the planner must still return exactly `count` distinct, valid puzzles. */
function checkOddLessons(failures: string[]): void {
  const odd: [string, CodeParams, number][] = [
    ["one task", { tasks: ["loop"], size: 4 }, 12],
    ["every task, tiny", { tasks: [...CODE_TASKS], size: 4 }, 24],
    ["every task, big", { tasks: [...CODE_TASKS], size: 6 }, 24],
    ["short", { tasks: ["trace", "debug"], size: 5 }, 2],
    ["nothing given", { tasks: [], size: 9 }, 8],
    ["unknown task", { tasks: ["dance" as CodeTask, "stars"], size: 3 }, 8],
  ];
  for (const [name, params, count] of odd) {
    for (const seed of SEEDS.slice(0, 6)) {
      for (const easier of [false, true]) {
        const label = `odd lesson "${name}" seed ${seed}${easier ? " easier" : ""}`;
        const set = planCodeLesson(params, count, seed, { difficulty: 0.5, easier });
        if (set.length !== count) failures.push(`${label}: ${set.length}/${count} questions`);
        const keys = set.flatMap(questionKeys);
        if (new Set(keys).size !== keys.length) failures.push(`${label}: repeated question`);
        const spec = makeSpec(params);
        set.forEach((q, index) => checkCodeQuestion(q, { tasks: spec.tasks, templates: [], size: easier ? 4 : spec.size, strictDebug: false }, `${label} #${index + 1}`, failures));
      }
    }
  }
}

function checkCurriculum(failures: string[]): void {
  const ids = CODE_UNITS.flatMap((unit) => unit.lessons.map((lesson) => lesson.id));
  if (new Set(ids).size !== ids.length || ids.some((id) => !/^code-u\d\d-l\d$/.test(id))) failures.push("Code Lab: stage ids malformed or repeated");
  const hues = CODE_UNITS.map((unit) => unit.hue);
  if (new Set(hues).size !== hues.length) failures.push("Code Lab: unit hues repeat");
  for (const unit of CODE_UNITS) {
    if (unit.blurb.trim().split(/\s+/).length > 8) failures.push(`${unit.id}: blurb over 8 words`);
    unit.lessons.forEach((lesson, slot) => {
      const champion = slot === unit.lessons.length - 1;
      if (lesson.questions !== (champion ? 10 : 8)) failures.push(`${lesson.id}: ${lesson.questions} questions`);
      if (lesson.generator !== "code") failures.push(`${lesson.id}: generator ${lesson.generator}`);
    });
  }
}

function runAudit(): { failures: string[]; stats: Stats } {
  const failures: string[] = [];
  const stats: Stats = { lessons: 0, questions: 0, replacements: 0, sources: {}, kitRepeats: 0, kitSameAnswer: 0, kitReplacements: 0 };
  checkStrings(failures);
  checkCurriculum(failures);
  checkFloors(failures);
  checkOddLessons(failures);
  resetCodeGenStats();
  tally.debugAmbiguous = 0;
  for (const stage of CODE_UNITS.flatMap((unit) => unit.lessons)) {
    for (const seed of SEEDS) {
      for (const difficulty of DIFFICULTIES) {
        for (const easier of [false, true]) {
          const ctx = { difficulty, easier };
          try {
            const set = checkLesson(stage, seed, ctx, failures, stats);
            checkReplacements(stage, set, seed, ctx, failures, stats);
            if (!easier && seed < 10) missSlots(set).forEach((slot) => checkMissRun(stage, set, slot, seed, ctx, failures, stats));
          } catch (error) {
            failures.push(`${stage.id} seed ${seed} d${difficulty}: ${String(error)}`);
          }
        }
      }
    }
  }
  return { failures, stats };
}

/** Failure messages (empty = pass). Hooked into scripts/audit-questions.ts. */
export function auditCode(): string[] {
  return runAudit().failures;
}

/** One line per task: how many were planned, and how hard the generator had to work. */
function report(stats: Stats): string {
  const lines = CODE_TASKS.map((task) => {
    const gen = codeGenStats().get(task) ?? { built: 0, tries: 0, gentle: 0, floor: 0 };
    const share = (amount: number) => `${((100 * amount) / Math.max(1, gen.built)).toFixed(2)}%`;
    return `  ${task.padEnd(11)} in lessons ${String(stats.sources[task] ?? 0).padStart(5)} · built ${String(gen.built).padStart(6)}` +
      ` · avg grids sampled ${(gen.tries / Math.max(1, gen.built)).toFixed(1).padStart(5)}` +
      ` · gentle fallback ${share(gen.gentle).padStart(6)} · floor ${share(gen.floor).padStart(6)}`;
  });
  const kit = Object.entries(stats.sources).filter(([source]) => source.startsWith("kit:"));
  const kitLine = kit.map(([source, amount]) => `${source.slice(4)} ${amount}`).join(", ");
  return `Per task:\n${lines.join("\n")}\nKit slots: ${kitLine}\n` +
    `Debug puzzles with more than one single-arrow fix (allowed at difficulty ≥ 0.6): ${tally.debugAmbiguous}\n` +
    `Kit replacements that reused cards (template pool used up): ${stats.kitRepeats}\n` +
    `Kit replacements that kept the missed answer: ${stats.kitSameAnswer}/${stats.kitReplacements}`;
}

if (import.meta.main) {
  const started = performance.now();
  const { failures, stats } = runAudit();
  console.log(report(stats));
  if (failures.length) {
    console.error(failures.slice(0, 60).join("\n"));
    console.error(`${failures.length} Code Lab audit failures`);
    process.exitCode = 1;
  } else {
    const seconds = ((performance.now() - started) / 1000).toFixed(1);
    console.log(`Code Lab audit passed: ${stats.lessons} lessons, ${stats.questions} questions, ${stats.replacements} replacements (${seconds}s)`);
  }
}
