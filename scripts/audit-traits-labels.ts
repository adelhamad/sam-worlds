import { OBSERVATIONS } from "../src/content/traits/examples";
import { CONCEPTS } from "../src/content/traits/concepts";
import legacyStages from "../src/content/traits/legacyStages.json";
import { generateQuestionSet } from "../src/engine/generators";
import { refreshTraitsQuestion } from "../src/engine/generators/refreshTraits";
import { traitQuestionLabel } from "../src/engine/generators/traitQuestionLabel";
import { traitQuestionSpeech } from "../src/engine/generators/traitQuestionSpeech";
import type { Question } from "../src/engine/generators/types";

function checkMeaning(token: string, title: string, explanation: string, failures: string[]): void {
  const [mode, id] = token.split(":");
  const check = (valid: boolean, message: string) => {
    if (!valid) failures.push(`traits label ${token}: ${message}`);
  };
  if (["spot", "job", "feature", "pair"].includes(mode)) {
    check(/trait/i.test(title) && /adaptation/i.test(title), "body parts need both classifications");
    if (mode === "pair") check(/traits\b/i.test(title) && /adaptations\b/i.test(title), "pair needs plural labels");
  }
  if (mode === "origin") {
    const kind = OBSERVATIONS.find((item) => item.id === id)?.kind;
    const expected = { inherited: /inherited.*trait/i, learned: /learned.*skill/i, acquired: /changed.*trait/i }[kind ?? "acquired"];
    check(expected.test(title) && !/adaptation/i.test(title), "origin classification is misleading");
    check(/(?:not|need more clues).*adaptation/i.test(explanation), "origin alone must not imply adaptation");
  }
  if (mode === "concept" && id === "color-evidence") {
    check(/trait/i.test(title) && !/adaptation/i.test(title), "blue color alone is not evidence of adaptation");
    check(/evidence|need more clues|need.*know|cannot.*tell/i.test(explanation), "color needs an evidence caveat");
  }
  if (mode === "concept" && ["learned-cue", "helpful-learning", "parent-teaching"].includes(id)) {
    check(/learned.*skill/i.test(title), "practice must be classified as learning");
    check(/not.*inherit/i.test(explanation), "a learned skill is not an inherited adaptation");
  }
}

function checkQuestion(question: Question, token: string, failures: string[]): void {
  const before = JSON.stringify(question);
  const { payload, choices } = question;
  const label = traitQuestionLabel(question);
  const speech = traitQuestionSpeech(question);
  if (!label?.title.trim() || !label.explanation.trim()) {
    failures.push(`traits label ${token}: missing title or explanation`);
  } else {
    checkMeaning(token, label.title, label.explanation, failures);
    const originalSpeech = typeof payload?.speechText === "string" ? payload.speechText : question.prompt;
    if (!speech.includes(label.title) || !speech.includes(label.explanation) || !speech.endsWith(originalSpeech)) {
      failures.push(`traits label ${token}: speech lost label or original question`);
    }
  }
  if (question.payload?.traitsCopyVersion !== 3 || refreshTraitsQuestion(question) !== question) {
    failures.push(`traits label ${token}: current v3 question was refreshed`);
  }
  if (JSON.stringify(question) !== before || question.payload !== payload || question.choices !== choices) {
    failures.push(`traits label ${token}: question, payload or choices mutated`);
  }
}

export function auditTraitsLabels(): string[] {
  const failures: string[] = [];
  const tokens = new Set<string>();
  // Saved legacy sessions retain every released label and spoken explanation.
  for (const stage of legacyStages) {
    for (const token of stage.params.items as string[]) tokens.add(token);
  }
  if (tokens.size !== 808) failures.push(`traits labels: expected 808 authored tasks, got ${tokens.size}`);
  for (const mode of ["spot", "origin", "concept", "job", "feature", "pair"]) {
    if (![...tokens].some((token) => token.startsWith(`${mode}:`))) failures.push(`traits labels: missing mode ${mode}`);
  }
  if (CONCEPTS.length !== 24 || CONCEPTS.some((item) => !tokens.has(`concept:${item.id}`))) {
    failures.push("traits labels: expected all 24 authored concepts");
  }
  for (const token of tokens) {
    for (const easier of [false, true]) {
      const [question] = generateQuestionSet("traits", { items: [token] }, 1, 509, { difficulty: 0.5, easier });
      if (question) checkQuestion(question, token, failures);
      else failures.push(`traits label ${token} easier=${easier}: no question`);
    }
  }
  const ordinary: Question = {
    id: "ordinary", dedupeKey: "addition:1:2", inputMode: "choices",
    prompt: "What is one plus two?", answer: "3", choices: ["2", "3", "4"], hint: "Count on.",
  };
  for (const payload of [undefined, { speechText: "One plus two. Two. Three. Four." }, { speechText: 42 }]) {
    const question = { ...ordinary, payload };
    const before = JSON.stringify(question);
    const expected = typeof payload?.speechText === "string" ? payload.speechText : question.prompt;
    if (traitQuestionLabel(question) !== undefined || traitQuestionSpeech(question) !== expected || JSON.stringify(question) !== before) {
      failures.push("traits labels: non-traits label, speech or question changed");
    }
  }
  return failures;
}
