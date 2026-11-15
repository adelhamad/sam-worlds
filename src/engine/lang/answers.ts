// Canonical answer strings for language questions. The planner uses these to
// set `question.answer`; the widgets use the SAME helpers to serialise what the
// child built, so the shared answer engine judges with plain equality.
export { pairsAnswer, pairsMiss } from "../tour/answers";

/** build: the tiles the child placed, in order — words joined by a space, letters by nothing. */
export function buildAnswer(tiles: string[], unit: "word" | "letter"): string {
  return tiles.join(unit === "word" ? " " : "");
}

/** Arabic marks that are not letters (harakat, tatweel) — never part of a spelling tile. */
const MARKS = /[ً-ْٰـ]/g;

/** The letters of a word as tiles: marks dropped, one tile per letter. */
export function lettersOf(word: string): string[] {
  return Array.from(word.replace(MARKS, "").replace(/[\s'’\-.,!?؟]/g, ""));
}
