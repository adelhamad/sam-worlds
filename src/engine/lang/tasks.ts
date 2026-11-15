// One builder per task: each turns a target (a phrase, a scene, a letter) into
// a question, or returns null when the lesson's data cannot make a fair one
// (too few other options). Builders never judge and never repeat an option.
import type { GenContext, Question } from "../generators/types";
import { shuffle, type RNG } from "../rng";
import { LANG } from "../../strings/lang";
import { buildAnswer, lettersOf, pairsAnswer } from "./answers";
import { clashes, letterCard, otherLetters, others, phraseCard } from "./cards";
import {
  TRACED, type LangCard, type LangParams, type LangPayload, type LangTask, type LangTile, type LetterCard, type Phrase,
  type PhraseWord,
} from "./types";

export interface Env {
  params: LangParams;
  rng: RNG;
  ctx: GenContext;
  /** Every phrase the child has met: this lesson's and the earlier ones. */
  pool: Phrase[];
  /** New phrases the lesson has not shown yet: sets of several phrases take these first. */
  unmet?: Phrase[];
}

/** Fewest other options for a fair choice. */
const MIN_OTHERS = 2;

export function optionCount(ctx: GenContext): number {
  return ctx.easier || ctx.difficulty < 0.25 ? 3 : 4;
}

export function make(task: LangTask, target: string, prompt: string, answer: string, payload: LangPayload): Question {
  return {
    id: "", prompt, answer, choices: [], hint: LANG.engine.hint, dedupeKey: `lang:${task}:${target}`,
    repeatable: true, inputMode: "tour", payload: payload as unknown as Record<string, unknown>,
  };
}

/** How a phrase is named inside a teach line: the Latin spelling when there is one. */
export const spoken = (phrase: Phrase) => phrase.roman ?? phrase.text;

export function means(phrase: Phrase): string {
  return LANG.engine.means(spoken(phrase), phrase.en);
}

/** How to say a meaning: the teach line of the "produce it" tasks. */
export function sayIt(phrase: Phrase): string {
  return LANG.engine.sayIt(phrase.en, spoken(phrase));
}

export function base(env: Env, task: LangTask, target: string, model: LangCard, explain: string, tip?: string) {
  return { lang: env.params.lang, task, target, model, explain, ...(tip ? { tip } : {}) };
}

/** The phrase and its fair other options, shuffled — or null when there are too few. */
function optionsFor(env: Env, phrase: Phrase, alsoRight: Phrase[] = []): LangCard[] | null {
  const rest = others(phrase, env.pool, optionCount(env.ctx) - 1, env.rng, alsoRight);
  if (rest.length < MIN_OTHERS) return null;
  return shuffle(env.rng, [phrase, ...rest]).map(phraseCard);
}

export function hear(env: Env, phrase: Phrase): Question | null {
  const options = optionsFor(env, phrase);
  if (!options) return null;
  const card = phraseCard(phrase);
  return make("hear", phrase.id, LANG.engine.hear, phrase.id, {
    ...base(env, "hear", phrase.id, card, means(phrase), phrase.tip), tour: "lang-choose",
    hero: { kind: "hear", card }, show: "meaning", options, noRoman: false,
  });
}

export function say(env: Env, phrase: Phrase): Question | null {
  const options = optionsFor(env, phrase);
  if (!options) return null;
  const card = phraseCard(phrase);
  return make("say", phrase.id, LANG.engine.say(LANG.name[env.params.lang]), phrase.id, {
    ...base(env, "say", phrase.id, card, sayIt(phrase), phrase.tip), tour: "lang-choose",
    hero: { kind: "mean", card }, show: "phrase", options, noRoman: false,
  });
}

export function read(env: Env, phrase: Phrase): Question | null {
  const options = optionsFor(env, phrase);
  if (!options) return null;
  const card = phraseCard(phrase);
  return make("read", phrase.id, LANG.engine.read, phrase.id, {
    ...base(env, "read", phrase.id, card, means(phrase), phrase.tip), tour: "lang-choose",
    hero: { kind: "read", card }, show: "meaning", options, noRoman: true,
  });
}

/**
 * `count` phrases to show together with `phrase` (pairs, memory): new phrases
 * the lesson has not shown yet first, then any — never two that could be mixed up.
 */
export function companions(env: Env, phrase: Phrase, count: number): Phrase[] {
  const out: Phrase[] = [];
  for (const other of [...shuffle(env.rng, env.unmet ?? []), ...others(phrase, env.pool, env.pool.length, env.rng)]) {
    if (out.length >= count) break;
    if (![phrase, ...out].some((taken) => clashes(taken, other))) out.push(other);
  }
  return out;
}

export function pairs(env: Env, phrase: Phrase): Question | null {
  const size = env.ctx.easier ? 3 : 4;
  const rest = companions(env, phrase, size - 1);
  if (rest.length < 2) return null;
  const left = shuffle(env.rng, [phrase, ...rest]).map(phraseCard);
  const ids = left.map((card) => card.id);
  return make("pairs", [...ids].sort().join("+"), LANG.engine.pairs, pairsAnswer(ids), {
    ...base(env, "pairs", phrase.id, phraseCard(phrase), means(phrase)), tour: "lang-pairs",
    left, right: shuffle(env.rng, left), noRoman: false,
  });
}

/** Shuffled so the tiles never arrive already in the right order (when they can differ). */
export function scramble(rng: RNG, tiles: LangTile[], right: string[]): LangTile[] {
  for (let attempt = 0; attempt < 8; attempt++) {
    const mixed = shuffle(rng, tiles);
    if (mixed.slice(0, right.length).some((tile, i) => tile.text !== right[i])) return mixed;
  }
  return shuffle(rng, tiles);
}

/**
 * A phrase's words as tiles. A capital on the first word would give the order
 * away, so French sentences start lower-case on the tiles (Arabic has no capitals).
 */
export function tileWords(phrase: Phrase, lang: LangParams["lang"]): PhraseWord[] {
  const words = phrase.words ?? [{ text: phrase.text, roman: phrase.roman }];
  if (lang !== "fr") return words;
  return words.map((word, i) => (i === 0 ? { ...word, text: word.text.charAt(0).toLowerCase() + word.text.slice(1) } : word));
}

/** Phrases with words to put in order. */
export function buildable(pool: Phrase[]): Phrase[] {
  // Two different words at least: "shway shway" has no order to find.
  return pool.filter((phrase) => new Set((phrase.words ?? []).map((word) => bare(word.text))).size >= 2);
}

/** A word without vowel marks, punctuation or capitals: كيفِك and كيفك are the same tile to a child. */
export function bare(text: string): string {
  return text.toLowerCase().replace(/\p{M}/gu, "").replace(/[.!?؟,]/g, "").trim();
}

/**
 * Words that must never be decoy tiles for `phrase`: its own words (also with
 * other vowel marks — the girl's form of a word), and every word that is a
 * `like` twin of one of them (shukran / yislamo), since swapping it in would
 * build another perfectly good sentence.
 */
export function closedWords(phrase: Phrase, words: PhraseWord[], pool: Phrase[]): Set<string> {
  const closed = new Set(words.map((word) => bare(word.text)));
  const twins = pool.filter((other) => !other.words && closed.has(bare(other.text)));
  for (const twin of [phrase, ...twins]) {
    for (const other of pool) {
      if (other.id !== twin.id && clashes(twin, other)) (other.words ?? [{ text: other.text }]).forEach((word) => closed.add(bare(word.text)));
    }
  }
  return closed;
}

export function build(env: Env, phrase: Phrase): Question | null {
  if (!buildable([phrase]).length) return null;
  const { lang } = env.params;
  const words = tileWords(phrase, lang);
  const closed = closedWords(phrase, words, env.pool);
  const spare = shuffle(env.rng, env.pool.flatMap((other) => tileWords(other, lang)))
    .filter((word) => !closed.has(bare(word.text)) && !/\s/.test(word.text));
  const decoys: typeof spare = [];
  const wanted = env.ctx.easier ? 0 : 1 + Number(env.ctx.difficulty > 0.6);
  for (const word of spare) {
    if (decoys.length >= wanted) break;
    if (!decoys.some((taken) => bare(taken.text) === bare(word.text))) decoys.push(word);
  }
  const right = words.map((word) => word.text);
  const tiles = [...words, ...decoys].map((word): LangTile => ({ text: word.text, say: word.text, ...(word.roman ? { roman: word.roman } : {}) }));
  return make("build", phrase.id, LANG.engine.build(LANG.name[env.params.lang]), buildAnswer(right, "word"), {
    ...base(env, "build", phrase.id, phraseCard(phrase), sayIt(phrase), phrase.tip), tour: "lang-build",
    unit: "word", hero: phraseCard(phrase), tiles: scramble(env.rng, tiles, right), rtl: env.params.lang === "ar",
  });
}

export function spell(env: Env, phrase: Phrase): Question | null {
  // Lower-case tiles: a capital would give the first letter away.
  const letters = lettersOf(phrase.text.toLowerCase());
  if (letters.length < 2) return null;
  const inWord = new Set(letters.map((letter) => letter.toLowerCase()));
  const source = env.params.alphabet.length
    ? env.params.alphabet.map((letter) => letter.char)
    : env.params.spell.flatMap((other) => lettersOf(other.text));
  const spare = [...new Set(shuffle(env.rng, source))].filter((letter) => !inWord.has(letter.toLowerCase()));
  const decoys = spare.slice(0, env.ctx.easier ? 1 : 2);
  const drawn = new Map(env.params.alphabet.filter((letter) => letter.draw).map((letter) => [letter.char, letter.draw as string]));
  const tiles = [...letters, ...decoys].map((text): LangTile => ({ text, say: "", ...(drawn.has(text) ? { show: drawn.get(text) } : {}) }));
  return make("spell", phrase.id, LANG.engine.spell, buildAnswer(letters, "letter"), {
    ...base(env, "spell", phrase.id, phraseCard(phrase), means(phrase), phrase.tip), tour: "lang-build",
    unit: "letter", hero: phraseCard(phrase), tiles: scramble(env.rng, tiles, letters), rtl: env.params.lang === "ar",
  });
}

export function phraseOf(env: Env, id: string | undefined): Phrase | undefined {
  return id ? env.pool.find((phrase) => phrase.id === id) : undefined;
}

export function trace(env: Env, letter: LetterCard, guide: "guided" | "memory"): Question {
  return make("trace", `${letter.id}:${guide}`, LANG.engine.trace(letter.name), TRACED, {
    ...base(env, "trace", letter.id, letterCard(letter), LANG.engine.traceTip), tour: "lang-trace", letter, guide,
  });
}

function letterOptions(env: Env, letter: LetterCard): LangCard[] | null {
  const rest = otherLetters(letter, env.params.alphabet, optionCount(env.ctx) - 1, env.rng);
  if (rest.length < MIN_OTHERS) return null;
  return shuffle(env.rng, [letter, ...rest]).map(letterCard);
}

export function sound(env: Env, letter: LetterCard): Question | null {
  const options = letterOptions(env, letter);
  if (!options) return null;
  const card = letterCard(letter);
  return make("sound", letter.id, LANG.engine.sound, letter.id, {
    ...base(env, "sound", letter.id, card, LANG.engine.letterSound(letter.name, letter.sound)), tour: "lang-choose",
    hero: { kind: "read", card }, show: "meaning", options, noRoman: true,
  });
}

export function find(env: Env, letter: LetterCard): Question | null {
  const options = letterOptions(env, letter);
  if (!options) return null;
  const card = letterCard(letter);
  return make("find", letter.id, LANG.engine.find(letter.name), letter.id, {
    ...base(env, "find", letter.id, card, LANG.engine.letterSound(letter.name, letter.sound)), tour: "lang-choose",
    hero: { kind: "hear", card }, show: "phrase", options, noRoman: true,
  });
}
