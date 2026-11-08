import { ADAPTATIONS, OBSERVATIONS } from "../src/content/traits/examples";
import { CONCEPTS } from "../src/content/traits/concepts";
import { generateTraits } from "../src/engine/generators/traits";
import type { Question } from "../src/engine/generators/types";
import { mulberry32 } from "../src/engine/rng";

const HARD_COPY = /chisel|baleen|fibrous|fronds|mulch|inherited information|match (the )?body trait|match its origin|more specific word/i;

export function checkTraitsLanguage(question: Question, label: string, failures: string[]): void {
  const text = [question.prompt, question.hint, question.answer, ...question.choices,
    question.payload?.workedExample, question.payload?.speechText].join(" ");
  if (HARD_COPY.test(text)) failures.push(`${label}: technical or unclear wording returned`);
  if (Array.isArray(question.payload?.listRows) && question.payload.listRows.length) {
    failures.push(`${label}: vocabulary lecture appears above the question`);
  }
  if (question.choices.some((choice) => choice.trim().split(/\s+/).length > 12)) {
    failures.push(`${label}: an answer is too long for a short reading task`);
  }
}

/** Guard legacy concrete examples and varied choices for saved sessions. */
export function auditTraitsLanguage(): string[] {
  const failures: string[] = [];
  const wrongPairs = new Set<string>();
  const wrongWords = new Set<string>();
  for (const item of ADAPTATIONS) {
    for (const mode of ["spot", "job", "feature"]) {
      const question = generateTraits({ items: [`${mode}:${item.id}`] }, mulberry32(37), { difficulty: 0.5, easier: false });
      checkTraitsLanguage(question, `traits language ${mode}:${item.id}`, failures);
      if (mode !== "spot") continue;
      const wrong = question.choices.filter((choice) => choice !== question.answer);
      wrongPairs.add(JSON.stringify([...wrong].sort()));
      wrong.forEach((choice) => wrongWords.add(choice));
    }
  }
  if (wrongPairs.size < 24 || wrongWords.size < 20) failures.push("traits: body-part choices repeat too often");
  if (new Set(OBSERVATIONS.map((item) => item.example)).size !== OBSERVATIONS.length) {
    failures.push("traits: concrete origin answers must be distinct examples");
  }
  for (const item of CONCEPTS) {
    const question = generateTraits({ items: [`concept:${item.id}`] }, mulberry32(37), { difficulty: 0.5, easier: false });
    checkTraitsLanguage(question, `traits language concept:${item.id}`, failures);
  }
  return failures;
}
