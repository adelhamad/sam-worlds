// Turns content (phrases, letters) into the cards questions carry, and picks
// the "other" options of a question so that none of them could also be right.
import { shuffle, type RNG } from "../rng";
import type { LangCard, LetterCard, Phrase } from "./types";

export function phraseCard(phrase: Phrase): LangCard {
  return {
    id: phrase.id, text: phrase.text, say: phrase.say ?? phrase.text, en: phrase.en,
    ...(phrase.roman ? { roman: phrase.roman } : {}),
    ...(phrase.art ? { art: phrase.art } : {}),
  };
}

export function letterCard(letter: LetterCard): LangCard {
  return { id: letter.id, text: letter.char, roman: letter.name, say: letter.say ?? letter.char, en: letter.sound, letter: true };
}

/** Compared without punctuation and without Arabic vowel marks. */
const norm = (text: string) => text.trim().toLowerCase().replace(/[.!?؟,]/g, "").replace(/\p{M}/gu, "");

/** True when `other` could be mistaken for a right answer where `phrase` is the answer. */
export function clashes(phrase: Phrase, other: Phrase): boolean {
  return phrase.id === other.id
    || norm(phrase.en) === norm(other.en)
    || norm(phrase.text) === norm(other.text)
    || Boolean(phrase.like?.includes(other.id))
    || Boolean(other.like?.includes(phrase.id));
}

/**
 * Up to `count` phrases to stand next to `target` as the other options: never
 * one that clashes with it (or with anything in `alsoRight`), never two with
 * the same meaning, same-topic phrases first so the choice is a real one.
 */
export function others(target: Phrase, pool: Phrase[], count: number, rng: RNG, alsoRight: Phrase[] = []): Phrase[] {
  const right = [target, ...alsoRight];
  const free = shuffle(rng, pool).filter((phrase) => !right.some((item) => clashes(item, phrase)));
  const near = free.filter((phrase) => target.topic && phrase.topic === target.topic);
  const far = free.filter((phrase) => !near.includes(phrase));
  const out: Phrase[] = [];
  for (const phrase of [...near, ...far]) {
    if (out.length >= count) break;
    if (!out.some((taken) => clashes(taken, phrase))) out.push(phrase);
  }
  return out;
}

/** Letters to stand next to `target`: a different letter with a different sound. */
export function otherLetters(target: LetterCard, alphabet: LetterCard[], count: number, rng: RNG): LetterCard[] {
  const out: LetterCard[] = [];
  for (const letter of shuffle(rng, alphabet)) {
    if (out.length >= count) break;
    const taken = [target, ...out];
    if (!taken.some((item) => item.id === letter.id || item.sound === letter.sound || item.char === letter.char)) out.push(letter);
  }
  return out;
}
