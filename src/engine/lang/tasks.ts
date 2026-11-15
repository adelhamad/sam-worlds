// One builder per task: each turns a target (a phrase, a scene, a letter) into
// a question, or returns null when the lesson's data cannot make a fair one
// (too few other options). Builders never judge and never repeat an option.
import type { GenContext, Question } from "../generators/types";
import { shuffle, type RNG } from "../rng";
import { LANG } from "../../strings/lang";
import { buildAnswer, lettersOf, pairsAnswer } from "./answers";
import { letterCard, otherLetters, others, phraseCard } from "./cards";
import {
  TRACED, type LangCard, type LangParams, type LangPayload, type LangTask, type LangTile, type LetterCard, type Phrase, type Scene,
} from "./types";

export interface Env {
  params: LangParams;
  rng: RNG;
  ctx: GenContext;
  /** Every phrase the child has met: this lesson's and the earlier ones. */
  pool: Phrase[];
}

/** Fewest other options for a fair choice. */
const MIN_OTHERS = 2;

function optionCount(ctx: GenContext): number {
  return ctx.easier || ctx.difficulty < 0.25 ? 3 : 4;
}

function make(task: LangTask, target: string, prompt: string, answer: string, payload: LangPayload): Question {
  return {
    id: "", prompt, answer, choices: [], hint: LANG.engine.hint, dedupeKey: `lang:${task}:${target}`,
    repeatable: true, inputMode: "tour", payload: payload as unknown as Record<string, unknown>,
  };
}

/** How a phrase is named inside a teach line: the Latin spelling when there is one. */
const spoken = (phrase: Phrase) => phrase.roman ?? phrase.text;

function means(phrase: Phrase): string {
  return phrase.tip ?? LANG.engine.means(spoken(phrase), phrase.en);
}

function base(env: Env, task: LangTask, target: string, model: LangCard, explain: string) {
  return { lang: env.params.lang, task, target, model, explain };
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
    ...base(env, "hear", phrase.id, card, means(phrase)), tour: "lang-choose",
    hero: { kind: "hear", card }, show: "meaning", options, noRoman: false,
  });
}

export function say(env: Env, phrase: Phrase): Question | null {
  const options = optionsFor(env, phrase);
  if (!options) return null;
  const card = phraseCard(phrase);
  return make("say", phrase.id, LANG.engine.say(LANG.name[env.params.lang]), phrase.id, {
    ...base(env, "say", phrase.id, card, phrase.tip ?? LANG.engine.sayIt(phrase.en, spoken(phrase))), tour: "lang-choose",
    hero: { kind: "mean", card }, show: "phrase", options, noRoman: false,
  });
}

export function read(env: Env, phrase: Phrase): Question | null {
  const options = optionsFor(env, phrase);
  if (!options) return null;
  const card = phraseCard(phrase);
  return make("read", phrase.id, LANG.engine.read, phrase.id, {
    ...base(env, "read", phrase.id, card, means(phrase)), tour: "lang-choose",
    hero: { kind: "read", card }, show: "meaning", options, noRoman: true,
  });
}

export function pairs(env: Env, phrase: Phrase): Question | null {
  const size = env.ctx.easier ? 3 : 4;
  const rest = others(phrase, env.pool, size - 1, env.rng);
  if (rest.length < 2) return null;
  const left = shuffle(env.rng, [phrase, ...rest]).map(phraseCard);
  const ids = left.map((card) => card.id);
  return make("pairs", [...ids].sort().join("+"), LANG.engine.pairs, pairsAnswer(ids), {
    ...base(env, "pairs", phrase.id, phraseCard(phrase), means(phrase)), tour: "lang-pairs",
    left, right: shuffle(env.rng, left), noRoman: false,
  });
}

/** Shuffled so the tiles never arrive already in the right order (when they can differ). */
function scramble(rng: RNG, tiles: LangTile[], right: string[]): LangTile[] {
  for (let attempt = 0; attempt < 8; attempt++) {
    const mixed = shuffle(rng, tiles);
    if (mixed.slice(0, right.length).some((tile, i) => tile.text !== right[i])) return mixed;
  }
  return shuffle(rng, tiles);
}

/** Phrases with words to put in order. */
export function buildable(pool: Phrase[]): Phrase[] {
  return pool.filter((phrase) => (phrase.words?.length ?? 0) >= 2);
}

export function build(env: Env, phrase: Phrase): Question | null {
  const words = phrase.words ?? [];
  if (words.length < 2) return null;
  const used = new Set(words.map((word) => word.text));
  const spare = shuffle(env.rng, env.pool.flatMap((other) => other.words ?? [{ text: other.text, roman: other.roman }]))
    .filter((word) => !used.has(word.text) && !/\s/.test(word.text));
  const decoys: typeof spare = [];
  const wanted = env.ctx.easier ? 0 : 1 + Number(env.ctx.difficulty > 0.6);
  for (const word of spare) {
    if (decoys.length >= wanted) break;
    if (!decoys.some((taken) => taken.text === word.text)) decoys.push(word);
  }
  const right = words.map((word) => word.text);
  const tiles = [...words, ...decoys].map((word): LangTile => ({ text: word.text, say: word.text, ...(word.roman ? { roman: word.roman } : {}) }));
  return make("build", phrase.id, LANG.engine.build(LANG.name[env.params.lang]), buildAnswer(right, "word"), {
    ...base(env, "build", phrase.id, phraseCard(phrase), phrase.tip ?? LANG.engine.sayIt(phrase.en, spoken(phrase))), tour: "lang-build",
    unit: "word", hero: phraseCard(phrase), tiles: scramble(env.rng, tiles, right), rtl: env.params.lang === "ar",
  });
}

export function spell(env: Env, phrase: Phrase): Question | null {
  const letters = lettersOf(phrase.text);
  if (letters.length < 2) return null;
  const inWord = new Set(letters.map((letter) => letter.toLowerCase()));
  const source = env.params.alphabet.length
    ? env.params.alphabet.map((letter) => letter.char)
    : env.params.spell.flatMap((other) => lettersOf(other.text));
  const spare = [...new Set(shuffle(env.rng, source))].filter((letter) => !inWord.has(letter.toLowerCase()));
  const decoys = spare.slice(0, env.ctx.easier ? 1 : 2);
  const tiles = [...letters, ...decoys].map((text): LangTile => ({ text, say: "" }));
  return make("spell", phrase.id, LANG.engine.spell, buildAnswer(letters, "letter"), {
    ...base(env, "spell", phrase.id, phraseCard(phrase), means(phrase)), tour: "lang-build",
    unit: "letter", hero: phraseCard(phrase), tiles: scramble(env.rng, tiles, letters), rtl: env.params.lang === "ar",
  });
}

function phraseOf(env: Env, id: string | undefined): Phrase | undefined {
  return id ? env.pool.find((phrase) => phrase.id === id) : undefined;
}

export function scene(env: Env, moment: Scene): Question | null {
  const replies = moment.reply.map((id) => phraseOf(env, id)).filter((phrase): phrase is Phrase => Boolean(phrase));
  const right = replies[0];
  if (!right) return null;
  const fine = (moment.alsoOk ?? []).map((id) => phraseOf(env, id)).filter((phrase): phrase is Phrase => Boolean(phrase));
  const line = phraseOf(env, moment.line);
  const options = optionsFor(env, right, [...replies.slice(1), ...fine, ...(line ? [line] : [])]);
  if (!options) return null;
  return make("scene", moment.id, LANG.engine.scene, right.id, {
    ...base(env, "scene", moment.id, phraseCard(right), right.tip ?? LANG.engine.means(spoken(right), right.en)), tour: "lang-choose",
    hero: { kind: "scene", setup: moment.setup, ...(moment.who ? { who: moment.who } : {}), ...(line ? { line: phraseCard(line) } : {}) },
    show: "phrase", options, noRoman: false,
  });
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
