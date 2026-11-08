import { ADAPTATIONS, type Adaptation } from "../../content/traits/examples";
import { ADAPTATION_PICTURES } from "../../content/traits/pictureMap";
import type { Question } from "./types";

const adaptations = new Map(ADAPTATIONS.map((item) => [item.id, item]));
const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** A separate worked example teaches the labels without solving the active task.
 * This reads existing content only: no RNG, payload mutation or save migration. */
export function traitLessonExample(items: readonly string[], question: Question): Adaptation | undefined {
  if (!question.dedupeKey?.startsWith("traits:")) return undefined;
  const pictured = new Set(Array.isArray(question.payload?.traitPictureIds) ? question.payload.traitPictureIds : []);
  const cards = Array.isArray(question.payload?.items) ? question.payload.items as string[] : [];
  const protectedText = [question.prompt, question.answer, ...question.choices, ...cards].map(normalize);
  const lessonExamples = items.flatMap((token) => token.split(":").slice(1))
    .flatMap((id) => adaptations.has(id) ? [adaptations.get(id)!] : []);
  return [...lessonExamples, ...ADAPTATIONS].find((item) => {
    if (pictured.has(ADAPTATION_PICTURES[item.id])) return false;
    const facts = [item.trait, item.job].map(normalize);
    return !protectedText.some((text) => facts.some((fact) => text.includes(fact) || fact.includes(text)));
  });
}
