import { ADAPTATIONS, OBSERVATIONS } from "../src/content/traits/examples";
import { CONCEPTS } from "../src/content/traits/concepts";
import { refreshTraitsQuestion, traitsCopySeed } from "../src/engine/generators/refreshTraits";
import { generateTraits, TRAITS_COPY_VERSION } from "../src/engine/generators/traits";
import type { Question } from "../src/engine/generators/types";
import { mulberry32 } from "../src/engine/rng";
import type { SessionRow } from "../src/engine/save/db";

const ARROW = " → ";

function current(token: string, easier = false): Question {
  return generateTraits({ items: [token] }, mulberry32(traitsCopySeed(token)), { difficulty: 0.5, easier });
}

function oldCopy(token: string, count: number, answerIndex: number): Question {
  return {
    id: "saved-question-unchanged", dedupeKey: `traits:${token}`, inputMode: "choices",
    prompt: "Old difficult prompt", hint: "Old difficult hint", answer: "Old correct answer",
    choices: Array.from({ length: count }, (_, index) => index === answerIndex ? "Old correct answer" : `Old distractor ${index}`),
    payload: { traitsCopyVersion: 2, listRows: ["Old reading note"], workedExample: "Old explanation",
      speechText: "Old speech", traitOrganisms: ["Old organism"], unrelated: { keep: true } },
  };
}

function checkPictures(refreshed: Question, expected: Question, label: string, failures: string[]): void {
  const pictures = refreshed.payload?.traitPictureIds;
  const expectedPictures = expected.payload?.traitPictureIds as string[];
  if (refreshed.payload?.traitsCopyVersion !== TRAITS_COPY_VERSION || !Array.isArray(pictures) ||
      JSON.stringify([...pictures].sort()) !== JSON.stringify([...expectedPictures].sort())) {
    failures.push(`${label}: saved question did not gain all subject pictures`);
  }
}

function checkCommon(old: Question, refreshed: Question, expected: Question, label: string, failures: string[]): void {
  checkPictures(refreshed, expected, label, failures);
  if (refreshed.id !== old.id || refreshed.dedupeKey !== old.dedupeKey || refreshed.inputMode !== old.inputMode) {
    failures.push(`${label}: question identity or input mode changed`);
  }
  if (refreshed.prompt !== expected.prompt || refreshed.answer !== expected.answer || refreshed.hint !== expected.hint) {
    failures.push(`${label}: current authored wording or answer missing`);
  }
  for (const field of ["listRows", "workedExample", "traitOrganisms"]) {
    if (JSON.stringify(refreshed.payload?.[field]) !== JSON.stringify(expected.payload?.[field])) {
      failures.push(`${label}: stale ${field}`);
    }
  }
  if (refreshed.payload?.unrelated !== old.payload?.unrelated) failures.push(`${label}: unrelated payload changed`);
  const cards = refreshed.inputMode === "order" ? refreshed.payload?.items as string[] : refreshed.choices;
  const notes = (refreshed.payload?.listRows as string[] | undefined) ?? [];
  if (refreshed.payload?.speechText !== [refreshed.prompt, ...notes, ...cards].join(". ")) {
    failures.push(`${label}: speech does not follow refreshed display order`);
  }
  if (JSON.stringify(refreshTraitsQuestion(refreshed)) !== JSON.stringify(refreshed)) failures.push(`${label}: refresh not idempotent`);
}

function checkChoices(token: string, failures: string[]): void {
  for (const count of [2, 3, 4]) {
    for (let answerIndex = 0; answerIndex < count; answerIndex++) {
      const label = `traits resume ${token} choices=${count} answer=${answerIndex}`;
      const old = oldCopy(token, count, answerIndex);
      const before = JSON.stringify(old);
      const expected = current(token, count === 2);
      const refreshed = refreshTraitsQuestion(old);
      checkCommon(old, refreshed, expected, label, failures);
      const expectedWrong = expected.choices.filter((choice) => choice !== expected.answer);
      const actualWrong = refreshed.choices.filter((choice) => choice !== refreshed.answer);
      if (refreshed.choices.length !== expected.choices.length || refreshed.choices.indexOf(refreshed.answer) !== answerIndex ||
          JSON.stringify(actualWrong) !== JSON.stringify(expectedWrong)) failures.push(`${label}: choices redrawn incorrectly`);
      if (JSON.stringify(old) !== before) failures.push(`${label}: saved question mutated`);
    }
  }
}

function pairCopy(token: string): Question {
  const roles = ["Old first trait", "Old first job", "Old second trait", "Old second job"];
  return {
    ...oldCopy(token, 3, 1), inputMode: "order", choices: [], answer: roles.join(ARROW),
    payload: { ...oldCopy(token, 3, 1).payload, items: [roles[2], roles[0], roles[3], roles[1]], arrow: "→" },
  };
}

function checkPair(token: string, failures: string[]): void {
  const old = pairCopy(token);
  const before = JSON.stringify(old);
  const expected = current(token);
  const refreshed = refreshTraitsQuestion(old);
  checkCommon(old, refreshed, expected, `traits resume ${token}`, failures);
  const roles = expected.answer.split(ARROW);
  if (JSON.stringify(refreshed.payload?.items) !== JSON.stringify([roles[2], roles[0], roles[3], roles[1]]) ||
      refreshed.choices.length !== 0) failures.push("traits resume pair: shuffled role positions changed");
  if (JSON.stringify(old) !== before) failures.push("traits resume pair: saved question mutated");
}

function checkMalformed(choiceToken: string, pairToken: string, failures: string[]): void {
  const choice = oldCopy(choiceToken, 3, 1);
  const pair = pairCopy(pairToken);
  const fixtures: Question[] = [
    { ...choice, dedupeKey: undefined },
    { ...choice, dedupeKey: "another:subject" },
    { ...choice, dedupeKey: "traits:unknown:missing" },
    { ...choice, dedupeKey: "traits:spot:missing" },
    { ...choice, dedupeKey: `${choice.dedupeKey}:extra` },
    { ...choice, choices: ["Missing correct answer", "Another answer"] },
    { ...choice, choices: [choice.answer, choice.answer] },
    { ...choice, choices: [choice.answer] },
    { ...choice, choices: [choice.answer, "", "Other answer"] },
    { ...choice, choices: undefined as unknown as string[] },
    { ...choice, answer: undefined as unknown as string },
    { ...choice, inputMode: "order" },
    { ...pair, answer: "Not four roles" },
    { ...pair, payload: {} },
    { ...pair, payload: { items: ["Unknown card", "Other card", "Third card", "Fourth card"] } },
    { ...pair, payload: { items: Array<string>(4).fill("Old first trait") } },
    { ...pair, dedupeKey: "traits:pair:duck-feet" },
    { ...pair, dedupeKey: "traits:pair:duck-feet:duck-feet" },
  ];
  for (const [index, fixture] of fixtures.entries()) {
    if (refreshTraitsQuestion(fixture) !== fixture) failures.push(`traits resume malformed ${index}: changed question`);
  }
}

function checkSession(token: string, failures: string[]): void {
  const row: SessionRow = {
    id: 1, stageId: "traits-01", seed: 98217, questions: [oldCopy(token, 2, 1)],
    seenQuestionKeys: ["subject:already-seen", "visible:old-copy"], index: 0,
    correctCount: 2, firstTryMisses: 1, missStreak: 1, attemptMissed: true,
    wrongStamps: [1000, 2100], proveLeft: 2,
  };
  const saved = { ...row, showHint: true, workedExample: "Previous discarded question solved",
    lastAnswer: "wrong", revealed: false, companionLine: "Take your time" };
  const refreshed = { ...saved, questions: saved.questions.map(refreshTraitsQuestion) };
  const { questions: oldQuestions, ...oldMetadata } = saved;
  const { questions: newQuestions, ...newMetadata } = refreshed;
  if (JSON.stringify(oldMetadata) !== JSON.stringify(newMetadata) ||
      refreshed.seenQuestionKeys !== saved.seenQuestionKeys || oldQuestions[0] === newQuestions[0]) {
    failures.push("traits resume: session metadata/history changed or wording not refreshed");
  }
}

function checkScreenshotRegression(failures: string[]): void {
  const old: Question = {
    id: "traits-saved-beaver", dedupeKey: "traits:spot:beaver-teeth", inputMode: "choices",
    prompt: "beaver: match the body trait.", answer: "strong chisel-shaped front teeth",
    choices: ["mud stuck on its body", "strong chisel-shaped front teeth", "a trick learned through practice"],
    hint: "A body trait is part of a living thing.",
    payload: { listRows: ["Chisel-shaped means having a sharp cutting edge."] },
  };
  const refreshed = refreshTraitsQuestion(old);
  if (refreshed.prompt !== "Which part does a beaver have?" ||
      /chisel|match the body trait/i.test(JSON.stringify(refreshed)) ||
      refreshed.payload?.listRows !== undefined || refreshed.choices.indexOf(refreshed.answer) !== 1 ||
      refreshed.choices.length !== 4 || !Array.isArray(refreshed.payload?.traitPictureIds)) {
    failures.push("traits resume: the parent's confusing beaver screenshot can still return");
  }
}

/** Saved-copy compatibility checks, independent of browser storage and grading. */
export function auditTraitsResume(): string[] {
  const failures: string[] = [];
  const adaptation = ADAPTATIONS[0].id;
  const pairToken = `pair:${adaptation}:${ADAPTATIONS[1].id}`;
  const tokens = [`spot:${adaptation}`, `origin:${OBSERVATIONS[0].id}`, `concept:${CONCEPTS[0].id}`,
    `job:${adaptation}`, `feature:${adaptation}`];
  for (const token of tokens) checkChoices(token, failures);
  for (const token of [...tokens, pairToken]) {
    const fresh = generateTraits({ items: [token] }, mulberry32(101), { difficulty: 0.5, easier: false });
    if (refreshTraitsQuestion(fresh) !== fresh) failures.push(`traits resume ${token}: current-copy question was redrawn`);
  }
  checkPair(pairToken, failures);
  checkMalformed(tokens[0], pairToken, failures);
  checkSession(tokens[0], failures);
  checkScreenshotRegression(failures);
  return failures;
}
