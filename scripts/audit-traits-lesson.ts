import { existsSync } from "node:fs";
import { ADAPTATIONS, OBSERVATIONS, type Adaptation } from "../src/content/traits/examples";
import { TRAIT_PHOTOS } from "../src/content/traits/photoCatalog";
import { ADAPTATION_PICTURES, CONCEPT_PICTURES, OBSERVATION_PICTURES } from "../src/content/traits/pictureMap";
import { WORLDS } from "../src/content/worlds";
import { generateQuestionSet } from "../src/engine/generators";
import { refreshTraitsQuestion } from "../src/engine/generators/refreshTraits";
import { traitLessonExample } from "../src/engine/generators/traitLesson";
import { generateTraits } from "../src/engine/generators/traits";
import type { Question } from "../src/engine/generators/types";
import { mulberry32 } from "../src/engine/rng";
import type { SessionRow } from "../src/engine/save/db";

type Stage = (typeof WORLDS)[number]["stages"][number];
const MODES = ["spot", "origin", "concept", "job", "feature", "pair"];
const SEEDS = [37, 12345];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function overlaps(first: string, second: string): boolean {
  const a = normalize(first);
  const b = normalize(second);
  return a.includes(b) || b.includes(a);
}

function freeze(value: unknown): void {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return;
  for (const child of Object.values(value)) freeze(child);
  Object.freeze(value);
}

function protectedText(question: Question): string[] {
  const cards = question.payload?.items;
  return [question.prompt, question.answer, ...question.choices, ...(Array.isArray(cards) ? cards as string[] : [])];
}

/** Derive subjects independently from authored tokens, including ALL origin options. */
function subjectPictures(question: Question): Set<string> {
  const [mode, id, second] = question.dedupeKey!.slice("traits:".length).split(":");
  const pictures = new Set<string>();
  if (mode === "origin") {
    for (const observation of OBSERVATIONS) {
      if (question.choices.includes(observation.example)) pictures.add(OBSERVATION_PICTURES[observation.id]);
    }
  } else if (mode === "concept") {
    for (const picture of CONCEPT_PICTURES[id] ?? []) pictures.add(picture);
  } else {
    pictures.add(ADAPTATION_PICTURES[id]);
    if (mode === "pair") pictures.add(ADAPTATION_PICTURES[second]);
  }
  const payloadPictures = question.payload?.traitPictureIds;
  if (Array.isArray(payloadPictures)) for (const picture of payloadPictures) pictures.add(picture as string);
  return pictures;
}

function safeExample(item: Adaptation, question: Question): boolean {
  const pictures = subjectPictures(question);
  const photo = TRAIT_PHOTOS[ADAPTATION_PICTURES[item.id]];
  if (pictures.has(ADAPTATION_PICTURES[item.id])) return false;
  if ([...pictures].some((picture) => photo && TRAIT_PHOTOS[picture]?.src === photo.src)) return false;
  return !protectedText(question).some((text) => overlaps(item.trait, text) || overlaps(item.job, text));
}

function lessonPool(items: string[]): Adaptation[] {
  const ids = new Set(items.flatMap((token) => token.split(":").slice(1)));
  return ADAPTATIONS.filter((item) => ids.has(item.id));
}

function checkPhoto(example: Adaptation, label: string, failures: string[]): void {
  const picture = ADAPTATION_PICTURES[example.id];
  const photo = TRAIT_PHOTOS[picture];
  if (!photo || !photo.alt.trim() || !photo.label.trim() ||
      !/^\/images\/traits\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.webp$/.test(photo.src) ||
      !existsSync(new URL(`../public${photo.src}`, import.meta.url))) {
    failures.push(`${label}: lesson example has no valid bundled subject photo`);
  }
}

function checkExample(sourceItems: string[], question: Question, label: string, failures: string[]): void {
  const items = [...sourceItems];
  const before = JSON.stringify([items, question]);
  freeze(items);
  freeze(question);
  try {
    const example = traitLessonExample(items, question);
    if (!example) {
      failures.push(`${label}: missing separate lesson example`);
      return;
    }
    if (!ADAPTATIONS.includes(example)) failures.push(`${label}: example is not an approved adaptation`);
    checkPhoto(example, label, failures);
    if (!safeExample(example, question)) failures.push(`${label}: example exposes an active subject, trait or job (${example.id})`);
    const available = lessonPool(items).filter((item) => safeExample(item, question));
    if (available.length && !available.includes(example)) failures.push(`${label}: skipped a safe lesson-local adaptation`);
    if (traitLessonExample(items, question) !== example ||
        traitLessonExample([...items], structuredClone(question)) !== example) {
      failures.push(`${label}: example selection is not deterministic`);
    }
  } catch (error) {
    failures.push(`${label}: lesson helper threw: ${String(error)}`);
  }
  if (JSON.stringify([items, question]) !== before) failures.push(`${label}: lesson helper mutated items or question/payload`);
}

function questionFor(token: string, seed = 509, easier = false): Question {
  return generateQuestionSet("traits", { items: [token] }, 1, seed, { difficulty: 0.5, easier })[0];
}

function checkAuthoredTasks(stages: Stage[], failures: string[]): void {
  const tokens = new Set<string>();
  const modes = new Set<string>();
  let draws = 0;
  for (const stage of stages) {
    const items = stage.params.items as string[];
    for (const token of items) {
      tokens.add(token);
      modes.add(token.split(":")[0]);
      for (const seed of SEEDS) {
        for (const easier of [false, true]) {
          const question = questionFor(token, seed, easier);
          draws++;
          checkExample(items, question, `traits lesson ${stage.id}/${token} seed=${seed} easier=${easier}`, failures);
        }
      }
    }
  }
  if (tokens.size !== 808 || draws !== 3232) failures.push(`traits lesson: expected 808 tasks / 3232 seeded variants, got ${tokens.size} / ${draws}`);
  if (MODES.some((mode) => !modes.has(mode))) failures.push("traits lesson: not all six modes were audited");
}

function checkSavedSession(stage: Stage, easier: boolean, failures: string[]): void {
  const seed = 98217;
  const context = { difficulty: 0.5, easier };
  const questions = generateQuestionSet(stage.generator, stage.params, 6, seed, context);
  const saved: SessionRow = {
    id: 1, stageId: stage.id, seed, questions, index: 2,
    correctCount: 2, firstTryMisses: 1, missStreak: 1, attemptMissed: true,
    seenQuestionKeys: ["subject:already-seen", ...questions.map((question) => question.dedupeKey!)],
    wrongStamps: [1000, 2100], proveLeft: 2,
  };
  const before = JSON.stringify(saved);
  freeze(saved);
  if (questions.length !== 6) failures.push(`traits lesson ${stage.id}: expected six saved questions`);
  for (const [index, question] of questions.entries()) {
    const label = `traits lesson saved ${stage.id} easier=${easier} question=${index}`;
    checkExample(stage.params.items as string[], question, label, failures);
    if (question.id !== `traits-${seed}-${index}` || question.payload?.traitsCopyVersion !== 3 ||
        refreshTraitsQuestion(question) !== question) failures.push(`${label}: current-v3 identity/copy changed or refreshed`);
  }
  const replay = generateQuestionSet(stage.generator, stage.params, 6, seed, context);
  if (JSON.stringify(questions) !== JSON.stringify(replay)) failures.push(`traits lesson ${stage.id}: seeded generation changed after lesson selection`);
  if (JSON.stringify(saved) !== before) failures.push(`traits lesson ${stage.id}: current save, progress or question payload changed`);
}

function checkRegression(token: string, items: string[], forbidden: string[], failures: string[]): void {
  const question = questionFor(token);
  const label = `traits lesson regression ${token}`;
  checkExample(items, question, label, failures);
  const example = traitLessonExample(items, question);
  if (!example || forbidden.includes(example.id)) failures.push(`${label}: reused an excluded worked example`);
}

function checkOriginOptions(failures: string[]): void {
  // All four choices are real authored observations. The helper must exclude
  // option pictures, not just the correct answer's subject.
  const observations = ["inherited-duck", "inherited-fish", "inherited-elephant", "inherited-porcupine"]
    .map((id) => OBSERVATIONS.find((item) => item.id === id)!);
  const question = questionFor("origin:inherited-duck");
  question.choices = observations.map((item) => item.example);
  question.payload = { ...question.payload, traitPictureIds: observations.map((item) => OBSERVATION_PICTURES[item.id]) };
  const items = ["spot:trout-gills", "spot:elephant-trunk", "spot:porcupine-quills", "spot:duck-feet"];
  checkExample(items, question, "traits lesson regression all origin options", failures);
  const example = traitLessonExample(items, question);
  if (!example || lessonPool(items).includes(example)) failures.push("traits lesson origin: used an answer or distractor subject");
}

function neutralQuestion(): Question {
  return { id: "lesson-normalization", dedupeKey: "traits:synthetic", inputMode: "choices",
    prompt: "Compare these living things", answer: "an unrelated answer", choices: ["another option"], hint: "Look closely",
    payload: { traitPictureIds: [] } };
}

function checkTextExclusions(failures: string[]): void {
  const item = ADAPTATIONS.find((adaptation) => adaptation.id === "beaver-teeth")!;
  for (const fact of [item.trait, item.job]) {
    const words = fact.toUpperCase().split(" ");
    // Both containment directions, with case/punctuation differences.
    for (const text of [`Notice ${words.join("---")} today`, words.slice(1).join("...!")]) {
      for (const field of ["prompt", "answer", "choices", "cards"]) {
        const question = neutralQuestion();
        if (field === "choices") question.choices = [text];
        else if (field === "cards") question.payload!.items = [text];
        else if (field === "prompt") question.prompt = text;
        else question.answer = text;
        const example = traitLessonExample(["spot:beaver-teeth"], question);
        if (!example || example.id === item.id) failures.push(`traits lesson normalization ${field}/${text}: overlapping fact was shown`);
      }
    }
  }
}

function checkPreferenceAndNonTraits(failures: string[]): void {
  const question = questionFor("spot:beaver-teeth");
  const items = ["spot:lotus-leaves", "spot:duck-feet"];
  checkExample(items, question, "traits lesson regression local preference", failures);
  if (traitLessonExample(items, question)?.id !== "lotus-leaves") failures.push("traits lesson: did not prefer the first safe lesson adaptation");
  checkExample([], question, "traits lesson regression fallback", failures);
  for (const dedupeKey of [undefined, "math:addition", "trait:spot:beaver-teeth"]) {
    const other = { ...neutralQuestion(), dedupeKey };
    const before = JSON.stringify(other);
    freeze(other);
    if (traitLessonExample(items, other) !== undefined || JSON.stringify(other) !== before) {
      failures.push(`traits lesson: non-traits question ${String(dedupeKey)} was handled or mutated`);
    }
  }
}

function checkRngIsolation(failures: string[]): void {
  const params = { items: ["spot:beaver-teeth", "job:duck-feet", "feature:lotus-leaves"] };
  const context = { difficulty: 0.5, easier: false };
  const baselineRng = mulberry32(9182);
  const expected = [generateTraits(params, baselineRng, context), generateTraits(params, baselineRng, context)];
  const liveRng = mulberry32(9182);
  const first = generateTraits(params, liveRng, context);
  const before = JSON.stringify([params, first]);
  freeze(params);
  freeze(first);
  traitLessonExample(params.items, first);
  const actual = [first, generateTraits(params, liveRng, context)];
  if (JSON.stringify(actual) !== JSON.stringify(expected) || liveRng() !== baselineRng() ||
      JSON.stringify([params, first]) !== before) failures.push("traits lesson: affected gameplay RNG, generated payloads or params");
}

/** 3232 exhaustive task variants + 1320 stage/replay questions; no browser/save IO. */
export function auditTraitsLesson(): string[] {
  const failures: string[] = [];
  const stages = WORLDS.find((world) => world.id === "traits")?.stages ?? [];
  if (stages.length !== 55) failures.push("traits lesson: expected all 55 lessons");
  if (stages.some((stage) => !Array.isArray(stage.params.items) ||
      !(stage.params.items as unknown[]).every((item) => typeof item === "string"))) {
    return [...failures, "traits lesson: malformed stage items"];
  }
  const banksBefore = JSON.stringify([ADAPTATIONS, OBSERVATIONS, ADAPTATION_PICTURES, TRAIT_PHOTOS]);
  checkAuthoredTasks(stages, failures);
  for (const stage of stages) for (const easier of [false, true]) checkSavedSession(stage, easier, failures);
  checkRegression("spot:beaver-teeth", ["spot:beaver-teeth"], ["beaver-teeth"], failures);
  checkRegression("spot:camel-feet", ["spot:camel-eyelashes"], ["camel-feet", "camel-eyelashes"], failures);
  checkRegression("pair:duck-feet:trout-gills", ["spot:trout-gills", "spot:duck-feet"], ["duck-feet", "trout-gills"], failures);
  checkOriginOptions(failures);
  checkTextExclusions(failures);
  checkPreferenceAndNonTraits(failures);
  checkRngIsolation(failures);
  if (JSON.stringify([ADAPTATIONS, OBSERVATIONS, ADAPTATION_PICTURES, TRAIT_PHOTOS]) !== banksBefore) {
    failures.push("traits lesson: mutated approved content or picture banks");
  }
  return failures;
}
