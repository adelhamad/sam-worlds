// Course Kit audit: checks EVERY kit template reachable from COURSES — kit
// lessons (generator "kit") and lessons of other courses that mix kit templates
// in (`params.kit`, Code Lab) — plus the reference course authors copy
// (src/content/_template/course.ts, not registered in the app). Static rules on the data (audit-kit-static.ts),
// then many planned lessons, replacements and long miss runs per lesson
// (payload contract: audit-kit-payload.ts). Run alone (`bun scripts/audit-kit.ts`)
// or through audit-questions.ts.
import { TEMPLATE_COURSE } from "../src/content/_template/course";
import { COURSES } from "../src/content/courses";
import type { StageDef } from "../src/content/types";
import { generateQuestionSet, questionKeys } from "../src/engine/generators";
import type { GenContext, Question } from "../src/engine/generators/types";
import { kitSessionParams, planKitLesson } from "../src/engine/kit/planner";
import { kitKeys, sampleTemplate, subjectKey, templateOf } from "../src/engine/kit/sample";
import { mulberry32 } from "../src/engine/rng";
import type { KitParams, KitSlide, KitTemplate } from "../src/engine/kit/types";
import { templateVariety } from "../src/engine/kit/variety";
import { THIN_LESSONS, THIN_PICTURES } from "./audit-kit-fixtures";
import { checkKitQuestion } from "./audit-kit-payload";
import { checkIntro, checkTemplate } from "./audit-kit-static";

const SEEDS = [1, 3, 7, 37, 101, 509, 1009, 12345, 54321, 99991];
const DIFFICULTIES = [0.1, 0.5, 0.9];
const MISS_RUN = 60;
/** Brute-force draws used to prove a template really had nothing fresh left. */
const PROOF_DRAWS = 3000;

/** One lesson that draws kit questions. `full` = a kit lesson the planner plans whole. */
interface KitStage {
  course: string;
  stage: StageDef;
  main: KitTemplate[];
  review: KitTemplate[];
  intro?: KitSlide[];
  full: boolean;
}

interface Stats {
  courses: Set<string>;
  lessons: number;
  questions: number;
  replacements: number;
}

const list = (value: unknown): KitTemplate[] => (Array.isArray(value) ? (value as KitTemplate[]) : []);

/** The registered courses plus the unregistered reference course. */
const AUDITED = [...COURSES, TEMPLATE_COURSE];

function kitStages(): KitStage[] {
  const out: KitStage[] = [];
  for (const course of AUDITED) {
    for (const stage of course.world.stages) {
      const params = stage.params as unknown as Partial<KitParams> & { kit?: unknown };
      if (stage.generator === "kit") {
        out.push({ course: course.id, stage, main: list(params.templates), review: list(params.review), intro: params.intro, full: true });
      } else if (Array.isArray(params.kit) && params.kit.length) {
        out.push({ course: course.id, stage, main: list(params.kit), review: [], full: false });
      }
    }
  }
  return out;
}

const templatesOf = (entry: KitStage) => new Map([...entry.review, ...entry.main].map((t) => [t.id, t]));
const paramsOf = (entry: KitStage) => (entry.full ? entry.stage.params : { templates: entry.main, review: [] });

// --------------------------------------------------------------- static

/** Template ids are unique per course; every template passes the data rules once. */
function checkStatic(stages: KitStage[], failures: string[]): Map<string, KitTemplate> {
  const all = new Map<string, KitTemplate>();
  const byCourse = new Map<string, Map<string, KitTemplate>>();
  for (const entry of stages) {
    const known = byCourse.get(entry.course) ?? new Map<string, KitTemplate>();
    byCourse.set(entry.course, known);
    for (const template of [...entry.main, ...entry.review]) {
      const other = known.get(template.id);
      if (other && other !== template && JSON.stringify(other) !== JSON.stringify(template)) {
        failures.push(`${entry.course}: two different templates share the id "${template.id}"`);
      }
      if (!other) {
        known.set(template.id, template);
        all.set(`${entry.course}/${template.id}`, template);
        checkTemplate(template, entry.course, failures);
      }
    }
    if (entry.full) checkIntro(entry.intro, entry.stage.id, failures);
    if (entry.full && !entry.main.length && !entry.review.length) failures.push(`${entry.stage.id}: kit lesson without templates`);
  }
  return all;
}

// -------------------------------------------------------------- lessons

const distinct = (entry: KitStage) => new Set([...entry.main, ...entry.review].map((t) => t.id)).size;

/** Lesson-shape rules: coverage, no three in a row, review placement, pairs finale. */
function checkShape(entry: KitStage, set: Question[], label: string, failures: string[]): void {
  const ids = set.map(templateOf);
  const main = new Set(entry.main.map((t) => t.id));
  if (distinct(entry) >= 2) {
    for (let i = 2; i < ids.length; i++) {
      if (ids[i] === ids[i - 1] && ids[i] === ids[i - 2]) failures.push(`${label}: "${ids[i]}" three times in a row (slots ${i - 1}–${i + 1})`);
    }
  }
  if (!main.size) return;
  for (const id of main) if (set.length >= main.size + 2 && !ids.includes(id)) failures.push(`${label}: template "${id}" never appears`);
  ids.slice(0, 2).forEach((id, index) => {
    if (!main.has(id)) failures.push(`${label}: opener ${index + 1} is review ("${id}")`);
  });
  const reviewed = ids.filter((id) => !main.has(id)).length;
  if (entry.review.length && set.length >= 4 && (reviewed < 1 || reviewed > Math.ceil(set.length / 3))) {
    failures.push(`${label}: ${reviewed}/${set.length} review slots (about a quarter expected)`);
  }
  const hasPairs = entry.main.some((t) => t.kind === "pairs");
  if (hasPairs && kindOf(entry, ids[ids.length - 1]) !== "pairs") failures.push(`${label}: last slot is not a pairs board`);
}

const kindOf = (entry: KitStage, id: string) => templatesOf(entry).get(id)?.kind;

function checkLesson(entry: KitStage, seed: number, ctx: GenContext, failures: string[], stats: Stats): Question[] {
  const { stage } = entry;
  const label = `${stage.id} seed ${seed} d${ctx.difficulty}${ctx.easier ? " easier" : ""}`;
  const set = generateQuestionSet(stage.generator, stage.params, stage.questions, seed, ctx);
  stats.lessons++;
  stats.questions += set.length;
  if (set.length !== stage.questions) failures.push(`${label}: ${set.length}/${stage.questions} questions`);
  const again = generateQuestionSet(stage.generator, stage.params, stage.questions, seed, ctx, set.flatMap(questionKeys));
  if (JSON.stringify(set) !== JSON.stringify(again)) failures.push(`${label}: not deterministic from the seed`);
  const templates = templatesOf(entry);
  const seen = new Set<string>();
  set.forEach((q, index) => {
    if (q.id !== `kit-${seed}-${index}`) failures.push(`${label}: id ${q.id}`);
    checkKitQuestion(q, templates, `${label} #${index + 1}`, failures);
    if (JSON.stringify(kitKeys(q)) !== JSON.stringify(questionKeys(q))) failures.push(`${label}: kitKeys drifted from questionKeys`);
    if (q.dedupeKey?.includes("#")) failures.push(`${label}: lesson ran out of fresh samples (${q.dedupeKey}) — thin templates`);
    if (questionKeys(q).some((key) => seen.has(key))) failures.push(`${label}: repeated question ${q.dedupeKey}`);
    questionKeys(q).forEach((key) => seen.add(key));
  });
  checkShape(entry, set, label, failures);
  return set;
}

// ---------------------------------------------------------- replacements

function replace(entry: KitStage, missed: Question | undefined, seed: number, ctx: GenContext, seen: Set<string>): Question | undefined {
  const params = missed ? kitSessionParams(missed, paramsOf(entry)) : paramsOf(entry);
  return entry.full
    ? generateQuestionSet("kit", params, 1, seed, ctx, seen)[0]
    : planKitLesson(params as unknown as KitParams, 1, seed, ctx, seen)[0];
}

/** Can `template` still produce a sample with no key in `seen` (optionally a different answer)? */
function hasFresh(template: KitTemplate, seen: ReadonlySet<string>, ctx: GenContext, avoid?: string): boolean {
  const rng = mulberry32(template.id.length * 7919 + seen.size);
  for (let i = 0; i < PROOF_DRAWS; i++) {
    const level = i % 3 === 0 ? ctx : { difficulty: rng(), easier: i % 2 === 0 };
    const { question } = sampleTemplate(template, rng, level);
    if (!questionKeys(question).some((key) => seen.has(key)) && question.answer !== avoid) return true;
  }
  return false;
}

/** Rule 1: the same template, a sample the session has not shown, a different answer when one exists. */
function checkReplacement(
  entry: KitStage, missed: Question, fresh: Question | undefined, seen: Set<string>, ctx: GenContext, label: string, failures: string[],
): boolean {
  if (!fresh) {
    failures.push(`${label}: replacement came back empty`);
    return false;
  }
  if (!checkKitQuestion(fresh, templatesOf(entry), label, failures)) return false;
  const variant = fresh.dedupeKey?.includes("#");
  if (seen.has(subjectKey(fresh.dedupeKey ?? ""))) failures.push(`${label}: replacement repeats a shown subject`);
  else if (!variant && questionKeys(fresh).some((key) => seen.has(key))) failures.push(`${label}: replacement repeats a shown question`);
  const pinned = templatesOf(entry).get(templateOf(missed));
  if (!pinned) return true;
  if (templateOf(fresh) !== pinned.id && hasFresh(pinned, seen, ctx)) {
    failures.push(`${label}: replacement left "${pinned.id}" although it still had fresh samples`);
  } else if (templateOf(fresh) === pinned.id && fresh.answer === missed.answer && hasFresh(pinned, seen, ctx, missed.answer)) {
    failures.push(`${label}: replacement kept the missed answer ${missed.answer}`);
  }
  return true;
}

/** Replace every question of a lesson once, as the miss flow would. */
function checkReplacements(entry: KitStage, set: Question[], seed: number, ctx: GenContext, failures: string[], stats: Stats): void {
  const seen = new Set(set.flatMap(questionKeys));
  set.forEach((missed, index) => {
    const label = `${entry.stage.id} seed ${seed} d${ctx.difficulty} replace #${index + 1}`;
    stats.replacements++;
    checkReplacement(entry, missed, replace(entry, missed, seed * 31 + index, ctx, seen), seen, ctx, label, failures);
  });
  const loose = replace(entry, undefined, seed + 5, ctx, seen);
  // A numbered variant (the template is truly used up) may look like a shown question, never share its subject.
  const keys = loose && (loose.dedupeKey?.includes("#") ? [subjectKey(loose.dedupeKey)] : questionKeys(loose));
  if (!keys || keys.some((key) => seen.has(key))) failures.push(`${entry.stage.id} seed ${seed}: unpinned replacement not fresh`);
}

/** A child who keeps missing: 60 replacements in a row never come back empty or repeat a subject. */
function checkMissRun(entry: KitStage, set: Question[], seed: number, ctx: GenContext, failures: string[], stats: Stats): void {
  const seen = new Set(set.flatMap(questionKeys));
  let current = set[seed % set.length];
  for (let miss = 0; miss < MISS_RUN; miss++) {
    const label = `${entry.stage.id} seed ${seed} miss ${miss + 1}`;
    const level = { ...ctx, easier: miss % 3 === 2 };
    const next = replace(entry, current, seed * 977 + miss, level, seen);
    stats.replacements++;
    if (!next || !checkKitQuestion(next, templatesOf(entry), label, failures)) {
      failures.push(`${label}: replacement came back empty`);
      return;
    }
    if (seen.has(subjectKey(next.dedupeKey ?? ""))) failures.push(`${label}: repeated a shown subject`);
    questionKeys(next).forEach((key) => seen.add(key));
    current = next;
  }
}

/** Mixed-in kit slots (Code Lab) are only ever asked one at a time: a chain of unpinned + pinned draws. */
function mixedSet(entry: KitStage, seed: number, ctx: GenContext, failures: string[], stats: Stats): Question[] {
  const seen = new Set<string>();
  const set: Question[] = [];
  for (let i = 0; i < Math.max(4, entry.stage.questions); i++) {
    const q = replace(entry, undefined, seed * 13 + i, ctx, seen);
    const label = `${entry.stage.id} seed ${seed} kit slot ${i + 1}`;
    stats.questions++;
    if (!q || !checkKitQuestion(q, templatesOf(entry), label, failures)) continue;
    if (questionKeys(q).some((key) => seen.has(key)) && !q.dedupeKey?.includes("#")) failures.push(`${label}: repeated question`);
    questionKeys(q).forEach((key) => seen.add(key));
    set.push(q);
  }
  return set;
}

function auditStage(entry: KitStage, failures: string[], stats: Stats): void {
  for (const seed of SEEDS) {
    for (const difficulty of DIFFICULTIES) {
      for (const easier of [false, true]) {
        const ctx = { difficulty, easier };
        try {
          const set = entry.full ? checkLesson(entry, seed, ctx, failures, stats) : mixedSet(entry, seed, ctx, failures, stats);
          if (!set.length) continue;
          checkReplacements(entry, set, seed, ctx, failures, stats);
          if (!easier && seed < 40) checkMissRun(entry, set, seed, ctx, failures, stats);
        } catch (error) {
          failures.push(`${entry.stage.id} seed ${seed} d${difficulty}: ${String(error)}`);
        }
      }
    }
  }
}

/** A hand-made lesson dressed as a stage, so the stage checks can run on it. */
function fixtureStage(name: string, params: KitParams, count: number): KitStage {
  const stage = { id: `fixture "${name}"`, name, generator: "kit", params, questions: count, mechanic: "tour", payout: 0 };
  return { course: "fixture", stage: stage as unknown as StageDef, main: params.templates, review: params.review, full: true };
}

/** One thin lesson: exact count, valid payloads, no repeated subject, no three in a row. */
function checkThinLesson(entry: KitStage, seed: number, ctx: GenContext, failures: string[], stats: Stats): Question[] {
  const label = `${entry.stage.id} seed ${seed} d${ctx.difficulty}`;
  const set = planKitLesson(paramsOf(entry) as unknown as KitParams, entry.stage.questions, seed, ctx);
  stats.questions += set.length;
  if (set.length !== entry.stage.questions) failures.push(`${label}: ${set.length}/${entry.stage.questions} questions`);
  const subjects = set.map((q) => q.dedupeKey);
  if (new Set(subjects).size !== subjects.length) failures.push(`${label}: repeated dedupeKey`);
  set.forEach((q, index) => checkKitQuestion(q, templatesOf(entry), `${label} #${index + 1}`, failures));
  if (entry.stage.questions >= 4) checkShape(entry, set, label, failures);
  return set;
}

/**
 * Hand-made thin lessons (every pool at the guide's minimum, audit-kit-fixtures.ts):
 * the planner still returns exactly `count`, replacements stay on their template
 * until it is used up, a 60-miss run never comes back empty — and an empty lesson throws.
 */
function checkEdges(failures: string[], stats: Stats): void {
  // Picture-only cards (label "") pass the static rules when their art differs.
  for (const template of THIN_PICTURES) checkTemplate(template, "fixture", failures);
  for (const [name, params, count] of THIN_LESSONS) {
    const entry = fixtureStage(name, params, count);
    for (const seed of SEEDS.slice(0, 6)) {
      for (const difficulty of DIFFICULTIES) {
        const ctx = { difficulty, easier: false };
        const set = checkThinLesson(entry, seed, ctx, failures, stats);
        checkReplacements(entry, set, seed, ctx, failures, stats);
        if (seed < 40) checkMissRun(entry, set, seed, ctx, failures, stats);
      }
    }
  }
  const ctx = { difficulty: 0.5, easier: false };
  try {
    planKitLesson({ templates: [], review: [] }, 8, 1, ctx);
    failures.push("an empty kit lesson did not throw");
  } catch {
    // expected: a lesson with no templates at all is an authoring error
  }
}

function runAudit(): { failures: string[]; stats: Stats; templates: Map<string, KitTemplate> } {
  const failures: string[] = [];
  const stats: Stats = { courses: new Set(), lessons: 0, questions: 0, replacements: 0 };
  const stages = kitStages();
  const templates = checkStatic(stages, failures);
  checkEdges(failures, stats);
  for (const entry of stages) {
    stats.courses.add(entry.course);
    auditStage(entry, failures, stats);
  }
  return { failures, stats, templates };
}

/** Failure messages (empty = pass). Hooked into scripts/audit-questions.ts. */
export function auditKit(): string[] {
  return runAudit().failures;
}

if (import.meta.main) {
  const { failures, stats, templates } = runAudit();
  const lowest = [...templates.entries()]
    .map(([id, template]) => [id, templateVariety(template)] as const)
    .sort((a, b) => a[1] - b[1]).slice(0, 5)
    .map(([id, variety]) => `${id} ${variety}`).join(", ");
  console.log(`Kit: ${stats.courses.size} course(s), ${kitStages().length} lessons (${stats.lessons} planned runs), ${templates.size} templates, ` +
    `${stats.questions} questions, ${stats.replacements} replacements`);
  console.log(`Lowest variety: ${lowest || "none"}`);
  if (failures.length) {
    console.error(failures.slice(0, 80).join("\n"));
    console.error(`${failures.length} Course Kit audit failures`);
    process.exitCode = 1;
  } else {
    console.log("Course Kit audit passed");
  }
}
