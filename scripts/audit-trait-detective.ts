import { DETECTIVE_CARDS } from "../src/content/traits/detectiveCards";
import { HABITAT_CASES } from "../src/content/traits/habitatCases";
import { DETECTIVE_TASKS } from "../src/content/traits/detectiveCurriculum";
import { detectiveAnswer, type DetectiveBoard } from "../src/content/traits/detectiveTypes";
import legacyStages from "../src/content/traits/legacyStages.json";
import { TRAIT_PHOTOS } from "../src/content/traits/photoCatalog";
import { WORLDS } from "../src/content/worlds";
import type { StageDef } from "../src/content/types";
import { generateQuestionSet, questionKeys } from "../src/engine/generators";
import { traitQuestionLabel } from "../src/engine/generators/traitQuestionLabel";
import { traitQuestionSpeech } from "../src/engine/generators/traitQuestionSpeech";
import { traitSessionParams } from "../src/engine/generators/traitSessionParams";
import type { Question } from "../src/engine/generators/types";

const MODES = ["notice", "sort", "origins", "compare", "connect"] as const;
const TASK_SIZE = { notice: 3, sort: 3, origins: 3, compare: 2, connect: 1 };
const BOARD_SIZE = { notice: 3, sort: 3, origins: 3, compare: 4, connect: 4 };
const cards = new Map(DETECTIVE_CARDS.map((card) => [card.id, card]));
const habitats = new Map(HABITAT_CASES.map((habitat) => [habitat.id, habitat]));
const nonblank = (text: unknown): text is string => typeof text === "string" && text.trim().length > 0;
const canonical = (solution: Record<string, string>) => Object.entries(solution).sort(([a], [b]) => a.localeCompare(b))
  .map(([id, zone]) => `${id}=${zone}`).join("|");

function science(failures: string[]): void {
  if (cards.size !== DETECTIVE_CARDS.length || habitats.size !== HABITAT_CASES.length) failures.push("detective: duplicate authored IDs");
  if (habitats.size !== 12) failures.push("detective: expected 12 habitat cases");
  for (const card of DETECTIVE_CARDS) {
    const label = `detective card ${card.id}`;
    if (![card.title, card.clue, card.explanation, card.source].every(nonblank)) failures.push(`${label}: missing authored evidence`);
    if (!TRAIT_PHOTOS[card.photo]) failures.push(`${label}: missing photo ${card.photo}`);
    if (!/^https?:\/\//.test(card.source)) failures.push(`${label}: missing source URL`);
    const evidence = `${card.clue} ${card.explanation}`;
    if (card.collection === "adaptation" && (card.origin !== "parents" ||
        !/parent|inherit|born|passed/i.test(evidence) || !/help|protect|keep|catch|reach|surviv|food|water|warm|swim/i.test(evidence))) {
      failures.push(`${label}: adaptation needs parent and function evidence`);
    }
    if (card.origin === "practice" && card.collection !== "outside") failures.push(`${label}: practiced skill is not a body trait`);
    if (card.origin === "change" && card.collection !== "changed") failures.push(`${label}: acquired change is distinct from unknown inherited help`);
    if (card.collection === "unknown" && !/need|unknown|cannot|can't|not know|don't know|does not tell|doesn't tell|no.*clue/i.test(evidence)) {
      failures.push(`${label}: missing evidence must remain uncertain`);
    }
  }
  checkHabitatEvidence(failures);
  // Fixed scientific regression examples do not derive expectations from classification fields.
  const examples = [
    ["duck-feet", "adaptation", "parents"], ["saguaro-stem", "adaptation", "parents"],
    ["dog-white-coat", "unknown", "parents"], ["rose-red-petals", "unknown", "parents"],
    ["learned-swimming", "outside", "practice"], ["learned-piano", "outside", "practice"],
    ["acquired-scar", "changed", "change"], ["acquired-leaf-hole", "changed", "change"],
  ];
  for (const [id, collection, origin] of examples) {
    const card = cards.get(id);
    if (card?.collection !== collection || card?.origin !== origin) failures.push(`detective science ${id}: classification regression`);
  }
}

function checkHabitatEvidence(failures: string[]): void {
  for (const habitat of HABITAT_CASES) {
    const label = `detective habitat ${habitat.id}`;
    if (![habitat.subject, habitat.trait, habitat.explanation, habitat.source].every(nonblank) || !TRAIT_PHOTOS[habitat.photo]) {
      failures.push(`${label}: missing identity, evidence or photo`);
    }
    if (habitat.scenes.length !== 2 || new Set(habitat.scenes.map((scene) => scene.id)).size !== 2 ||
        new Set(habitat.scenes.map((scene) => scene.place)).size !== 2 ||
        new Set(habitat.scenes.map((scene) => scene.helps)).size !== 2) failures.push(`${label}: needs contrasting environments and usefulness`);
    if (habitat.scenes.some((scene) => !nonblank(scene.observation))) failures.push(`${label}: missing scene evidence`);
  }
}

/** Reconstruct placements from authored evidence, independently of board.solution. */
function oracle(token: string): Record<string, string> {
  const task = DETECTIVE_TASKS[token];
  if (!task) throw new Error(`unknown task ${token}`);
  if (task.mode === "connect") return connectOracle(task.ids[0]);
  if (task.mode === "compare") return Object.fromEntries(task.ids.flatMap((id) => {
    const habitat = habitats.get(id);
    if (!habitat) throw new Error(`unknown habitat ${id}`);
    return habitat.scenes.map((scene) => [`${habitat.id}-${scene.id}`, scene.helps ? "helps" : "not-used"]);
  }));
  return Object.fromEntries(task.ids.map((id) => {
    const card = cards.get(id);
    if (!card) throw new Error(`unknown card ${id}`);
    let zone: string | undefined = card.origin;
    if (task.mode === "notice") zone = card.collection === "outside" ? "outside" : "trait";
    if (task.mode === "sort") zone = card.collection;
    if (!zone) throw new Error(`missing origin ${id}`);
    return [id, zone];
  }));
}

function connectOracle(id: string): Record<string, string> {
  const card = cards.get(id);
  if (!card || card.origin !== "parents" || !["adaptation", "unknown"].includes(card.collection)) {
    throw new Error(`connect needs an inherited body feature: ${id}`);
  }
  const known = card.collection === "adaptation";
  return {
    [`${id}-family`]: "parents", [`${id}-job`]: known ? "help" : "not-enough",
    [`${id}-visible`]: "not-enough", [`${id}-name`]: "not-enough",
    "stamp-trait": "yes", "stamp-adaptation": known ? "yes" : "no",
  };
}

function semantic(token: string): string {
  const task = DETECTIVE_TASKS[token];
  if (!task) throw new Error(`unknown task ${token}`);
  return `${task.mode}:${[...task.ids].sort().join(",")}`;
}

function checkQuestion(question: Question, token: string, failures: string[]): void {
  const label = `detective ${token}`;
  const task = DETECTIVE_TASKS[token];
  const payload = question.payload ?? {};
  const board = payload.traitDetective as DetectiveBoard | undefined;
  if (!board || !task) { failures.push(`${label}: missing board or task`); return; }
  const expected = oracle(token);
  if (question.inputMode !== "trait-detective" || question.choices.length !== 0 || payload.traitPedagogyVersion !== 1) {
    failures.push(`${label}: expected version-one interactive board`);
  }
  if (question.dedupeKey !== `traits-detective:${token}` || traitQuestionLabel(question) !== undefined) {
    failures.push(`${label}: legacy identity or answer-revealing label`);
  }
  if (question.answer !== canonical(expected) || canonical(board.solution) !== canonical(expected) ||
      detectiveAnswer(expected) !== canonical(expected)) failures.push(`${label}: incorrect canonical answer`);
  const placements = Object.fromEntries(Object.entries(expected).filter(([id]) => !id.startsWith("stamp-")));
  if (board.mode !== task.mode || board.cards.length !== BOARD_SIZE[task.mode] ||
      canonical(Object.fromEntries(board.cards.map((card) => [card.id, expected[card.id]]))) !== canonical(placements)) {
    failures.push(`${label}: incomplete board or wrong cards`);
  }
  checkBoard(board, expected, label, failures);
  checkUnrevealedSpeech(question, failures);
  if (task.mode === "connect") checkConnect(board, task.ids[0], failures);
  if (![question.prompt, question.hint, board.explanation, payload.answerDisplay,
    payload.workedExample].every(nonblank)) failures.push(`${label}: missing teaching feedback`);
  if (task.mode === "compare") {
    if (board.habitats?.length !== 2) failures.push(`${label}: expected two habitat comparisons`);
    for (const id of task.ids) {
      const authored = habitats.get(id);
      const shown = board.habitats?.find((habitat) => habitat.id === id);
      if (JSON.stringify(shown) !== JSON.stringify(authored)) failures.push(`${label}: animal, trait or environment evidence changed`);
    }
  }
}

function checkUnrevealedSpeech(question: Question, failures: string[]): void {
  const before = JSON.stringify(question);
  const authoredSpeech = question.payload?.speechText;
  const expected = typeof authoredSpeech === "string" ? authoredSpeech : question.prompt;
  if (traitQuestionSpeech(question) !== expected || JSON.stringify(question) !== before) {
    failures.push(`${question.dedupeKey}: speech helper added a label/answer or mutated the question`);
  }
}

function checkBoard(board: DetectiveBoard, expected: Record<string, string>, label: string, failures: string[]): void {
  if (new Set(board.cards.map((card) => card.id)).size !== board.cards.length ||
      new Set(board.zones.map((zone) => zone.id)).size !== board.zones.length) failures.push(`${label}: duplicate card/zone IDs`);
  for (const card of board.cards) {
    if (!board.zones.some((zone) => zone.id === expected[card.id])) failures.push(`${label}: card ${card.id} has no correct zone`);
    if (card.photo && !TRAIT_PHOTOS[card.photo]) failures.push(`${label}: invalid tile photo`);
    if (![card.title, card.clue].every(nonblank)) failures.push(`${label}: missing tile evidence`);
    if (board.mode !== "compare" && board.mode !== "connect") {
      const authored = cards.get(card.id);
      if (card.photo !== authored?.photo || card.clue !== authored?.clue || card.title !== authored?.title) {
        failures.push(`${label}: changed authored evidence or missing subject photo`);
      }
    }
  }
  if (board.mode === "sort") {
    for (const id of ["adaptation", "unknown", "changed"]) {
      if (board.zones.find((zone) => zone.id === id)?.group !== "traits") failures.push(`${label}: ${id} must be inside body traits`);
    }
    if (board.zones.find((zone) => zone.id === "outside")?.group === "traits") failures.push(`${label}: objects/skills entered body traits`);
  }
}

function checkConnect(board: DetectiveBoard, id: string, failures: string[]): void {
  const label = `detective connect ${id}`;
  const card = cards.get(id);
  if (!board.claim || ![board.claim.title, board.claim.clue].every(nonblank) || board.claim.photo !== card?.photo) {
    failures.push(`${label}: missing subject claim or valid subject photo`);
  }
  if (Object.keys(board.solution).length !== 6 || board.solution["stamp-trait"] !== "yes") {
    failures.push(`${label}: four evidence placements and two independent stamps required`);
  }
  if (board.zones.length !== 3 || ["parents", "help", "not-enough"].some((id) => !board.zones.some((zone) => zone.id === id))) {
    failures.push(`${label}: missing evidence destinations`);
  }
}

function checkToken(token: string, failures: string[]): void {
  const task = DETECTIVE_TASKS[token];
  if (task.ids.length !== TASK_SIZE[task.mode] || new Set(task.ids).size !== task.ids.length) {
    failures.push(`detective: wrong task size ${token}`);
  }
  for (const easier of [false, true]) {
    const params = { items: [token], pedagogy: 1 };
    const context = { difficulty: 0.5, easier };
    const questions = generateQuestionSet("traits", params, 1, 509, context);
    const replay = generateQuestionSet("traits", params, 1, 509, context);
    if (!questions[0]) failures.push(`detective: no question ${token}`);
    else checkQuestion(questions[0], token, failures);
    if (JSON.stringify(questions) !== JSON.stringify(replay)) failures.push(`detective: nondeterministic ${token}`);
  }
}

function checkStages(stages: StageDef[], failures: string[]): void {
  const tokens = new Set<string>();
  const meanings = new Set<string>();
  const modes = new Set<string>();
  if (stages.length !== 55) failures.push("detective: expected 55 released stages");
  for (const [index, stage] of stages.entries()) {
    const archived = legacyStages[index];
    for (const field of ["id", "payout", "skill", "questions"] as const) {
      if (stage[field] !== archived?.[field]) failures.push(`${stage.id}: released ${field} changed`);
    }
    const items = stage.params.items;
    if (stage.generator !== "traits" || stage.questions !== 6 || stage.params.pedagogy !== 1 ||
        !Array.isArray(items) || items.length < 12 || !items.every(nonblank)) {
      failures.push(`${stage.id}: needs six boards, pedagogy 1 and twelve authored tasks`);
      continue;
    }
    for (const token of items as string[]) {
      try {
        const key = semantic(token);
        if (tokens.has(token) || meanings.has(key)) failures.push(`${stage.id}: duplicate unordered task ${token}`);
        tokens.add(token); meanings.add(key); modes.add(DETECTIVE_TASKS[token].mode);
        checkToken(token, failures);
      } catch (error) { failures.push(`${stage.id} ${token}: ${String(error)}`); }
    }
  }
  if (tokens.size !== 660) failures.push(`detective: expected 660 tasks, got ${tokens.size}`);
  for (const mode of MODES) if (!modes.has(mode)) failures.push(`detective: missing ${mode}`);
  for (const token of Object.keys(DETECTIVE_TASKS)) if (!tokens.has(token)) failures.push(`detective: untested task ${token}`);
}

function checkProgression(stages: StageDef[], failures: string[]): void {
  const tasks = Object.values(DETECTIVE_TASKS);
  const compare = tasks.filter((task) => task.mode === "compare");
  const connect = tasks.filter((task) => task.mode === "connect");
  if (compare.length !== 66) failures.push("detective: expected all 66 unordered habitat pairs");
  if (connect.length !== 20 || connect.filter((task) => cards.get(task.ids[0])?.collection === "adaptation").length !== 12 ||
      connect.filter((task) => cards.get(task.ids[0])?.collection === "unknown").length !== 8) {
    failures.push("detective: connect needs twelve supported adaptations and eight insufficient-evidence cases");
  }
  for (const [index, stage] of stages.entries()) {
    const modes = new Set((stage.params.items as string[]).map((token) => DETECTIVE_TASKS[token]?.mode));
    const band = [[8, "notice"], [22, "sort"], [30, "origins"], [34, "compare"], [35, "connect"]] as const;
    const focused = band.find(([end]) => index < end)?.[1];
    if (focused && (modes.size !== 1 || !modes.has(focused))) failures.push(`${stage.id}: wrong focused teaching mode`);
    if (index >= 37 && !modes.has("compare")) failures.push(`${stage.id}: late stage lost habitat comparison`);
    if (index >= 47 && !modes.has("connect")) failures.push(`${stage.id}: late stage lost evidence construction`);
  }
  const late = stages.slice(35).flatMap((stage) => stage.params.items as string[]).map((token) => DETECTIVE_TASKS[token]?.mode);
  if (late.filter((mode) => mode === "compare").length !== 18 || late.filter((mode) => mode === "connect").length !== 8) {
    failures.push("detective: mixed stages must revisit eighteen comparisons and eight evidence constructions");
  }
}

function sequential(stages: StageDef[], failures: string[]): void {
  for (const easier of [false, true]) {
    const seen = new Set<string>();
    const meanings = new Set<string>();
    const ids = new Set<string>();
    for (const [index, stage] of stages.entries()) {
      try {
        const context = { difficulty: index / 54, easier };
        for (const [count, seed] of [[6, 12345 + index], [2, 22345 + index]]) {
          const questions = generateQuestionSet("traits", stage.params, count, seed, context, seen);
          if (questions.length !== count) failures.push(`${stage.id}: fresh board exhaustion easier=${easier}`);
          for (const question of questions) {
            const token = question.dedupeKey?.replace(/^traits-detective:/, "") ?? "";
            const key = semantic(token);
            if (meanings.has(key) || ids.has(question.id)) failures.push(`${stage.id}: repeated board or question ID`);
            meanings.add(key); ids.add(question.id);
            questionKeys(question).forEach((value) => seen.add(value));
            checkQuestion(question, token, failures);
          }
        }
      } catch (error) { failures.push(`${stage.id}: sequential ${String(error)}`); }
    }
  }
}

function replacementRouting(stages: StageDef[], failures: string[]): void {
  for (const [index, stage] of stages.entries()) {
    const archived = legacyStages[index];
    if (!archived) continue;
    const legacy = generateQuestionSet("traits", archived.params, 1, 37, { difficulty: 0.5, easier: false })[0];
    const current = generateQuestionSet("traits", stage.params, 1, 37, { difficulty: 0.5, easier: false })[0];
    for (const [question, expected, prefix] of [[legacy, archived.params, "traits:"], [current, stage.params, "traits-detective:"]] as const) {
      if (!question) { failures.push(`${stage.id}: missing resume question`); continue; }
      const before = JSON.stringify(question);
      const params = traitSessionParams(stage.id, question, stage.params);
      if (JSON.stringify(params) !== JSON.stringify(expected) || JSON.stringify(question) !== before) failures.push(`${stage.id}: wrong resume pool or mutation`);
      const replacements = generateQuestionSet("traits", params, 2, 38, { difficulty: 0.5, easier: true }, new Set(questionKeys(question)));
      if (replacements.length !== 2 || replacements.some((replacement) => !replacement.dedupeKey?.startsWith(prefix))) {
        failures.push(`${stage.id}: replacement switched saved pedagogy`);
      }
    }
  }
}

export function auditTraitDetective(): string[] {
  const failures: string[] = [];
  const stages = WORLDS.find((world) => world.id === "traits")?.stages ?? [];
  science(failures);
  checkStages(stages, failures);
  checkProgression(stages, failures);
  sequential(stages, failures);
  replacementRouting(stages, failures);
  return failures;
}
