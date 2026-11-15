// Language-course audit: checks what the authors wrote (audit-lang-seed.ts —
// the rules of docs/LANGUAGES.md) and then plans every lesson many times and
// checks every question the planner makes from it (audit-lang-question.ts).
// Run alone (`bun scripts/audit-lang.ts [courseId]`) or through audit-questions.ts.
import { defineLangCourse, langParams } from "../src/content/langCourse";
import { LANG_SEEDS } from "../src/content/langCourses";
import { lessonTasks, planLangLesson, langSessionParams } from "../src/engine/lang/planner";
import { langPayload, type LangParams, type LangPayload } from "../src/engine/lang/types";
import type { GenContext, GeneratorParams, Question } from "../src/engine/generators/types";
import { checkQuestion } from "./audit-lang-question";
import { checkSeed } from "./audit-lang-seed";

const SEEDS = [1, 3, 7, 37, 101, 509, 1009, 12345];
const DIFFICULTIES = [0.1, 0.5, 0.9];
/** Questions of each planned lesson that are missed on purpose. */
const MISSES = 4;

interface Stats { lessons: number; questions: number; replacements: number; tasks: Record<string, number> }

interface Run {
  where: string;
  params: LangParams;
  stats: Stats;
  failures: string[];
}

function shownIn(payload: LangPayload): string[] {
  if (payload.tour === "lang-pairs") return payload.left.map((card) => card.id);
  if (payload.tour === "lang-choose") return [payload.model.id, ...payload.options.map((card) => card.id)];
  return [payload.model.id];
}

/** A miss: the replacement keeps the task and is a valid question. */
function checkReplacement(run: Run, question: Question, seed: number, seen: Set<string>): void {
  const payload = langPayload(question);
  if (!payload) return;
  const pinned = langSessionParams(question, run.params as unknown as GeneratorParams) as unknown as LangParams;
  const next = planLangLesson(pinned, 1, seed + 17, { difficulty: 0.3, easier: true }, seen)[0];
  const nextPayload = langPayload(next);
  run.stats.replacements += 1;
  if (!nextPayload) run.failures.push(`${run.where}: replacement is not a lang question`);
  else if (nextPayload.task !== payload.task) run.failures.push(`${run.where}: replacement of ${payload.task} is ${nextPayload.task}`);
  else run.failures.push(...checkQuestion(`${run.where} replacement ${nextPayload.task}`, next, nextPayload, run.params));
}

function checkOnePlan(run: Run, plan: Question[], count: number, seed: number): void {
  const { params, stats, failures, where } = run;
  if (plan.length !== count) failures.push(`${where}: planned ${plan.length} of ${count}`);
  const seen = new Set<string>();
  const met = new Set<string>();
  const used: Record<string, number> = {};
  for (const question of plan) {
    const payload = langPayload(question);
    if (!payload) { failures.push(`${where}: not a lang question`); continue; }
    stats.questions += 1;
    stats.tasks[payload.task] = (stats.tasks[payload.task] ?? 0) + 1;
    used[payload.task] = (used[payload.task] ?? 0) + 1;
    failures.push(...checkQuestion(`${where} ${payload.task}`, question, payload, params));
    shownIn(payload).forEach((id) => met.add(id));
    seen.add(question.dedupeKey ?? question.prompt);
  }
  for (const phrase of params.teach) if (!met.has(phrase.id)) failures.push(`${where}: new phrase "${phrase.id}" never appears in the lesson`);
  const able = lessonTasks(params).length;
  const kinds = Object.keys(used).length;
  if (able >= 3 && kinds < 3) failures.push(`${where}: only ${kinds} kinds of question`);
  if (able >= 3 && Math.max(...Object.values(used)) > Math.ceil(count * 0.6)) failures.push(`${where}: one kind of question fills most of the lesson`);
  for (const question of plan.slice(0, MISSES)) checkReplacement(run, question, seed, seen);
}

function checkStage(stageId: string, params: LangParams, count: number, stats: Stats, failures: string[]): void {
  if (!lessonTasks(params).length) { failures.push(`${stageId}: nothing to ask (no usable phrases, scenes or letters)`); return; }
  for (const seed of SEEDS) {
    for (const difficulty of DIFFICULTIES) {
      const ctx: GenContext = { difficulty, easier: false };
      const run: Run = { where: `${stageId} seed ${seed} d${difficulty}`, params, stats, failures };
      try {
        stats.lessons += 1;
        checkOnePlan(run, planLangLesson(params, count, seed, ctx), count, seed);
      } catch (error) {
        failures.push(`${run.where}: ${String(error)}`);
        return;
      }
    }
  }
}

export function auditLang(only?: string): string[] {
  const failures: string[] = [];
  const stats: Stats = { lessons: 0, questions: 0, replacements: 0, tasks: {} };
  for (const seed of LANG_SEEDS.filter((item) => !only || item.id === only)) {
    if (!checkSeed(seed, failures)) continue; // fix what was written before judging what is planned
    const course = defineLangCourse(seed);
    for (const stage of course.world.stages) checkStage(stage.id, langParams(stage), stage.questions, stats, failures);
    const phrases = seed.packs.reduce((sum, pack) => sum + pack.phrases.length, 0);
    const scenes = seed.packs.reduce((sum, pack) => sum + pack.scenes.length, 0);
    console.log(`Lang audit ${seed.id}: ${seed.packs.length} units, ${course.world.stages.length} lessons, ${phrases} phrases, ${scenes} scenes`);
  }
  console.log(`Lang audit: ${stats.lessons} lessons planned, ${stats.questions} questions, ${stats.replacements} replacements; tasks ${JSON.stringify(stats.tasks)}`);
  return failures;
}

if (import.meta.main) {
  const failures = auditLang(process.argv[2]);
  for (const failure of failures.slice(0, 80)) console.error(`  ${failure}`);
  if (failures.length) {
    console.error(`${failures.length} lang audit failures`);
    process.exit(1);
  }
  console.log("Lang audit passed");
}
