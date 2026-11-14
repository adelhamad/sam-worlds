// World Tour audit: plans every lesson many times and checks the contract in
// src/engine/tour/types.ts, the lesson-shape rules and the miss-replacement
// rules. Run alone (`bun scripts/audit-tour.ts`) or through audit-questions.ts.
import { TOUR_COUNTRIES, TOUR_UNITS, tourParams } from "../src/content/tour/units";
import type { StageDef } from "../src/content/types";
import { generateQuestionSet, questionKeys } from "../src/engine/generators";
import type { GenContext, Question } from "../src/engine/generators/types";
import { eligibleFor, kindCapacity } from "../src/engine/tour/exercises";
import { LAND_PATH } from "../src/engine/tour/land";
import { planTourLesson } from "../src/engine/tour/planner";
import { makePool, tourKeys } from "../src/engine/tour/pool";
import { tourSessionParams, type TourSessionParams } from "../src/engine/tour/sessionParams";
import type { TourKind, TourParams, TourPayload } from "../src/engine/tour/types";
import { TOUR } from "../src/strings/tour";
import { checkTourQuestion, primaryOf } from "./audit-tour-payload";

const SEEDS = [1, 3, 7, 37, 101, 509, 1009, 12345, 54321, 99991, 424242, 7777777];
const DIFFICULTIES = [0.1, 0.5, 0.9];
const MISS_RUN = 60;

interface Stats {
  lessons: number;
  questions: number;
  replacements: number;
  kinds: Record<string, number>;
}

const payloadOf = (q: Question) => q.payload as unknown as TourPayload;
const sorted = (list: string[]) => [...list].sort().join("+");

function checkKeys(q: Question, label: string, failures: string[]): void {
  if (JSON.stringify(tourKeys(q)) !== JSON.stringify(questionKeys(q))) failures.push(`${label}: tourKeys drifted from questionKeys`);
}

/** Lesson-shape rules: openers, finish, rotation, kind coverage. */
function checkShape(set: Question[], params: TourParams, label: string, failures: string[]): void {
  const kinds = set.map((q) => payloadOf(q).tour);
  const pool = makePool(params);
  set.slice(0, 2).forEach((q, index) => {
    const p = payloadOf(q);
    if (p.tour !== "pick" || p.ask !== "name" || p.show !== "flag") failures.push(`${label}: slot ${index + 1} is not a name → flag pick`);
    else if (!params.focus.includes(p.code)) failures.push(`${label}: slot ${index + 1} is not a focus country`);
  });
  if (kinds[kinds.length - 1] !== "pairs") failures.push(`${label}: last slot is ${kinds[kinds.length - 1]}, not pairs`);
  for (let i = 2; i < kinds.length; i++) {
    if (kinds[i] === kinds[i - 1]) failures.push(`${label}: slots ${i} and ${i + 1} are both ${kinds[i]}`);
  }
  for (const kind of params.kinds) {
    const capacity = kindCapacity(kind, pool);
    const amount = kinds.filter((used) => used === kind).length;
    const twice = (kind === "pairs" || kind === "build") && set.length >= 10 && capacity >= 2;
    if (capacity > 0 && amount < (twice ? 2 : 1)) failures.push(`${label}: only ${amount} ${kind} exercise(s)`);
  }
}

/** Country rules: meet lessons drill each new country; big lessons spread out and revisit. */
function checkCountries(set: Question[], params: TourParams, label: string, failures: string[]): void {
  const credits = (code: string) => set.filter((q) => payloadOf(q).codes.includes(code)).length;
  if (params.focus.length <= 4) {
    for (const code of params.focus) {
      if (credits(code) < 3) failures.push(`${label}: ${code} is practised only ${credits(code)} time(s)`);
    }
    return;
  }
  const reviewLed = set.filter((q) => params.review.includes(payloadOf(q).codes[0])).length;
  if (params.review.length && (reviewLed < 2 || reviewLed > set.length / 2)) {
    failures.push(`${label}: ${reviewLed}/${set.length} slots revisit earlier countries`);
  }
  const unpractised = params.focus.filter((code) => credits(code) === 0);
  if (unpractised.length > 1) failures.push(`${label}: focus countries never practised: ${unpractised.join(", ")}`);
  const led = (code: string) => set.filter((q) => payloadOf(q).codes[0] === code).length;
  const busiest = Math.max(...params.focus.map(led));
  if (busiest > 3) failures.push(`${label}: one country leads ${busiest} questions`);
}

function checkLesson(stage: StageDef, seed: number, ctx: GenContext, failures: string[], stats: Stats): Question[] {
  const params = tourParams(stage);
  const label = `${stage.id} seed ${seed} d${ctx.difficulty}${ctx.easier ? " easier" : ""}`;
  const set = generateQuestionSet(stage.generator, stage.params, stage.questions, seed, ctx);
  stats.lessons++;
  stats.questions += set.length;
  if (set.length !== stage.questions) failures.push(`${label}: ${set.length}/${stage.questions} questions`);
  const again = generateQuestionSet(stage.generator, stage.params, stage.questions, seed, ctx);
  if (JSON.stringify(set) !== JSON.stringify(again)) failures.push(`${label}: not deterministic from the seed`);
  const seen = new Set<string>();
  set.forEach((q, index) => {
    if (q.id !== `tour-${seed}-${index}`) failures.push(`${label}: id ${q.id}`);
    const p = checkTourQuestion(q, params, `${label} #${index + 1}`, failures);
    if (p) stats.kinds[p.tour] = (stats.kinds[p.tour] ?? 0) + 1;
    checkKeys(q, label, failures);
    if (q.dedupeKey?.includes("#")) failures.push(`${label}: a planned lesson needed a variant subject (${q.dedupeKey})`);
    if (questionKeys(q).some((key) => seen.has(key))) failures.push(`${label}: repeated question ${q.dedupeKey}`);
    questionKeys(q).forEach((key) => seen.add(key));
  });
  if (set.every((q) => payloadOf(q)?.tour)) {
    checkShape(set, params, label, failures);
    checkCountries(set, params, label, failures);
  }
  return set;
}

function replace(stage: StageDef, missed: Question, seed: number, ctx: GenContext, seen: Set<string>): Question | undefined {
  const pinned = tourSessionParams(missed, stage.params);
  return generateQuestionSet(stage.generator, pinned, 1, seed, ctx, seen)[0];
}

/** Rule 1: "new values, same skill" — same kind, different country, nothing already shown. */
function checkReplacement(
  stage: StageDef, missed: Question, fresh: Question | undefined, seen: Set<string>, label: string, failures: string[],
): boolean {
  const params = tourParams(stage);
  if (!fresh) {
    failures.push(`${label}: replacement came back empty`);
    return false;
  }
  const was = payloadOf(missed);
  const now = checkTourQuestion(fresh, params, label, failures);
  if (!now) return false;
  if (questionKeys(fresh).some((key) => seen.has(key))) failures.push(`${label}: replacement repeats a shown question`);
  if (sorted(now.codes) === sorted(was.codes)) failures.push(`${label}: replacement is about the same countries`);
  const primary = primaryOf(was);
  // A single-country kind can only be kept when another pool country can carry it.
  const others = makePool(params).all.filter((code) => code !== primary && eligibleFor(was.tour, code));
  const mustKeepKind = primary === null || others.length > 0;
  if (mustKeepKind && now.tour !== was.tour) failures.push(`${label}: replacement switched ${was.tour} → ${now.tour}`);
  return true;
}

/** Replace every question of a lesson once, as the miss flow would. */
function checkReplacements(stage: StageDef, set: Question[], seed: number, ctx: GenContext, failures: string[], stats: Stats): void {
  const seen = new Set(set.flatMap(questionKeys));
  set.forEach((missed, index) => {
    const label = `${stage.id} seed ${seed} d${ctx.difficulty} replace #${index + 1}`;
    const fresh = replace(stage, missed, seed * 31 + index, ctx, seen);
    stats.replacements++;
    checkReplacement(stage, missed, fresh, seen, label, failures);
    const pinned = tourSessionParams(missed, stage.params) as unknown as TourSessionParams;
    if (pinned.replace?.kind !== payloadOf(missed).tour) failures.push(`${label}: tourSessionParams did not pin the kind`);
  });
  // An unpinned draw (the registry's single-question form) must be fresh too.
  const [loose] = generateQuestionSet(stage.generator, stage.params, 1, seed + 5, ctx, seen);
  if (!loose || questionKeys(loose).some((key) => seen.has(key))) failures.push(`${stage.id} seed ${seed}: unpinned replacement not fresh`);
}

/** A child who keeps missing: 60 replacements in a row never run dry or repeat. */
function checkMissRun(stage: StageDef, set: Question[], seed: number, ctx: GenContext, failures: string[], stats: Stats): void {
  const seen = new Set(set.flatMap(questionKeys));
  let current = set[seed % set.length];
  for (let miss = 0; miss < MISS_RUN; miss++) {
    const label = `${stage.id} seed ${seed} miss ${miss + 1}`;
    const next = replace(stage, current, seed * 977 + miss, { ...ctx, easier: miss % 3 === 2 }, seen);
    stats.replacements++;
    if (!next || !checkTourQuestion(next, tourParams(stage), label, failures)) {
      failures.push(`${label}: replacement came back empty`);
      return;
    }
    if (questionKeys(next).some((key) => seen.has(key))) failures.push(`${label}: repeated a shown question`);
    if (sorted(payloadOf(next).codes) === sorted(payloadOf(current).codes)) failures.push(`${label}: same countries again`);
    questionKeys(next).forEach((key) => seen.add(key));
    current = next;
  }
}

function checkStrings(failures: string[]): void {
  const samples = Object.values(TOUR.engine).map((entry) => {
    if (typeof entry === "string") return entry;
    return (entry as (...args: unknown[]) => string)(["Red", "White", "Sky blue"], "Asia");
  });
  if (samples.some((text) => /wrong|fail/i.test(text))) failures.push("TOUR.engine: forbidden word");
  if (TOUR.engine.hintPaint(["Blue", "White", "Red"]) !== "Blue, white, then red.") failures.push("TOUR.engine.hintPaint wording");
  if (!LAND_PATH.startsWith("M") || LAND_PATH.length < 5000) failures.push("LAND_PATH backdrop is missing");
}

/** Hand-made tiny lessons: the planner must still return exactly `count` questions. */
function checkOddLessons(failures: string[]): void {
  const odd: [string, TourParams, number][] = [
    ["one kind", { focus: ["JPN", "USA", "BRA", "FRA"], review: [], kinds: ["pick"] }, 10],
    ["one continent", { focus: ["DEU", "ESP", "PRT", "IRL"], review: [], kinds: ["pick", "pairs", "sort", "paint"] }, 10],
    ["tiny pool", { focus: ["QAT", "KWT"], review: [], kinds: ["pick", "pairs", "build", "map", "sort", "paint"] }, 12],
    ["short", { focus: ["JPN", "USA", "BRA", "FRA"], review: ["EGY"], kinds: ["pick", "pairs", "build"] }, 3],
  ];
  for (const [name, params, count] of odd) {
    for (const seed of SEEDS) {
      const label = `odd lesson "${name}" seed ${seed}`;
      const set = planTourLesson(params, count, seed, { difficulty: 0.5, easier: false });
      if (set.length !== count) failures.push(`${label}: ${set.length}/${count} questions`);
      const keys = set.flatMap(questionKeys);
      if (new Set(keys).size !== keys.length) failures.push(`${label}: repeated question`);
      set.forEach((q, index) => checkTourQuestion(q, params, `${label} #${index + 1}`, failures));
    }
  }
}

function runAudit(): { failures: string[]; stats: Stats } {
  const failures: string[] = [];
  const stats: Stats = { lessons: 0, questions: 0, replacements: 0, kinds: {} };
  checkStrings(failures);
  checkOddLessons(failures);
  for (const stage of TOUR_UNITS.flatMap((unit) => unit.lessons)) {
    for (const seed of SEEDS) {
      for (const difficulty of DIFFICULTIES) {
        for (const easier of [false, true]) {
          const ctx = { difficulty, easier };
          try {
            const set = checkLesson(stage, seed, ctx, failures, stats);
            checkReplacements(stage, set, seed, ctx, failures, stats);
            if (!easier && seed < 40) checkMissRun(stage, set, seed, ctx, failures, stats);
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
export function auditTour(): string[] {
  return runAudit().failures;
}

function eligibility(): string {
  const count = (kind: TourKind) => TOUR_COUNTRIES.filter((code) => eligibleFor(kind, code)).length;
  const out = (kind: TourKind) => TOUR_COUNTRIES.filter((code) => !eligibleFor(kind, code)).join(" ");
  return `Eligibility of the ${TOUR_COUNTRIES.length} tour countries: map ${count("map")}, build ${count("build")}, paint ${count("paint")}\n` +
    `  not map-eligible: ${out("map")}\n  not build-eligible: ${out("build")}`;
}

if (import.meta.main) {
  const { failures, stats } = runAudit();
  console.log(eligibility());
  const kinds = Object.entries(stats.kinds).map(([kind, amount]) => kind + " " + amount).join(", ");
  console.log(`Kinds planned: ${kinds}`);
  if (failures.length) {
    console.error(failures.slice(0, 60).join("\n"));
    console.error(`${failures.length} World Tour audit failures`);
    process.exitCode = 1;
  } else {
    console.log(`World Tour audit passed: ${stats.lessons} lessons, ${stats.questions} questions, ${stats.replacements} replacements`);
  }
}
