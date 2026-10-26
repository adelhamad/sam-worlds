import { WORLDS } from "../src/content/worlds";
import { generateQuestionSet } from "../src/engine/generators";
import type { Question } from "../src/engine/generators/types";
import { COUNTRY_BY_CODE, COUNTRIES, flagEmoji } from "../src/engine/generators/geography";

const SEEDS = [1, 3, 7, 37, 101, 509, 1009, 12345, 54321, 99991];
const failures: string[] = [];
const stageIds = new Set<string>();
let sessions = 0;
let questionsChecked = 0;

function keys(q: Question): string[] {
  const visible = JSON.stringify([q.prompt, q.answer, q.payload ?? null]);
  return q.dedupeKey ? [`subject:${q.dedupeKey}`, `visible:${visible}`] : [`visible:${visible}`];
}

function checkQuestion(q: Question, label: string): void {
  if (!q.prompt.trim() || !q.answer.trim() || !q.hint.trim()) failures.push(`${label}: blank prompt, answer or hint`);
  if (q.inputMode === "choices") {
    const answers = q.choices.filter((choice) => choice === q.answer).length;
    if (answers !== 1 || new Set(q.choices).size !== q.choices.length) {
      failures.push(`${label}: missing answer or duplicate choices`);
    }
  }
  if (q.inputMode === "order" && !Array.isArray(q.payload?.items)) failures.push(`${label}: missing order cards`);
}

for (const world of WORLDS) {
  for (const stage of world.stages) {
    if (stageIds.has(stage.id)) failures.push(`Repeated stage id: ${stage.id}`);
    stageIds.add(stage.id);
    for (const seed of SEEDS) {
      const label = `${world.id}/${stage.id} seed ${seed}`;
      try {
        const ctx = { difficulty: 0.2 + 0.6 * (SEEDS.indexOf(seed) / (SEEDS.length - 1)), easier: false };
        const set = generateQuestionSet(stage.generator, stage.params, stage.questions, seed, ctx);
        sessions++;
        questionsChecked += set.length;
        if (set.length !== stage.questions) failures.push(`${label}: ${set.length}/${stage.questions} questions`);
        const seen = new Set<string>();
        for (const q of set) {
          checkQuestion(q, label);
          const identity = keys(q);
          if (identity.some((key) => seen.has(key))) failures.push(`${label}: repeated question ${q.prompt}`);
          identity.forEach((key) => seen.add(key));
        }
        for (const easier of [false, true]) {
          const [replacement] = generateQuestionSet(
            stage.generator, stage.params, 1, seed + 101, { ...ctx, easier }, seen,
          );
          if (!replacement) continue;
          checkQuestion(replacement, `${label} replacement`);
          if (keys(replacement).some((key) => seen.has(key))) failures.push(`${label}: repeated replacement`);
        }
      } catch (error) {
        failures.push(`${label}: ${String(error)}`);
      }
    }
  }
}

for (const worldId of ["capitals", "countrymaps", "flags"]) {
  const world = WORLDS.find((entry) => entry.id === worldId);
  if (!world || world.stages.length !== 55) failures.push(`${worldId}: expected 55 stages`);
  const tokens = new Set<string>();
  for (const stage of world?.stages ?? []) {
    const items = stage.params.items as string[];
    if (items.length < 6) failures.push(`${stage.id}: fewer than six geography facts`);
    for (const token of items) {
      const [code, mode] = token.split(":");
      const country = COUNTRY_BY_CODE.get(code);
      if (!country || tokens.has(token)) failures.push(`${stage.id}: unknown or repeated ${token}`);
      if (mode === "pin" && !country?.capitalPoint) failures.push(`${stage.id}: pin outside map ${code}`);
      if (country && worldId !== "flags" && stage.name.startsWith(country.continent) === false &&
          !stage.name.startsWith("World Tour") && stage.name !== "First Flight") {
        failures.push(`${stage.id}: ${country.name} does not match ${stage.name}`);
      }
      if (country) {
        const [question] = generateQuestionSet(stage.generator, { items: [token] }, 1, 23,
          { difficulty: 0.5, easier: false });
        let expectedAnswer = country.name;
        if (worldId === "capitals" && mode !== "reverse") expectedAnswer = country.capital;
        if (worldId === "flags" && mode === "toFlag") expectedAnswer = flagEmoji(country.iso2);
        if (worldId === "flags" && mode === "toContinent") expectedAnswer = country.continent;
        if (question.answer !== expectedAnswer) failures.push(`${stage.id}: wrong answer for ${token}`);
        if (worldId === "countrymaps" && mode === "select") {
          const selectedCode = (question.payload?.mapChoices as string[])[question.choices.indexOf(question.answer)];
          if (selectedCode !== code) failures.push(`${stage.id}: wrong map choice for ${token}`);
        }
        if (question.payload?.mapCode && question.payload.mapCode !== code) {
          failures.push(`${stage.id}: wrong map artwork for ${token}`);
        }
      }
      tokens.add(token);
    }
  }
  const expected = worldId === "capitals"
    ? COUNTRIES.length * 2 + COUNTRIES.filter((country) => country.capitalPoint).length
    : COUNTRIES.length * 3;
  if (tokens.size !== expected) failures.push(`${worldId}: ${tokens.size}/${expected} assigned facts`);
}

const globalSeen = new Set<string>();
const globalRun = new Map<string, string>();
let globallyEmpty = 0;
let globallyShort = 0;
for (const world of WORLDS) {
  for (const [index, stage] of world.stages.entries()) {
    const set = generateQuestionSet(stage.generator, stage.params, stage.questions, 12345 + index,
      { difficulty: index / Math.max(1, world.stages.length - 1), easier: false }, globalSeen);
    globalRun.set(stage.id, JSON.stringify(set.map((question) =>
      [question.prompt, question.answer, question.choices, question.payload])));
    if (!set.length) globallyEmpty++;
    else if (set.length < stage.questions) globallyShort++;
    for (const question of set) {
      const identity = keys(question);
      if (identity.some((key) => globalSeen.has(key))) failures.push(`${stage.id}: seen in an earlier level`);
      identity.forEach((key) => globalSeen.add(key));
    }
    if ((world.id === "capitals" || world.id === "countrymaps" || world.id === "flags") && set.length !== stage.questions) {
      failures.push(`${stage.id}: geography level cannot fill six questions in sequence`);
    }
  }
}

const replaySeen = new Set<string>();
for (const world of WORLDS) {
  for (const [index, stage] of world.stages.entries()) {
    const set = generateQuestionSet(stage.generator, stage.params, stage.questions, 12345 + index,
      { difficulty: index / Math.max(1, world.stages.length - 1), easier: false }, replaySeen);
    const fingerprint = JSON.stringify(set.map((question) =>
      [question.prompt, question.answer, question.choices, question.payload]));
    if (fingerprint !== globalRun.get(stage.id)) failures.push(`${stage.id}: seeded questions change between runs`);
    set.flatMap(keys).forEach((key) => replaySeen.add(key));
  }
}

if (failures.length) {
  console.error(failures.slice(0, 80).join("\n"));
  console.error(`${failures.length} question audit failures`);
  process.exitCode = 1;
} else {
  console.log(`Question audit passed: ${WORLDS.length} worlds, ${sessions} sessions, ${questionsChecked} questions; ` +
    `${globallyEmpty} legacy levels exhaust their pool, ${globallyShort} finish short in a full playthrough`);
}
