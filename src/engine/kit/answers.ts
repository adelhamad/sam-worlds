// Canonical answer strings for Course Kit questions. The planner uses these to
// set `question.answer`; the widgets use the SAME helpers to serialise what the
// child built, so the shared answer engine judges with plain equality.
export { pairsAnswer, pairsMiss, sortAnswer } from "../tour/answers";

/** order: card ids, first card first. */
export function orderAnswer(ids: string[]): string {
  return ids.join(">");
}

/** build: the word tiles the child placed, in order. */
export function sentenceAnswer(words: string[]): string {
  return words.join(" ");
}
