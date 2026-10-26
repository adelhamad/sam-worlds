import { WORLDS } from "../src/content/worlds";
import { generateQuestionSet } from "../src/engine/generators";
import type { Question } from "../src/engine/generators/types";
import { COUNTRY_BY_CODE, COUNTRIES, flagEmoji } from "../src/engine/generators/geography";
import { STATS_BY_CODE, areaLabel, countryLabel, populationLabel, rankedCountry } from "../src/engine/generators/countryStats";

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

if (STATS_BY_CODE.size !== COUNTRIES.length) failures.push("Country statistics do not cover every map country");
for (const country of COUNTRIES) {
  const stats = STATS_BY_CODE.get(country.code);
  if (!stats || stats.landKm2 <= 0 || stats.population <= 0 || stats.populationYear !== 2024 ||
      ![2023, 2024].includes(stats.landYear)) failures.push(`Missing or invalid statistics: ${country.code}`);
}

const usedLandPairs = new Set<string>();
const usedPopulationPairs = new Set<string>();
const STAT_MODES: Record<string, string[]> = {
  landduel: [...Array<string>(18).fill("larger"), ...Array<string>(18).fill("smaller"), ...Array<string>(19).fill("order")],
  areaatlas: [...Array<string>(18).fill("estimate"), ...Array<string>(9).fill("ratio2"),
    ...Array<string>(9).fill("ratio3"), ...Array<string>(9).fill("ratio5"), ...Array<string>(10).fill("ratio10")],
  population: [...Array<string>(18).fill("estimate"), ...Array<string>(18).fill("more"), ...Array<string>(19).fill("fewer")],
};
function pairKey(a: string, b: string): string { return [a, b].sort().join(":"); }
function claimPair(a: string, b: string, used: Set<string>, label: string): void {
  const key = pairKey(a, b);
  if (used.has(key)) failures.push(`${label}: repeated country pair ${key}`);
  used.add(key);
}
function roundedArea(value: number): number {
  if (value >= 1_000_000_000) return Math.round(value / 100_000_000) * 100_000_000;
  if (value >= 1_000_000) return Math.round(value / 100_000) * 100_000;
  if (value >= 1_000) return Math.round(value / 100) * 100;
  return Math.round(value * 10) / 10;
}

for (const worldId of ["landduel", "areaatlas", "population"]) {
  const world = WORLDS.find((entry) => entry.id === worldId);
  if (!world || world.stages.length !== 55) failures.push(`${worldId}: expected 55 stages`);
  const tokens = new Set<string>();
  for (const [stageIndex, stage] of (world?.stages ?? []).entries()) {
    const items = stage.params.items as string[];
    if (stage.generator !== worldId || items.length !== 8) failures.push(`${stage.id}: invalid stage facts`);
    const expectedMode = STAT_MODES[worldId][stageIndex];
    if (items.some((item) => item.split(":").at(-1) !== expectedMode)) {
      failures.push(`${stage.id}: question mode does not match chapter`);
    }
    if (stageIndex === 0) {
      const familiar = new Set(["ARE", "SAU", "EGY", "FRA", "JPN", "USA", "BRA", "AUS"]);
      if (items.some((item) => item.split(":").slice(0, -1).some((code) => !familiar.has(code)))) {
        failures.push(`${stage.id}: launch contains unfamiliar countries`);
      }
    }
    for (const token of items) {
      if (tokens.has(token)) failures.push(`${stage.id}: repeated ${token}`);
      tokens.add(token);
      const parts = token.split(":");
      const mode = parts.pop();
      const facts = parts.map((code) => rankedCountry(code));
      const [question] = generateQuestionSet(stage.generator, { items: [token] }, 1, 42,
        { difficulty: 0.5, easier: false });
      let expected: string;
      if (worldId === "landduel") {
        if (mode === "order") {
          if (facts.length !== 3) failures.push(`${stage.id}: invalid land podium`);
          const ordered = [...facts].sort((a, b) => b.stats.landKm2 - a.stats.landKm2);
          expected = ordered.map((item) => countryLabel(item.country)).join(" → ");
          for (let i = 0; i < parts.length; i++) {
            for (let j = i + 1; j < parts.length; j++) claimPair(parts[i], parts[j], usedLandPairs, stage.id);
          }
        } else {
          if (facts.length !== 2 || !["larger", "smaller"].includes(mode ?? "")) failures.push(`${stage.id}: invalid land duel`);
          const sorted = [...facts].sort((a, b) => b.stats.landKm2 - a.stats.landKm2);
          expected = countryLabel((mode === "larger" ? sorted[0] : sorted[1]).country);
          claimPair(parts[0], parts[1], usedLandPairs, stage.id);
        }
      } else if (worldId === "areaatlas") {
        if (mode === "estimate") {
          if (facts.length !== 1 || question.payload?.mapCode !== parts[0]) failures.push(`${stage.id}: wrong area map`);
          expected = areaLabel(facts[0].stats.landKm2);
        } else {
          const factor = Number(mode?.replace("ratio", ""));
          if (facts.length !== 2 || ![2, 3, 5, 10].includes(factor)) failures.push(`${stage.id}: invalid area ratio`);
          const ratio = Math.max(...facts.map((item) => item.stats.landKm2)) /
            Math.min(...facts.map((item) => item.stats.landKm2));
          if (Math.abs(ratio / factor - 1) > 0.12) failures.push(`${stage.id}: ambiguous ratio ${token}`);
          const shown = facts.map((item) => roundedArea(item.stats.landKm2));
          const shownRatio = Math.max(...shown) / Math.min(...shown);
          const nearest = [2, 3, 5, 10].sort((a, b) => Math.abs(shownRatio - a) - Math.abs(shownRatio - b))[0];
          if (nearest !== factor) failures.push(`${stage.id}: displayed area numbers mislead for ${token}`);
          expected = `about ${factor}×`;
          claimPair(parts[0], parts[1], usedLandPairs, stage.id);
        }
      } else if (mode === "estimate") {
        if (facts.length !== 1 || question.payload?.mapCode !== parts[0]) failures.push(`${stage.id}: wrong population map`);
        expected = populationLabel(facts[0].stats.population);
      } else {
        if (facts.length !== 2 || !["more", "fewer"].includes(mode ?? "")) failures.push(`${stage.id}: invalid people duel`);
        const sorted = [...facts].sort((a, b) => b.stats.population - a.stats.population);
        expected = countryLabel((mode === "more" ? sorted[0] : sorted[1]).country);
        claimPair(parts[0], parts[1], usedPopulationPairs, stage.id);
      }
      if (question.answer !== expected) failures.push(`${stage.id}: wrong answer for ${token}`);
      checkQuestion(question, `${stage.id} fact ${token}`);
    }
  }
  if (tokens.size !== 440) failures.push(`${worldId}: ${tokens.size}/440 assigned prompts`);
  for (const stage of world?.stages ?? []) {
    const seen = new Set<string>();
    for (const [replay, expectedCount] of [6, 2, 0].entries()) {
      const set = generateQuestionSet(stage.generator, stage.params, stage.questions,
        30001 + replay * 271, { difficulty: 0.5, easier: false }, seen);
      if (set.length !== expectedCount) failures.push(`${stage.id}: replay ${replay + 1} has ${set.length}/${expectedCount} fresh questions`);
      for (const question of set) {
        if (keys(question).some((key) => seen.has(key))) failures.push(`${stage.id}: replay repeated a question`);
        keys(question).forEach((key) => seen.add(key));
      }
    }
  }
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
    if (["capitals", "countrymaps", "flags", "landduel", "areaatlas", "population"].includes(world.id) && set.length !== stage.questions) {
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
