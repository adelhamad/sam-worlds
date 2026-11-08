import { ADAPTATIONS, OBSERVATIONS } from "../src/content/traits/examples";
import { CONCEPTS } from "../src/content/traits/concepts";
import { TRAIT_CHANGE_EVENTS } from "../src/content/traits/changes";
import { overlappingTraits } from "../src/content/traits/pairing";
import { WORLDS } from "../src/content/worlds";
import { workedExample } from "../src/engine/answers/answerEngine";
import { generateQuestionSet, questionKeys } from "../src/engine/generators";
import type { Question } from "../src/engine/generators/types";
import { STR } from "../src/strings/en";
import { auditTraitsResume } from "./audit-traits-resume";
import { auditTraitsLanguage, checkTraitsLanguage } from "./audit-traits-language";
import { auditTraitsMedia, checkTraitsMedia } from "./audit-traits-media";

const MODES = ["spot", "origin", "concept", "job", "feature", "pair"];
const adaptations = new Map(ADAPTATIONS.map((item) => [item.id, item]));
const observations = new Map(OBSERVATIONS.map((item) => [item.id, item]));
const concepts = new Map(CONCEPTS.map((item) => [item.id, item]));
type Stage = (typeof WORLDS)[number]["stages"][number];
type Adaptation = (typeof ADAPTATIONS)[number];
interface AuthoredTask {
  prompt: string;
  answer: string;
  semanticKey: string;
  ordered?: string[];
}

function nonblank(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function sourceUrl(source: string): boolean {
  try {
    const url = new URL(source);
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function checkBank<T extends { id: string }>(
  name: string, rows: T[], fields: (row: T) => unknown[], failures: string[],
): void {
  const ids = new Set<string>();
  for (const row of rows) {
    if (!nonblank(row.id) || ids.has(row.id)) failures.push(`traits ${name}: blank or repeated id ${row.id}`);
    ids.add(row.id);
    if (!fields(row).every(nonblank)) failures.push(`traits ${name}/${row.id}: blank content`);
  }
}

function checkBanks(failures: string[]): void {
  checkBank("adaptations", ADAPTATIONS,
    (item) => [item.organism, item.trait, item.job, item.place, item.source], failures);
  checkBank("observations", OBSERVATIONS, (item) => [item.subject, item.detail, item.example, item.hint], failures);
  checkBank("concepts", CONCEPTS, (item) => [item.prompt, item.answer, item.hint, item.explanation], failures);
  for (const item of ADAPTATIONS) {
    if (!sourceUrl(item.source)) failures.push(`traits ${item.id}: invalid source URL`);
    checkDistractors(item.id, item.job, item.distractorJobs, failures);
    checkDistractors(item.id, item.trait, item.distractorTraits, failures);
  }
  for (const item of OBSERVATIONS) {
    if (!Object.hasOwn(STR.traits.origins, item.kind)) failures.push(`traits ${item.id}: invalid origin ${item.kind}`);
    if (item.kind === "acquired" && !TRAIT_CHANGE_EVENTS[item.id]) failures.push(`traits ${item.id}: missing everyday situation`);
  }
  for (const item of CONCEPTS) checkDistractors(item.id, item.answer, item.distractors, failures);
}

function checkDistractors(label: string, answer: string, distractors: string[], failures: string[]): void {
  if (!Array.isArray(distractors) || distractors.length < 3 || !distractors.every(nonblank) ||
      distractors.includes(answer) || new Set(distractors).size !== distractors.length) {
    failures.push(`traits ${label}: invalid distractor bank`);
  }
}

function adaptation(id: string): Adaptation {
  const item = adaptations.get(id);
  if (!item) throw new Error(`unknown adaptation ${id}`);
  return item;
}

function adaptationKey(item: Adaptation): string {
  return JSON.stringify([item.organism, item.trait, item.job]);
}

function pairTask(first: Adaptation, second: Adaptation): AuthoredTask {
  // Animal names stay on the part cards: two animals can both have big front
  // teeth while using them differently. Identical job cards are still ambiguous.
  if (first.id === second.id || first.job === second.job) {
    throw new Error(`ambiguous pair ${first.id}:${second.id}`);
  }
  if (overlappingTraits(first.id, second.id)) {
    throw new Error(`overlapping trait functions: ${first.id}:${second.id}`);
  }
  const ordered = [STR.traits.pairTrait(first.organism, first.trait), STR.traits.pairJob(first.job),
    STR.traits.pairTrait(second.organism, second.trait), STR.traits.pairJob(second.job)];
  if (new Set(ordered).size !== 4) throw new Error(`duplicate pair cards ${first.id}:${second.id}`);
  return {
    prompt: STR.traits.pair(first.organism, second.organism), answer: ordered.join(" → "), ordered,
    semanticKey: `pair:${JSON.stringify([adaptationKey(first), adaptationKey(second)].sort())}`,
  };
}

/** Derive answers from the authored banks, never from generator output. */
function authoredTask(token: string): AuthoredTask {
  const [mode, id, otherId, extra] = token.split(":");
  if (!MODES.includes(mode) || !id || extra !== undefined ||
      (mode === "pair" ? !otherId : otherId !== undefined)) throw new Error(`invalid token ${token}`);
  if (mode === "pair") return pairTask(adaptation(id), adaptation(otherId));
  let prompt: string;
  let answer: string;
  if (mode === "origin") {
    const item = observations.get(id);
    if (!item) throw new Error(`unknown observation ${id}`);
    prompt = item.kind === "acquired" ? STR.traits.changePrompt(TRAIT_CHANGE_EVENTS[item.id]) : STR.traits.originPrompts[item.kind];
    answer = item.example;
  } else if (mode === "concept") {
    const item = concepts.get(id);
    if (!item) throw new Error(`unknown concept ${id}`);
    ({ prompt, answer } = item);
  } else {
    const item = adaptation(id);
    answer = mode === "job" ? item.job : item.trait;
    if (mode === "spot") prompt = STR.traits.spot(item.organism);
    else if (mode === "job") prompt = STR.traits.job(item.organism, item.trait);
    else prompt = STR.traits.feature(item.organism, item.job);
  }
  return { prompt, answer, semanticKey: JSON.stringify([prompt, answer]) };
}

function checkQuestion(question: Question, easier: boolean, label: string, failures: string[]): void {
  checkTraitsLanguage(question, label, failures);
  const token = question.dedupeKey?.replace(/^traits:/, "");
  if (!token || question.dedupeKey !== `traits:${token}`) failures.push(`${label}: missing stable traits task key`);
  else checkTraitsMedia(question, token, label, failures);
  if (question.payload?.traitsCopyVersion !== 3) failures.push(`${label}: expected traits copy version 3`);
  if (![question.prompt, question.answer, question.hint].every(nonblank)) failures.push(`${label}: blank question content`);
  if (!workedExample(question).trim()) failures.push(`${label}: missing shared worked example`);
  if (question.inputMode === "choices") {
    const count = easier ? 3 : 4;
    if (question.choices.length !== count || !question.choices.every(nonblank) ||
        question.choices.filter((choice) => choice === question.answer).length !== 1 ||
        new Set(question.choices).size !== question.choices.length) {
      failures.push(`${label}: expected ${count} unique choices (one correct, ${count - 1} distinct wrong)`);
    }
  }
}

function checkPair(question: Question, ordered: string[], label: string, failures: string[]): void {
  const items = question.payload?.items;
  if (question.inputMode !== "order" || question.choices.length !== 0 || !Array.isArray(items) ||
      items.length !== 4 || new Set(items).size !== 4 || !ordered.every((card) => items.includes(card))) {
    failures.push(`${label}: pair needs exactly four unique trait/job cards`);
  }
}

function checkToken(stage: Stage, token: string, task: AuthoredTask, failures: string[]): void {
  for (const easier of [false, true]) {
    const label = `${stage.id} ${token} easier=${easier}`;
    const [question] = generateQuestionSet(stage.generator, { items: [token] }, 1, 509,
      { difficulty: 0.5, easier });
    if (!question) {
      failures.push(`${label}: no authored question`);
      continue;
    }
    checkQuestion(question, easier, label, failures);
    // The shared set builder assigns seed/index IDs; the subject token stays stable.
    if (question.id !== "traits-509-0" || question.dedupeKey !== `traits:${token}`) failures.push(`${label}: authored task identity changed`);
    if (question.answer !== task.answer || question.prompt !== task.prompt) failures.push(`${label}: wrong authored prompt or answer`);
    if (task.ordered) checkPair(question, task.ordered, label, failures);
    else if (question.inputMode !== "choices") failures.push(`${label}: expected single-choice matching`);
  }
}

function taskKeys(question: Question): string[] {
  return [...questionKeys(question), `task:${JSON.stringify([question.prompt, question.answer])}`];
}

function claimQuestions(questions: Question[], seen: Set<string>, easier: boolean, label: string, failures: string[]): void {
  for (const question of questions) {
    checkQuestion(question, easier, label, failures);
    const keys = taskKeys(question);
    if (keys.some((key) => seen.has(key))) failures.push(`${label}: repeated semantic task or token`);
    keys.forEach((key) => seen.add(key));
  }
}

function checkSequentialRun(stages: Stage[], seed: number, easier: boolean, failures: string[]): void {
  const globalSeen = new Set<string>();
  for (const [index, stage] of stages.entries()) {
    const label = `${stage.id} sequential seed=${seed} easier=${easier}`;
    const context = { difficulty: index / Math.max(1, stages.length - 1), easier };
    try {
      const initial = generateQuestionSet(stage.generator, stage.params, 6, seed + index, context, globalSeen);
      if (initial.length !== 6) failures.push(`${label}: ${initial.length}/6 initial questions`);
      claimQuestions(initial, globalSeen, easier, label, failures);
      // Both variants must retain two fresh tasks after the same initial six.
      for (const replacementEasier of [false, true]) {
        const excluded = new Set(globalSeen);
        const replacements = generateQuestionSet(stage.generator, stage.params, 2, seed + index + 101,
          { ...context, easier: replacementEasier }, excluded);
        const replacementLabel = `${label} replacements easier=${replacementEasier}`;
        if (replacements.length !== 2) failures.push(`${replacementLabel}: ${replacements.length}/2 fresh questions`);
        claimQuestions(replacements, excluded, replacementEasier, replacementLabel, failures);
      }
    } catch (error) {
      failures.push(`${label}: ${String(error)}`);
    }
  }
}

function checkStages(stages: Stage[], failures: string[]): void {
  const tokens = new Set<string>();
  const semanticTasks = new Set<string>();
  const modes = new Set<string>();
  for (const [index, stage] of stages.entries()) {
    if (stage.generator !== "traits" || stage.questions !== 6) failures.push(`${stage.id}: expected six traits questions`);
    const items = stage.params.items;
    if (!Array.isArray(items) || !items.every(nonblank)) {
      failures.push(`${stage.id}: expected authored trait tokens`);
      continue;
    }
    const minimum = index === 0 || items.some((token) => token.startsWith("pair:")) ? 12 : 8;
    if (items.length < minimum) failures.push(`${stage.id}: needs at least ${minimum} authored tasks`);
    for (const token of items) {
      if (tokens.has(token)) failures.push(`${stage.id}: repeated token ${token}`);
      tokens.add(token);
      modes.add(token.split(":")[0]);
      try {
        const task = authoredTask(token);
        if (semanticTasks.has(task.semanticKey)) failures.push(`${stage.id}: repeated semantic task ${token}`);
        semanticTasks.add(task.semanticKey);
        checkToken(stage, token, task, failures);
      } catch (error) {
        failures.push(`${stage.id} ${token}: ${String(error)}`);
      }
    }
  }
  for (const mode of MODES) if (!modes.has(mode)) failures.push(`traits: unused mode ${mode}`);
  if (tokens.size !== 808) failures.push(`traits: expected 808 authored tasks, got ${tokens.size}`);
}

/** Traits-only structural, factual and fresh-question checks for the shared audit. */
export function auditTraits(): string[] {
  const failures: string[] = [...auditTraitsResume(), ...auditTraitsLanguage(), ...auditTraitsMedia()];
  const world = WORLDS.find((entry) => entry.id === "traits");
  if (!world || world.stages.length !== 55) failures.push("traits: expected 55 stages");
  checkBanks(failures);
  const stages = world?.stages ?? [];
  checkStages(stages, failures);
  for (const seed of [37, 12345]) {
    for (const easier of [false, true]) checkSequentialRun(stages, seed, easier, failures);
  }
  return failures;
}
